import type { SpaceTraderApi } from './index'

declare global {
  interface Window {
    /**
     * Present only on the desktop, where the preload script installs it. The
     * Android build serves the same renderer with no preload at all, so this is
     * optional and its absence is how the platform layer tells the hosts apart.
     */
    api?: SpaceTraderApi
  }
}

export {}
