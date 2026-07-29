import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { renderMessage, goodName } from '@i18n/index'
import { shipName } from '@i18n/index'
import {
  maxHull,
  totalShieldPower,
  currentShieldCharge,
  freeCargoBays,
  GOOD_IDS,
  type GoodId,
  type EncounterKind
} from '@game/index'
import { fmt } from '../util/format'
import { ShipArt } from './ShipArt'
import { AmountModal } from './AmountModal'

type TradeDialog = { mode: 'buy' | 'sell'; good: GoodId } | null

/**
 * Every opponent is tinted by its kind, so an enemy hull never comes out in the
 * same colours as yours — which used to make an identical ship type on both
 * sides impossible to tell apart. Your own ship keeps its native palette.
 */
const OPPONENT_ACCENT: Record<EncounterKind, string> = {
  alien: '#b06bff',
  pirate: '#ff5d6c',
  bountyHunter: '#ff7a3c',
  police: '#ffc04a',
  trader: '#38e08a'
}

export function CombatModal(): React.JSX.Element | null {
  const game = useGameStore((s) => s.game)!
  const enc = useGameStore((s) => s.encounter)!
  const combatAction = useGameStore((s) => s.combatAction)
  const plunderNow = useGameStore((s) => s.plunderNow)
  const tradeBuyFromTrader = useGameStore((s) => s.tradeBuyFromTrader)
  const tradeSellToTrader = useGameStore((s) => s.tradeSellToTrader)
  const dismiss = useGameStore((s) => s.dismissEncounter)
  const { t } = useI18n()
  const [tradeDialog, setTradeDialog] = useState<TradeDialog>(null)

  if (!enc) return null
  const opp = enc.opponent
  const ship = game.ship
  const terminal = enc.status !== 'ongoing'
  const canTrade = enc.kind === 'trader' && !terminal && !!enc.trade

  const maxTradeBuy = (id: GoodId): number => {
    const offer = enc.trade?.sells[id]
    if (!offer || offer.price <= 0) return 0
    return Math.min(offer.qty, freeCargoBays(ship), Math.floor(game.credits / offer.price))
  }

  const kindColor =
    enc.kind === 'pirate' || enc.kind === 'alien'
      ? 'bad'
      : enc.kind === 'police' || enc.kind === 'bountyHunter'
        ? 'warn'
        : ''
  const oppAccent = OPPONENT_ACCENT[enc.kind]

  return (
    <div className="overlay">
      <div className="modal">
        <h2>
          ⚠ {t('encounter.title')}{' '}
          <span className={`badge ${kindColor}`} style={{ marginLeft: 8 }}>
            {t(`encounter.kind.${enc.kind}`)}
          </span>
          {enc.fleetSize > 1 && (
            <span className={`badge ${kindColor}`} style={{ marginLeft: 6 }}>
              🚀 {Math.max(0, enc.fleetSize - enc.defeated)}/{enc.fleetSize}
            </span>
          )}
          {enc.tractorLocked && (
            <span className="badge bad" style={{ marginLeft: 6 }}>
              🧲 {t('encounter.tractor.badge')}
            </span>
          )}
        </h2>

        {enc.fleetSize > 1 && (
          <div className="fleet-dots" style={{ marginBottom: 12 }}>
            {Array.from({ length: enc.fleetSize }).map((_, i) => (
              <span
                key={i}
                className={`fleet-dot ${i < enc.defeated ? 'down' : i === enc.defeated ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        {/* Opponent status */}
        <div
          className="ship-visual side-opponent"
          style={{ marginBottom: 12, borderLeftColor: oppAccent }}
        >
          <ShipArt type={opp.shipType} size={64} flip accent={oppAccent} />
          <div style={{ flex: 1 }}>
            <div className="side-label" style={{ color: oppAccent }}>
              ⚔ {t(`encounter.kind.${enc.kind}`)}
            </div>
            <div className="kv">
              <span className="k">{shipName(opp.shipType)}</span>
              {/* Against the opponent's own maximum, not the hull's base
                  rating: aliens and bounty hunters fly reinforced ships, which
                  used to read as "90/60" on a bar pinned past full. */}
              <span className="v">{t('ship.hull')}: {Math.max(0, opp.hull)}/{opp.maxHull}</span>
            </div>
            <div className="meter">
              <div className="meter-fill hull" style={{ width: `${Math.max(0, (opp.hull / opp.maxHull) * 100)}%` }} />
            </div>
            {opp.maxShield > 0 && (
              <div className="meter" style={{ marginTop: 4 }}>
                <div className="meter-fill shield" style={{ width: `${Math.max(0, (opp.shieldPoints / opp.maxShield) * 100)}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Player status */}
        <div className="ship-visual side-player" style={{ marginBottom: 12 }}>
          <ShipArt type={ship.type} size={64} />
          <div style={{ flex: 1 }}>
            <div className="side-label player">
              👤 {t('encounter.you')} · {game.commanderName}
            </div>
            <div className="kv">
              <span className="k">{shipName(ship.type)}</span>
              <span className="v">{t('ship.hull')}: {Math.max(0, ship.hull)}/{maxHull(ship)}</span>
            </div>
            <div className="meter">
              <div className="meter-fill hull" style={{ width: `${Math.max(0, (ship.hull / maxHull(ship)) * 100)}%` }} />
            </div>
            {totalShieldPower(ship) > 0 && (
              <div className="meter" style={{ marginTop: 4 }}>
                <div className="meter-fill shield" style={{ width: `${(currentShieldCharge(ship) / totalShieldPower(ship)) * 100}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Trader marketplace */}
        {canTrade && enc.trade && (
          <div className="trade-panel">
            <div className="trade-head">🤝 {t('encounter.trade.title')}</div>
            <div className="trade-cols">
              <div className="trade-col">
                <div className="trade-col-title">{t('encounter.trade.onOffer')}</div>
                {GOOD_IDS.filter((id) => enc.trade!.sells[id]).length === 0 ? (
                  <div className="muted" style={{ fontSize: 12 }}>{t('encounter.trade.nothing')}</div>
                ) : (
                  GOOD_IDS.filter((id) => enc.trade!.sells[id]).map((id) => {
                    const offer = enc.trade!.sells[id]!
                    return (
                      <div className="trade-row" key={id}>
                        <span className="trade-name">{goodName(id)}</span>
                        <span className="trade-meta">
                          {fmt(offer.price)} · ×{offer.qty}
                        </span>
                        <button
                          className="btn btn-sm btn-primary"
                          disabled={maxTradeBuy(id) <= 0}
                          onClick={() => setTradeDialog({ mode: 'buy', good: id })}
                        >
                          {t('common.buy')}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
              <div className="trade-col">
                <div className="trade-col-title">{t('encounter.trade.wants')}</div>
                {GOOD_IDS.filter((id) => enc.trade!.buys[id]).length === 0 ? (
                  <div className="muted" style={{ fontSize: 12 }}>{t('encounter.trade.nothing')}</div>
                ) : (
                  GOOD_IDS.filter((id) => enc.trade!.buys[id]).map((id) => {
                    const price = enc.trade!.buys[id]!
                    const held = ship.cargo[id]
                    return (
                      <div className="trade-row" key={id}>
                        <span className="trade-name">{goodName(id)}</span>
                        <span className="trade-meta">
                          {fmt(price)} · {t('market.inHold')} {held}
                        </span>
                        <button
                          className="btn btn-sm"
                          disabled={held <= 0}
                          onClick={() => setTradeDialog({ mode: 'sell', good: id })}
                        >
                          {t('common.sell')}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Combat log */}
        <div className="combat-log">
          {[...enc.messages].reverse().map((m, i) => (
            <div className="line" key={i}>{renderMessage(m.key, m.params)}</div>
          ))}
        </div>

        {/* Actions. A class, not an inline style: on a short screen these pin
            themselves to the bottom of the modal, which a media query has to be
            able to reach. */}
        <div className="combat-actions">
          {!terminal && (
            <>
              <button className="btn btn-danger" onClick={() => combatAction('attack')}>
                ⚔ {t('encounter.action.attack')}
              </button>
              <button
                className="btn"
                title={enc.tractorLocked ? t('encounter.tractor.held') : undefined}
                onClick={() => combatAction('flee')}
              >
                {enc.tractorLocked
                  ? `🧲 ${t('encounter.action.breakFree')}`
                  : `💨 ${t('encounter.action.flee')}`}
              </button>
              {enc.kind === 'police' && (
                <button className="btn" onClick={() => combatAction('submit')}>
                  {t('encounter.action.submit')}
                </button>
              )}
              {(enc.kind === 'police' || enc.kind === 'bountyHunter') && enc.bribeCost > 0 && (
                <button className="btn" onClick={() => combatAction('bribe')}>
                  💰 {t('encounter.action.bribe')}
                </button>
              )}
              {(enc.kind === 'pirate' || enc.kind === 'bountyHunter') && (
                <button
                  className="btn"
                  title={t(
                    enc.demand === 'arrest'
                      ? 'encounter.action.standDownHint'
                      : 'encounter.action.surrenderCargoHint'
                  )}
                  onClick={() => combatAction('surrender')}
                >
                  🏳{' '}
                  {t(
                    enc.demand === 'arrest'
                      ? 'encounter.action.standDown'
                      : enc.demand === 'cargo'
                        ? 'encounter.action.surrenderCargo'
                        : 'encounter.action.surrender'
                  )}
                </button>
              )}
              {enc.kind === 'trader' && (
                <button className="btn" onClick={() => combatAction('ignore')}>
                  👋 {t('encounter.action.leave')}
                </button>
              )}
            </>
          )}

          {enc.status === 'oppSurrendered' && (
            <button className="btn btn-primary" onClick={plunderNow}>
              💎 {t('encounter.action.plunder')}
            </button>
          )}

          {terminal && (
            <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={dismiss}>
              {t('encounter.action.continue')}
            </button>
          )}
        </div>
      </div>

      {tradeDialog && enc.trade && (
        <AmountModal
          title={
            tradeDialog.mode === 'buy'
              ? t('market.buyAmount', { good: goodName(tradeDialog.good) })
              : t('market.sellAmount', { good: goodName(tradeDialog.good) })
          }
          max={
            tradeDialog.mode === 'buy'
              ? maxTradeBuy(tradeDialog.good)
              : ship.cargo[tradeDialog.good]
          }
          unitPrice={
            tradeDialog.mode === 'buy'
              ? enc.trade.sells[tradeDialog.good]?.price ?? 0
              : enc.trade.buys[tradeDialog.good] ?? 0
          }
          confirmLabel={tradeDialog.mode === 'buy' ? t('common.buy') : t('common.sell')}
          onConfirm={(amount) => {
            if (tradeDialog.mode === 'buy') tradeBuyFromTrader(tradeDialog.good, amount)
            else tradeSellToTrader(tradeDialog.good, amount)
            setTradeDialog(null)
          }}
          onCancel={() => setTradeDialog(null)}
        />
      )}
    </div>
  )
}
