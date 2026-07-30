import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { renderMessage } from '@i18n/index'

export function EventModal(): React.JSX.Element | null {
  const event = useGameStore((s) => s.event)
  const dismiss = useGameStore((s) => s.dismissEvent)
  const { t } = useI18n()

  if (!event) return null

  return (
    <div className="overlay">
      <div className="modal modal-narrow modal-center">
        <div className="ship-emoji" style={{ fontSize: 48, marginBottom: 8 }}>✨</div>
        <h2>{t(event.titleKey)}</h2>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.5, margin: '10px 0 20px' }}>
          {/* The news tip carries a status i18n key in its `status` param;
              `renderMessage` localises that itself. */}
          {renderMessage(event.bodyKey, event.params)}
        </p>
        <button className="btn btn-primary btn-block" onClick={dismiss}>
          {t('encounter.action.continue')}
        </button>
      </div>
    </div>
  )
}
