import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import {
  currentSystem,
  SHIP_TYPES,
  SHIP_TYPE_IDS,
  WEAPONS,
  SHIELDS,
  GADGETS,
  WEAPON_IDS,
  SHIELD_IDS,
  GADGET_IDS,
  maxHull,
  shipValue,
  type ShipTypeId
} from '@game/index'
import { weaponName, shieldName, gadgetName, shipName } from '@i18n/index'
import { fmt } from '../util/format'

export function ShipyardScreen(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const s = useGameStore.getState()
  const { t } = useI18n()
  const sys = currentSystem(game)
  const ship = game.ship
  const type = SHIP_TYPES[ship.type]

  const fuelMissing = type.fuelTanks - ship.fuel
  const hullMissing = maxHull(ship) - ship.hull

  return (
    <div>
      <div className="screen-title">🛠️ {t('shipyard.title')}</div>
      <div className="screen-sub">{sys.nameId}</div>

      <div className="grid grid-2">
        {/* Fuel & repair */}
        <div className="panel panel-pad">
          <div className="kv">
            <span className="k">{t('shipyard.fuel')}</span>
            <span className="v">{ship.fuel}/{type.fuelTanks}</span>
          </div>
          <div className="meter" style={{ margin: '6px 0 12px' }}>
            <div className="meter-fill fuel" style={{ width: `${(ship.fuel / type.fuelTanks) * 100}%` }} />
          </div>
          <button
            className="btn btn-block"
            disabled={fuelMissing <= 0}
            onClick={() => s.refuelFull()}
          >
            {t('shipyard.refuelFull')} · {fmt(fuelMissing * type.fuelCostPerParsec)} {t('common.cr')}
          </button>

          <div className="kv" style={{ marginTop: 18 }}>
            <span className="k">{t('shipyard.repair')}</span>
            <span className="v">{ship.hull}/{maxHull(ship)}</span>
          </div>
          <div className="meter" style={{ margin: '6px 0 12px' }}>
            <div className="meter-fill hull" style={{ width: `${(ship.hull / maxHull(ship)) * 100}%` }} />
          </div>
          <button
            className="btn btn-block"
            disabled={hullMissing <= 0}
            onClick={() => s.repairFull()}
          >
            {t('shipyard.repairFull')} · {fmt(hullMissing * type.repairCostPerUnit)} {t('common.cr')}
          </button>

          <div style={{ marginTop: 18 }}>
            {ship.escapePod ? (
              <div className="badge">{t('shipyard.hasEscapePod')}</div>
            ) : (
              <button className="btn btn-block" onClick={() => s.buyEscapePod()}>
                {t('shipyard.buyEscapePod')} · 2 000 {t('common.cr')}
              </button>
            )}
          </div>
        </div>

        {/* Equipment */}
        <div className="panel panel-pad">
          <div className="screen-sub" style={{ marginBottom: 8 }}>{t('shipyard.weapons')}</div>
          {WEAPON_IDS.map((id) => (
            <div className="kv" key={id}>
              <span className="k">{weaponName(id)} <span className="muted">· {WEAPONS[id].power}⚔</span></span>
              <button
                className="btn btn-sm"
                disabled={ship.weapons.length >= type.weaponSlots}
                onClick={() => s.buyWeapon(id)}
              >
                {fmt(WEAPONS[id].price)}
              </button>
            </div>
          ))}
          <div className="screen-sub" style={{ margin: '14px 0 8px' }}>{t('shipyard.shields')}</div>
          {SHIELD_IDS.map((id) => (
            <div className="kv" key={id}>
              <span className="k">{shieldName(id)} <span className="muted">· {SHIELDS[id].power}🛡</span></span>
              <button
                className="btn btn-sm"
                disabled={ship.shields.length >= type.shieldSlots}
                onClick={() => s.buyShield(id)}
              >
                {fmt(SHIELDS[id].price)}
              </button>
            </div>
          ))}
          <div className="screen-sub" style={{ margin: '14px 0 8px' }}>{t('shipyard.gadgets')}</div>
          {GADGET_IDS.map((id) => (
            <div className="kv" key={id}>
              <span className="k">{gadgetName(id)}</span>
              <button
                className="btn btn-sm"
                disabled={
                  ship.gadgets.length >= type.gadgetSlots ||
                  (id !== 'cargoBays' && ship.gadgets.includes(id))
                }
                onClick={() => s.buyGadget(id)}
              >
                {fmt(GADGETS[id].price)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Ships for sale */}
      <div className="panel panel-pad" style={{ marginTop: 16 }}>
        <div className="screen-sub" style={{ marginBottom: 8 }}>
          {t('shipyard.ships')} · {t('shipyard.tradeIn')}: {fmt(shipValue(ship))} {t('common.cr')}
        </div>
        <table>
          <thead>
            <tr>
              <th>{t('ship.type')}</th>
              <th className="num">{t('ship.cargoBays')}</th>
              <th className="num">{t('ship.hull')}</th>
              <th className="num">{t('shipyard.weapons')}</th>
              <th className="num">{t('shipyard.shields')}</th>
              <th className="num">{t('shipyard.gadgets')}</th>
              <th className="num">{t('hud.fuel')}</th>
              <th className="num">{t('shipyard.netPrice')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {SHIP_TYPE_IDS.filter((id) => SHIP_TYPES[id].minTechLevel <= sys.techLevel).map((id: ShipTypeId) => {
              const st = SHIP_TYPES[id]
              const net = st.price - shipValue(ship)
              const isCurrent = id === ship.type
              return (
                <tr key={id} className="row-hover">
                  <td>{shipName(id)}</td>
                  <td className="num">{st.cargoBays}</td>
                  <td className="num">{st.hullStrength}</td>
                  <td className="num">{st.weaponSlots}</td>
                  <td className="num">{st.shieldSlots}</td>
                  <td className="num">{st.gadgetSlots}</td>
                  <td className="num">{st.fuelTanks}</td>
                  <td className={`num ${net > 0 ? '' : 'pos'}`}>{isCurrent ? '—' : fmt(net)}</td>
                  <td className="num">
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={isCurrent}
                      onClick={() => s.buyShip(id)}
                    >
                      {isCurrent ? t('system.hereNow') : t('common.buy')}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
