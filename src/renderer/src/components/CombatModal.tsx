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
  battleStations,
  playerHitChance,
  opponentHitChance,
  POINT_BLANK_RANGE,
  MAX_ENGAGEMENT_RANGE,
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
  const selectTarget = useGameStore((s) => s.selectTarget)
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

  const pct = (v: number): string => `${Math.round(v * 100)}%`
  const stations = battleStations(game)
  // The group as a formation: everyone still flying, nearest first, so the strip
  // reads the way the fight looks. The engaged ship carries index -1 — it is the
  // one you are already shooting at, so there is nothing to switch to.
  const formation = [
    { ship: opp, index: -1 },
    ...enc.reserves.map((r, i) => ({ ship: r, index: i }))
  ].sort((a, b) => a.ship.distance - b.ship.distance)

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

        {/* The group, ship by ship rather than as a tally of dots: wrecks first,
            then everyone still flying in order of range. Tapping one lays the
            guns on it — free, and the reason range is worth reading. */}
        {enc.fleetSize > 1 && (
          <div className="fleet-strip">
            {enc.downed.map((type, i) => (
              <div
                className="fleet-ship down"
                key={`down-${i}`}
                title={`${shipName(type)} · ${t('encounter.fleet.wreck')}`}
              >
                <ShipArt type={type} size={28} flip accent="#5a6396" />
                <span className="fleet-tag">✕</span>
              </div>
            ))}

            {formation.map(({ ship: s, index }) => {
              const engaged = index < 0
              const label = `${shipName(s.shipType)} · ${t(
                engaged ? 'encounter.fleet.engaged' : 'encounter.fleet.waiting'
              )}`
              const body = (
                <>
                  <ShipArt type={s.shipType} size={28} flip accent={oppAccent} />
                  <span className="fleet-tag">
                    {s.distance} {t('encounter.range.unit')}
                  </span>
                  <span className="fleet-tag odds">{pct(playerHitChance(game, enc, s))}</span>
                </>
              )
              return engaged ? (
                <div className="fleet-ship engaged" key="engaged" title={label}>
                  {body}
                </div>
              ) : (
                <button
                  className="fleet-ship"
                  key={`res-${index}`}
                  disabled={terminal}
                  title={`${label} — ${t('encounter.fleet.pickTarget')}`}
                  onClick={() => selectTarget(index)}
                >
                  {body}
                </button>
              )
            })}
          </div>
        )}

        {/* Opponent status */}
        <div
          className="ship-visual side-opponent"
          style={{ marginBottom: 12, borderLeftColor: oppAccent }}
        >
          <ShipArt type={opp.shipType} size={64} flip accent={oppAccent} />
          <div className="ship-info">
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

        {/* The odds, before the trigger is pulled. These are the very numbers
            `resolveRound` rolls against, so what is quoted is what happens. */}
        {!terminal && (
          <div className="combat-odds">
            <span className="odds-item">
              📏 {t('encounter.range.label')}{' '}
              <b>
                {opp.distance} {t('encounter.range.unit')}
              </b>
            </span>
            <span className="odds-item">
              🎯 {t('encounter.yourShot')} <b>{pct(playerHitChance(game, enc))}</b>
            </span>
            <span className="odds-item">
              🛡 {t('encounter.theirShot')} <b>{pct(opponentHitChance(game, enc))}</b>
            </span>
          </div>
        )}

        {/* Player status */}
        <div className="ship-visual side-player" style={{ marginBottom: 12 }}>
          <ShipArt type={ship.type} size={64} />
          <div className="ship-info">
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
        {/* What the crew can still do this exchange. One volley per gunner plus a
            manoeuvre if anyone is spare to fly — spend them in any order, and
            the other side waits until the last one is gone. */}
        {!terminal && (
          <div className="action-budget">
            <span className="action-pips">
              {Array.from({ length: enc.actionsPerRound }).map((_, i) => (
                <span key={i} className={`action-pip${i < enc.actionsLeft ? ' on' : ''}`} />
              ))}
            </span>
            <span className="action-stations">
              {t('encounter.actionsLeft')} {enc.actionsLeft}/{enc.actionsPerRound} ·{' '}
              {t('encounter.stations.gunners', { count: stations.shots })} ·{' '}
              {t(stations.helm ? 'encounter.stations.helm' : 'encounter.stations.helmEmpty')}
            </span>
          </div>
        )}

        <div className="combat-actions">
          {!terminal && (
            <>
              <button className="btn btn-danger" onClick={() => combatAction('attack')}>
                ⚔ {t('encounter.action.attack')}
              </button>
              <button
                className="btn"
                disabled={opp.distance <= POINT_BLANK_RANGE}
                onClick={() => combatAction('closeIn')}
              >
                ▶ {t('encounter.action.closeIn')}
              </button>
              <button
                className="btn"
                disabled={opp.distance >= MAX_ENGAGEMENT_RANGE}
                onClick={() => combatAction('openRange')}
              >
                ◀ {t('encounter.action.openRange')}
              </button>
              {enc.actionsLeft < enc.actionsPerRound && (
                <button className="btn" onClick={() => combatAction('endTurn')}>
                  ⏭ {t('encounter.action.endTurn')}
                </button>
              )}
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
