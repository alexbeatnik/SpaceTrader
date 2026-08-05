import { useEffect } from 'react'
import { getPlatform } from '../platform'

/**
 * Hold the display awake for as long as `active` is true.
 *
 * The policy lives here and the mechanism lives in `platform/`, the same split
 * `useBackButton` uses: the desktop blocks display sleep from the main process
 * and the phone takes a screen wake lock, and neither of those belongs in a
 * component. Hosts that cannot do it at all no-op, so nothing here has to ask
 * where it is running.
 *
 * The cleanup releases it, which covers quitting to the menu, and the effect
 * re-runs rather than toggling on every render because `active` is a boolean.
 */
export function useKeepAwake(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const platform = getPlatform()
    platform.keepAwake(true)
    return () => platform.keepAwake(false)
  }, [active])
}
