/**
 * The desktop host: everything is already behind the preload bridge, so this is
 * a thin renaming of `window.api` onto the platform ports.
 */

import type { Platform } from './types'

export function createElectronPlatform(): Platform {
  const api = window.api!
  return {
    kind: 'electron',
    touch: false,
    saves: {
      save: (slot, data) => api.saveGame(slot, data),
      load: (slot) => api.loadGame(slot),
      remove: (slot) => api.deleteSave(slot),
      list: () => api.listSaves(),
      // The queue lives in the main process here, and `before-quit` already
      // holds the app open until it drains.
      flush: () => Promise.resolve()
    },
    updates: {
      status: () => api.updateStatus(),
      check: () => api.checkForUpdate(),
      install: () => api.installUpdate(),
      subscribe: (cb) => api.onUpdateStatus(cb)
    }
  }
}
