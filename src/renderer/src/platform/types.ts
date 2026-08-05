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
  /**
   * Subscribe to the host's system-level "back" gesture; returns an
   * unsubscribe. Hosts that have no such gesture — a desktop window, a browser
   * tab — return a no-op, so `useBackButton` never has to ask which host it is
   * running in.
   */
  onBackButton(handler: () => void): () => void
  /**
   * Leave the app, where leaving is a thing the app can do at all. Android's
   * back press out of the menu is the only caller; everywhere else the window
   * or tab belongs to the user, so this does nothing.
   */
  exitApp(): void
  /**
   * Hold the display awake while a voyage is on screen, and let it sleep again
   * when there is none.
   *
   * This game is played in long stretches with nothing to touch: a jump runs
   * ten to thirty seconds on its own, a mining run loops for as long as the
   * player leaves it, and reading a market table is entirely motionless. All of
   * that reads as "idle" to the system, so the screen dims and locks mid-run.
   *
   * Held only while a game is in progress — the menu is a place you leave the
   * app sitting, and keeping a phone lit there would be a battery bug rather
   * than a feature.
   */
  keepAwake(on: boolean): void
}
