import type { SpaceTraderApi } from './index'

declare global {
  interface Window {
    api: SpaceTraderApi
  }
}

export {}
