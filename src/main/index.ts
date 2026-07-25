import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { readFile, writeFile, mkdir, rename, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import {
  AUTO_SLOT,
  SAVE_SLOT_IDS,
  isSaveSlotId,
  parseSaveFile,
  type SaveSlotId,
  type SaveSlotInfo
} from '../shared/saves'
import { setupUpdater } from './updater'

const SAVE_DIR = () => join(app.getPath('userData'), 'saves')
const slotFile = (slot: SaveSlotId): string => join(SAVE_DIR(), `slot-${slot}.json`)
/** The single save file used before slots existed. */
const LEGACY_FILE = () => join(SAVE_DIR(), 'savegame.json')

function createWindow(): void {
  // In dev the icon lives in the project's build/ dir; packaged builds embed it
  // into the exe (electron-builder), so a missing path here is harmless. The
  // key is omitted rather than set to undefined — Electron treats a present
  // `icon: undefined` as a bad argument and warns about it on every launch.
  const iconPath = join(__dirname, '../../build/icon.png')
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#05060f',
    title: 'Star Trader',
    ...(existsSync(iconPath) ? { icon: iconPath } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  setupUpdater(mainWindow)

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // electron-vite injects ELECTRON_RENDERER_URL in dev
  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// --- Persistence IPC ---------------------------------------------------------
async function ensureSaveDir(): Promise<void> {
  const dir = SAVE_DIR()
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })
}

/**
 * Move a pre-slots `savegame.json` into the autosave slot so an in-progress
 * voyage survives the upgrade. Runs once — after the move the file is gone.
 */
async function migrateLegacySave(): Promise<void> {
  try {
    if (!existsSync(LEGACY_FILE()) || existsSync(slotFile(AUTO_SLOT))) return
    await ensureSaveDir()
    await rename(LEGACY_FILE(), slotFile(AUTO_SLOT))
  } catch {
    // A failed migration must never keep the app from starting; the legacy
    // file is left untouched and the player simply starts a new voyage.
  }
}

/**
 * Counter that keeps concurrent writes off each other's scratch file. The
 * renderer fires autosaves without awaiting them, so two writes to one slot can
 * genuinely overlap — sharing a single `.tmp` path let them interleave their
 * bytes and rename the mess over a good save.
 */
let tmpCounter = 0

ipcMain.handle('save:write', async (_e, slot: unknown, data: unknown) => {
  if (!isSaveSlotId(slot) || typeof data !== 'string') return false
  const target = slotFile(slot)
  const tmp = `${target}.${process.pid}.${++tmpCounter}.tmp`
  try {
    await ensureSaveDir()
    // Write-then-rename: autosaves fire after every action, and a crash or a
    // full disk mid-write must never leave a truncated file where a good save
    // used to be. The rename is atomic, so overlapping writes simply mean the
    // last one to finish wins — with a whole file, never half of two.
    await writeFile(tmp, data, 'utf-8')
    await rename(tmp, target)
    return true
  } catch {
    // Disk errors must not reject into the renderer's fire-and-forget save.
    // Clear the scratch file so a failing disk cannot litter the save folder.
    await unlink(tmp).catch(() => {})
    return false
  }
})

ipcMain.handle('save:read', async (_e, slot: unknown) => {
  if (!isSaveSlotId(slot)) return null
  try {
    const file = slotFile(slot)
    if (!existsSync(file)) return null
    return await readFile(file, 'utf-8')
  } catch {
    return null
  }
})

ipcMain.handle('save:delete', async (_e, slot: unknown) => {
  if (!isSaveSlotId(slot)) return false
  try {
    const file = slotFile(slot)
    if (existsSync(file)) await unlink(file)
    return true
  } catch {
    return false
  }
})

ipcMain.handle('save:list', async (): Promise<SaveSlotInfo[]> => {
  const out: SaveSlotInfo[] = []
  for (const slot of SAVE_SLOT_IDS) {
    const file = slotFile(slot)
    if (!existsSync(file)) {
      out.push({ slot, meta: null })
      continue
    }
    try {
      const parsed = parseSaveFile(await readFile(file, 'utf-8'))
      // A file that exists but will not parse is reported as damaged rather
      // than empty, so the player can tell "nothing here" from "lost".
      out.push(parsed ? { slot, meta: parsed.meta } : { slot, meta: null, corrupt: true })
    } catch {
      out.push({ slot, meta: null, corrupt: true })
    }
  }
  return out
})

app.whenReady().then(async () => {
  await migrateLegacySave()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
