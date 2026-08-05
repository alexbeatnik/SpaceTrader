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
    },
    // A desktop window has no back gesture, and closing it is the title bar's
    // job — not something a game screen decides.
    onBackButton: () => () => {},
    exitApp: () => {},
    // Fire-and-forget: the renderer has nothing to do with the answer, and the
    // blocker's own bookkeeping lives in main. Swallowed rather than merely
    // `void`ed — a screen that dims is not worth an unhandled rejection, and
    // this is called from an effect cleanup where nothing can act on a failure.
    keepAwake: (on) => void api.setKeepAwake(on).catch(() => {})
  }
}
