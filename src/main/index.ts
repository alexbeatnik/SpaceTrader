import { app, shell, BrowserWindow, ipcMain, powerSaveBlocker } from 'electron'
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

  setupUpdater(mainWindow, () => saves.flush())

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

/**
 * Keep the display awake while a voyage is on screen.
 *
 * `powerSaveBlocker` rather than the renderer's `navigator.wakeLock`: the web
 * API is grantable only to a visible page and is revoked whenever the page is
 * hidden, which on the desktop includes minimising the window — and a jump or a
 * mining run left going in a minimised window is precisely when the player
 * expects the machine to stay up. This is also the documented Electron route.
 *
 * `prevent-display-sleep`, not `prevent-app-suspension`: the game has no reason
 * to stop a machine suspending when the player has walked away from it, only to
 * stop the screen blanking while they are watching it.
 */
let keepAwakeId: number | null = null

const setKeepAwake = (on: boolean): void => {
  if (on && keepAwakeId === null) {
    keepAwakeId = powerSaveBlocker.start('prevent-display-sleep')
  } else if (!on && keepAwakeId !== null) {
    // Guarded: stopping an id the blocker no longer knows about throws, and a
    // quit racing a release must not take the app down on its way out.
    if (powerSaveBlocker.isStarted(keepAwakeId)) powerSaveBlocker.stop(keepAwakeId)
    keepAwakeId = null
  }
}

ipcMain.handle('power:keepAwake', (_e, on: unknown) => {
  setKeepAwake(on === true)
  return keepAwakeId !== null
})

/**
 * One copy of the game at a time.
 *
 * Two of them are never harmless: both autosave into the same seven files in
 * userData with no lock between the processes, so whichever writes last wins and
 * the other player's voyage is gone. On Windows a second copy also keeps the
 * installed exe open, and that is exactly what makes a self-update fail — the
 * updater closes the instance that asked for it, the installer finds the other
 * one still holding the program folder, and reports that the application is
 * running. Launching again now raises the window that already exists.
 */
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [existing] = BrowserWindow.getAllWindows()
    if (!existing) return
    if (existing.isMinimized()) existing.restore()
    existing.focus()
  })

  app.whenReady().then(async () => {
    await saves.adoptSavesFrom(previousSaveDir())
    await saves.migrateLegacySave()
    await saves.sweepScratchFiles()
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

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
  // `finally`, not `then`: this is the only quit left in flight, so a flush that
  // rejects would leave the app running forever with its window gone — and a
  // process that never exits is one that keeps holding its own program folder,
  // which is what a Windows update fails on.
  void saves.flush().finally(() => app.quit())
})

app.on('window-all-closed', () => {
  // On macOS the app outlives its window, and a blocker left running there
  // would hold the display awake for an app with nothing on screen.
  setKeepAwake(false)
  if (process.platform !== 'darwin') app.quit()
})
