import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { isSaveSlotId, type SaveSlotInfo } from '../shared/saves'
import { createSaveStore } from './saveStore'
import { setupUpdater } from './updater'

const saves = createSaveStore(() => join(app.getPath('userData'), 'saves'))

/**
 * Where the saves sat while the app was called "star-trader". userData is
 * derived from package.json's `name`, so renaming the game to "space-trader"
 * pointed it at a fresh, empty folder — to the player that looks exactly like
 * every commander they ever had being wiped by an update.
 */
const previousSaveDir = (): string => join(app.getPath('appData'), 'star-trader', 'saves')

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
    title: 'Space Trader',
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
// Slot ids arrive from the renderer, so they are checked against the fixed set
// before they can reach a file path; everything past that point is the save
// store's business.
ipcMain.handle('save:write', async (_e, slot: unknown, data: unknown) => {
  if (!isSaveSlotId(slot) || typeof data !== 'string') return false
  return saves.write(slot, data)
})

ipcMain.handle('save:read', async (_e, slot: unknown) => {
  if (!isSaveSlotId(slot)) return null
  return saves.read(slot)
})

ipcMain.handle('save:delete', async (_e, slot: unknown) => {
  if (!isSaveSlotId(slot)) return false
  return saves.remove(slot)
})

ipcMain.handle('save:list', (): Promise<SaveSlotInfo[]> => saves.list())

app.whenReady().then(async () => {
  await saves.adoptSavesFrom(previousSaveDir())
  await saves.migrateLegacySave()
  await saves.sweepScratchFiles()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

/**
 * The player's last action is exactly the one they would notice missing, and
 * closing the window used to abandon whatever save it had just started. Hold
 * the quit open until the queue has drained.
 */
let flushing = false
app.on('before-quit', (event) => {
  if (flushing || !saves.hasPending()) return
  event.preventDefault()
  flushing = true
  void saves.flush().then(() => app.quit())
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
