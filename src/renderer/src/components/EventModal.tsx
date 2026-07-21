import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { renderMessage } from '@i18n/index'

export function EventModal(): React.JSX.Element | null {
  const event = useGameStore((s) => s.event)
  const dismiss = useGameStore((s) => s.dismissEvent)
  const { t } = useI18n()

  if (!event) return null

  // The news tip encodes a status i18n key in its `status` param.
  const params = { ...event.params }
  if (typeof params.status === 'string' && params.status.startsWith('status.')) {
    params.status = t(params.status)
  }

  return (
    <div className="overlay">
      <div className="modal" style={{ width: 440, textAlign: 'center' }}>
        <div className="ship-emoji" style={{ fontSize: 48, marginBottom: 8 }}>✨</div>
        <h2 style={{ justifyContent: 'center' }}>{t(event.titleKey)}</h2>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.5, margin: '10px 0 20px' }}>
          {renderMessage(event.bodyKey, params)}
        </p>
        <button className="btn btn-primary btn-block" onClick={dismiss}>
          {t('encounter.action.continue')}
        </button>
      </div>
    </div>
  )
}
