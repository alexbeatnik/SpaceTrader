import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { renderMessage } from '@i18n/index'
import { shipName } from '@i18n/index'
import {
  maxHull,
  totalShieldPower,
  currentShieldCharge,
  SHIP_TYPES
} from '@game/index'

export function CombatModal(): React.JSX.Element | null {
  const game = useGameStore((s) => s.game)!
  const enc = useGameStore((s) => s.encounter)!
  const combatAction = useGameStore((s) => s.combatAction)
  const plunderNow = useGameStore((s) => s.plunderNow)
  const dismiss = useGameStore((s) => s.dismissEncounter)
  const { t } = useI18n()

  if (!enc) return null
  const opp = enc.opponent
  const oppType = SHIP_TYPES[opp.shipType]
  const ship = game.ship
  const terminal = enc.status !== 'ongoing'

  const kindColor =
    enc.kind === 'pirate' ? 'bad' : enc.kind === 'police' ? 'warn' : ''

  return (
    <div className="overlay">
      <div className="modal">
        <h2>
          ⚠ {t('encounter.title')}{' '}
          <span className={`badge ${kindColor}`} style={{ marginLeft: 8 }}>
            {t(
              `system.${enc.kind === 'police' ? 'police' : enc.kind === 'pirate' ? 'pirates' : 'traders'}`
            )}
          </span>
        </h2>

        {/* Opponent status */}
        <div className="ship-visual" style={{ marginBottom: 12 }}>
          <span className="ship-emoji">{enc.kind === 'police' ? '🛡️' : enc.kind === 'pirate' ? '☠️' : '🚀'}</span>
          <div style={{ flex: 1 }}>
            <div className="kv">
              <span className="k">{shipName(opp.shipType)}</span>
              <span className="v">{t('ship.hull')}: {Math.max(0, opp.hull)}/{oppType.hullStrength}</span>
            </div>
            <div className="meter">
              <div className="meter-fill hull" style={{ width: `${Math.max(0, (opp.hull / oppType.hullStrength) * 100)}%` }} />
            </div>
            {opp.maxShield > 0 && (
              <div className="meter" style={{ marginTop: 4 }}>
                <div className="meter-fill shield" style={{ width: `${Math.max(0, (opp.shieldPoints / opp.maxShield) * 100)}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Player status */}
        <div className="ship-visual" style={{ marginBottom: 12 }}>
          <span className="ship-emoji">🚀</span>
          <div style={{ flex: 1 }}>
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

        {/* Combat log */}
        <div className="combat-log">
          {[...enc.messages].reverse().map((m, i) => (
            <div className="line" key={i}>{renderMessage(m.key, m.params)}</div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          {!terminal && (
            <>
              <button className="btn btn-danger" onClick={() => combatAction('attack')}>
                ⚔ {t('encounter.action.attack')}
              </button>
              <button className="btn" onClick={() => combatAction('flee')}>
                💨 {t('encounter.action.flee')}
              </button>
              {enc.kind === 'police' && (
                <>
                  <button className="btn" onClick={() => combatAction('submit')}>
                    {t('encounter.action.submit')}
                  </button>
                  {enc.bribeCost > 0 && (
                    <button className="btn" onClick={() => combatAction('bribe')}>
                      💰 {t('encounter.action.bribe')}
                    </button>
                  )}
                </>
              )}
              {enc.kind === 'pirate' && (
                <button className="btn" onClick={() => combatAction('surrender')}>
                  🏳 {t('encounter.action.surrender')}
                </button>
              )}
              {enc.kind === 'trader' && (
                <button className="btn" onClick={() => combatAction('ignore')}>
                  {t('encounter.action.ignore')}
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
    </div>
  )
}
