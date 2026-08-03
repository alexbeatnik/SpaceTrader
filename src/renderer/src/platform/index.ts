/**
 * Which host the game is running in, decided once at startup.
 *
 * The desktop is identified by the preload bridge rather than by asking
 * Capacitor: `window.api` exists only because Electron's preload script put it
 * there, which is a fact about this build rather than a guess. Everything else
 * — Android, and a plain browser tab during web dev — goes through Capacitor,
 * whose plugins ship web implementations for exactly that case.
 */

import { createElectronPlatform } from './electron'
import { createCapacitorPlatform, sweepScratchFiles } from './capacitor'
import type { Platform } from './types'

export type { Platform, SavesPort, UpdatesPort } from './types'

let cached: Platform | null = null

export function getPlatform(): Platform {
  if (cached) return cached
  cached =
    typeof window !== 'undefined' && window.api
      ? createElectronPlatform()
      : createCapacitorPlatform()
  return cached
}

/** Shorthand for the many call sites that only want the saves port. */
export const saves = (): Platform['saves'] => getPlatform().saves

/**
 * Startup and lifecycle wiring that only the mobile host needs.
 *
 * Android gives no equivalent of `before-quit`: a backgrounded app is killed
 * without ceremony whenever the system wants the memory, and the autosave the
 * player's last action queued would go with it. `appStateChange` is the last
 * moment anything is guaranteed to run, so the queue is drained there.
 */
export async function initPlatform(): Promise<void> {
  const platform = getPlatform()
  if (platform.kind === 'electron') return

  await sweepScratchFiles()

  // The game runs full-screen: its own HUD is the only chrome the player should
  // see, so the status bar (clock, battery, signal) is hidden. A swipe down from
  // the top edge brings it back transiently — sticky immersive — which is how
  // Android still lets the player reach notifications without leaving the run.
  // Re-hidden on resume, because some devices show the bar again when the app
  // comes back from the background.
  let hideStatusBar: () => Promise<void> = async () => {}
  if (platform.kind === 'android') {
    const { StatusBar } = await import('@capacitor/status-bar')
    hideStatusBar = () => StatusBar.hide().catch(() => {})
    await hideStatusBar()
  }

  const { App } = await import('@capacitor/app')
  await App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) void hideStatusBar()
    else void platform.saves.flush()
  })
}
