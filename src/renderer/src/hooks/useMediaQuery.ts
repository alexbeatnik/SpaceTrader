import { useEffect, useState } from 'react'

/**
 * Track a media query from React.
 *
 * Most of the layout adapts in CSS, where it belongs. This is for the cases
 * that cannot: SVG geometry written as attributes, where the value itself has
 * to differ rather than the styling of it.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.(query).matches === true
  )

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(query)
    const onChange = (): void => setMatches(mql.matches)
    // Rotating the device changes the answer, and so does the first paint
    // landing before this effect ran.
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** The narrow, upright layout: one column, bottom tabs, fat tap targets. */
export const PHONE_PORTRAIT = '(orientation: portrait) and (max-width: 860px)'
