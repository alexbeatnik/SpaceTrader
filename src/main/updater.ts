import { app, ipcMain, type BrowserWindow } from 'electron'
import electronUpdater from 'electron-updater'
import type { UpdateStatus } from '../shared/updates'

export type { UpdateStatus }

/**
 * Self-update from GitHub Releases.
 *
 * The provider and repository come from `build.publish` in package.json; the
 * release workflow uploads `latest.yml` alongside the installer, which is the
 * file this reads to decide whether a newer build exists.
 *
 * Downloads happen in the background and install when the player quits, so a
 * jump is never interrupted by an update. Nothing is forced: the renderer is
 * told what is happening and can offer to restart early.
 */

// electron-updater ships as CommonJS with a default export; main is bundled as
// CJS too, so the named import has to come off the default object.
const { autoUpdater } = electronUpdater

let status: UpdateStatus = { state: 'idle' }
let target: BrowserWindow | null = null

function publish(next: UpdateStatus): void {
  status = next
  if (target && !target.isDestroyed()) target.webContents.send('update:status', next)
}

export function setupUpdater(window: BrowserWindow): void {
  target = window

  // A dev run has no installer to replace, and electron-updater throws rather
  // than no-ops if asked to check.
  if (!app.isPackaged) {
    status = { state: 'unsupported' }
    registerIpc()
    return
  }

  autoUpdater.autoDownload = true
  // Swap the installed build on quit rather than yanking the player out of a run.
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => publish({ state: 'checking' }))
  autoUpdater.on('update-not-available', () => publish({ state: 'current' }))
  autoUpdater.on('update-available', (info) => publish({ state: 'available', version: info.version }))
  autoUpdater.on('download-progress', (p) =>
    publish({
      state: 'downloading',
      version: status.state === 'available' || status.state === 'downloading' ? status.version : '',
      percent: Math.round(p.percent)
    })
  )
  autoUpdater.on('update-downloaded', (info) => publish({ state: 'ready', version: info.version }))
  autoUpdater.on('error', (err) => publish(asStatus(err)))

  registerIpc()

  // Let the window paint and the player get going before touching the network.
  setTimeout(() => void check(), 4000)
}

/**
 * Turn a thrown updater error into something worth showing. A repository with
 * no releases yet is not a failure — there is simply nothing newer to install,
 * and reporting it as a connection problem would be a lie the player acts on.
 */
function asStatus(err: unknown): UpdateStatus {
  const message = err instanceof Error ? err.message : String(err)
  if (/no published versions/i.test(message)) return { state: 'current' }
  return { state: 'error', message }
}

async function check(): Promise<void> {
  if (!app.isPackaged) return
  try {
    await autoUpdater.checkForUpdates()
  } catch (err) {
    // No network, a rate limit, a malformed release — none of it should reach
    // the player as anything worse than "could not check".
    publish(asStatus(err))
  }
}

let ipcReady = false
function registerIpc(): void {
  if (ipcReady) return
  ipcReady = true

  ipcMain.handle('update:status', () => status)
  ipcMain.handle('update:check', async () => {
    await check()
    return status
  })
  ipcMain.handle('update:install', () => {
    if (status.state !== 'ready') return false
    // isSilent false so the player sees the installer do its work; the app is
    // closed and relaunched on the new version.
    autoUpdater.quitAndInstall(false, true)
    return true
  })
}
