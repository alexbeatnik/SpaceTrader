/**
 * What the game needs from whatever is hosting it.
 *
 * The renderer used to reach straight for `window.api`, which only exists
 * because a preload script put it there — true on the desktop, false inside an
 * Android WebView. Everything platform-shaped is named here instead, so the
 * screens and the store talk to an interface and the two hosts each supply
 * their own answer.
 */

import type { SaveSlotId, SaveSlotInfo } from '@shared/saves'
import type { UpdateStatus } from '@shared/updates'

/** Reading and writing the player's voyages, wherever they live. */
export interface SavesPort {
  save(slot: SaveSlotId, data: string): Promise<boolean>
  load(slot: SaveSlotId): Promise<string | null>
  remove(slot: SaveSlotId): Promise<boolean>
  list(): Promise<SaveSlotInfo[]>
  /**
   * Wait for every queued write to reach storage. On the desktop the main
   * process already holds the quit open for this, so it is a no-op; on Android
   * nothing holds anything open — the system kills a backgrounded app whenever
   * it wants the memory — so this runs the moment the player switches away.
   */
  flush(): Promise<void>
}

/** Self-update, on hosts that install their own new versions. */
export interface UpdatesPort {
  status(): Promise<UpdateStatus>
  check(): Promise<UpdateStatus>
  install(): Promise<boolean>
  /** Subscribe to progress; returns an unsubscribe function. */
  subscribe(cb: (status: UpdateStatus) => void): () => void
}

export interface Platform {
  /** Which host this is, for the handful of places that must genuinely care. */
  kind: 'electron' | 'android' | 'ios' | 'web'
  /** True on a phone or tablet: drives the touch layout, not the storage choice. */
  touch: boolean
  saves: SavesPort
  /**
   * null where the host owns updates itself — on Android that is the Play
   * Store, and offering the player a "check for updates" button that can only
   * ever say "unsupported" is worse than showing nothing.
   */
  updates: UpdatesPort | null
}
