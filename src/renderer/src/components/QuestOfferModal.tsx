import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import {
  questSupply,
  questSupplyMissing,
  questSupplyUnitPrice,
  freeCargoBays
} from '@game/index'
import { goodName } from '@i18n/index'
import { questDescription, questTypeLabel } from '../util/questText'
import { fmt } from '../util/format'

const ICON: Record<string, string> = {
  delivery: '📦',
  relief: '⛑️',
  bounty: '🎯',
  passenger: '🧳',
  smuggle: '🕶️',
  fetch: '📥'
}

export function QuestOfferModal(): React.JSX.Element | null {
  const game = useGameStore((s) => s.game)
  const offer = useGameStore((s) => s.questOffer)
  const accept = useGameStore((s) => s.acceptQuestOffer)
  const acceptBuying = useGameStore((s) => s.acceptQuestOfferBuying)
  const decline = useGameStore((s) => s.declineQuestOffer)
  const { t } = useI18n()

  if (!offer || !game) return null

  // Cargo-backed quests can have their required goods bought on the spot.
  const supply = questSupply(offer)
  const missing = supply ? questSupplyMissing(game, offer) : 0
  const unit = supply ? questSupplyUnitPrice(game, supply.good) : 0
  const supplyCost = missing * unit
  const canBuySupplies =
    missing > 0 && supplyCost <= game.credits && missing <= freeCargoBays(game.ship)

  return (
    <div className="overlay">
      <div className="modal modal-narrow modal-center">
        <div className="ship-emoji" style={{ fontSize: 44, marginBottom: 6 }}>{ICON[offer.type]}</div>
        <h2>{t('quest.offerTitle')}</h2>
        <div className="badge" style={{ margin: '4px 0 12px' }}>{questTypeLabel(offer)}</div>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 16 }}>
          {questDescription(offer, game)}
        </p>
        <div className="kv">
          <span className="k">{t('quest.reward')}</span>
          <span className="v pos">{fmt(offer.reward)} {t('common.cr')}</span>
        </div>

        {supply && missing > 0 && (
          <div className="kv">
            <span className="k">{t('quest.supplies')}</span>
            <span className="v">
              {missing} × {goodName(supply.good)} · {fmt(supplyCost)} {t('common.cr')}
            </span>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={accept}>
            {t('quest.accept')}
          </button>
          <button className="btn" onClick={decline}>
            {t('quest.decline')}
          </button>
        </div>

        {supply && missing > 0 && (
          <button
            className="btn btn-block"
            style={{ marginTop: 10 }}
            disabled={!canBuySupplies}
            onClick={acceptBuying}
          >
            🛒 {t('quest.acceptAndBuy')} · {fmt(supplyCost)} {t('common.cr')}
          </button>
        )}
        {supply && missing > 0 && !canBuySupplies && (
          <div className="screen-sub" style={{ marginTop: 6, marginBottom: 0 }}>
            {supplyCost > game.credits ? t('error.notEnoughCredits') : t('error.cannotBuy')}
          </div>
        )}
      </div>
    </div>
  )
}
