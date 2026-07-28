/**
 * What the renderer is told about the update process.
 *
 * Lives in shared rather than beside the Electron updater because the renderer
 * is now built for two platforms: on Android the whole updater is absent — Play
 * Store owns installing new versions — and the UI still has to be able to name
 * the states it will never see. Importing the type from `main/` would drag an
 * `electron-updater` import into the mobile bundle's module graph for nothing.
 */
export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'unsupported' }
  | { state: 'checking' }
  | { state: 'current' }
  | { state: 'available'; version: string }
  | { state: 'downloading'; version: string; percent: number }
  | { state: 'ready'; version: string }
  | { state: 'error'; message: string }
