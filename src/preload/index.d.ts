import type { StarTraderApi } from './index'

declare global {
  interface Window {
    api: StarTraderApi
  }
}

export {}
