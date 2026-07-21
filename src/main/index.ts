import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

const SAVE_DIR = () => join(app.getPath('userData'), 'saves')
const SAVE_FILE = () => join(SAVE_DIR(), 'savegame.json')

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#05060f',
    title: 'Star Trader',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

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
ipcMain.handle('save:write', async (_e, data: string) => {
  const dir = SAVE_DIR()
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })
  await writeFile(SAVE_FILE(), data, 'utf-8')
  return true
})

ipcMain.handle('save:read', async () => {
  const file = SAVE_FILE()
  if (!existsSync(file)) return null
  return await readFile(file, 'utf-8')
})

ipcMain.handle('save:exists', async () => existsSync(SAVE_FILE()))

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
