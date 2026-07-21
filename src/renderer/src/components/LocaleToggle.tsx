import { useI18n } from '../hooks/useI18n'
import { LOCALES, type Locale } from '@i18n/index'

export function LocaleToggle(): React.JSX.Element {
  const { locale, setLocale } = useI18n()
  return (
    <div className="lang-toggle">
      {LOCALES.map((l: Locale) => (
        <button
          key={l}
          className={l === locale ? 'active' : ''}
          onClick={() => setLocale(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
