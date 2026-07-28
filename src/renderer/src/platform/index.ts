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

  if (platform.kind === 'android') {
    // The HUD runs right up to the status bar, so a default light bar puts dark
    // icons on the game's near-black chrome. `Style.Dark` means light content,
    // which is the pairing that actually matches.
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
    await StatusBar.setBackgroundColor({ color: '#05060f' }).catch(() => {})
  }

  const { App } = await import('@capacitor/app')
  await App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) void platform.saves.flush()
  })
}
