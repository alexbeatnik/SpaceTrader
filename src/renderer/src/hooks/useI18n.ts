import { useSyncExternalStore, useCallback } from 'react'
import { t, getLocale, setLocale, subscribeLocale, type Locale } from '@i18n/index'

/** React hook that re-renders when the active locale changes. */
export function useI18n(): {
  t: typeof t
  locale: Locale
  setLocale: (l: Locale) => void
} {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, getLocale)
  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      void locale // re-bind to locale so memo invalidates on change
      return t(key, params)
    },
    [locale]
  )
  return { t: translate, locale, setLocale }
}
