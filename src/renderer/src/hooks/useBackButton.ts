import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { getPlatform } from '../platform'

/**
 * Android's back gesture, mapped onto the game's own idea of "back".
 *
 * Android treats an unhandled back press as "leave the app", which for a game
 * with no browser history means one careless swipe drops the player out of a
 * voyage. So every press is handled here, walking outwards one step at a time:
 * a screen falls back to the system map, the system map to the menu, and only
 * the menu actually exits.
 *
 * The store is read through `getState()` rather than subscribed to, so the
 * listener is registered once for the life of the app instead of being torn
 * down and rebuilt on every jump, sale and shot fired.
 */
export function useBackButton(): void {
  useEffect(() => {
    if (getPlatform().kind !== 'android') return

    let dispose: (() => void) | undefined
    let cancelled = false

    void import('@capacitor/app').then(async ({ App }) => {
      const handle = await App.addListener('backButton', () => {
        const s = useGameStore.getState()

        // Anything demanding a decision swallows the press. A boarding party,
        // a quest offer or the end of a run is not something to be dismissed
        // by the gesture people make without looking — and combat in
        // particular can be fled, but only deliberately.
        if (
          s.travel ||
          s.mining ||
          s.escort ||
          s.encounter ||
          s.incident ||
          s.gameOver ||
          s.event ||
          s.questOffer ||
          s.questReward
        ) {
          return
        }

        if (!s.game || s.screen === 'menu') {
          void App.exitApp()
          return
        }

        // The system map is the hub every other screen hangs off, so it is the
        // one step back from all of them.
        if (s.screen !== 'systemMap') {
          s.setScreen('systemMap')
          return
        }

        // Autosaves have already put the run on disk, so the menu's Continue
        // picks it straight back up — this loses nothing.
        s.quitToMenu()
      })

      if (cancelled) void handle.remove()
      else dispose = () => void handle.remove()
    })

    return () => {
      cancelled = true
      dispose?.()
    }
  }, [])
}
