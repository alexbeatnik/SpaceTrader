import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { questDescription, questTypeLabel } from '../util/questText'
import { fmt } from '../util/format'

const ICON: Record<string, string> = {
  delivery: '📦',
  relief: '⛑️',
  bounty: '🎯'
}

export function QuestOfferModal(): React.JSX.Element | null {
  const game = useGameStore((s) => s.game)
  const offer = useGameStore((s) => s.questOffer)
  const accept = useGameStore((s) => s.acceptQuestOffer)
  const decline = useGameStore((s) => s.declineQuestOffer)
  const { t } = useI18n()

  if (!offer || !game) return null

  return (
    <div className="overlay">
      <div className="modal" style={{ width: 460, textAlign: 'center' }}>
        <div className="ship-emoji" style={{ fontSize: 44, marginBottom: 6 }}>{ICON[offer.type]}</div>
        <h2 style={{ justifyContent: 'center' }}>{t('quest.offerTitle')}</h2>
        <div className="badge" style={{ margin: '4px 0 12px' }}>{questTypeLabel(offer)}</div>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 16 }}>
          {questDescription(offer, game)}
        </p>
        <div className="kv">
          <span className="k">{t('quest.reward')}</span>
          <span className="v pos">{fmt(offer.reward)} {t('common.cr')}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={accept}>
            {t('quest.accept')}
          </button>
          <button className="btn" style={{ flex: 1 }} onClick={decline}>
            {t('quest.decline')}
          </button>
        </div>
      </div>
    </div>
  )
}
