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
  maxFuel,
  shipValue,
  fuelPricePerParsec,
  hullUpgradePrice,
  HULL_UPGRADE_AMOUNT,
  MAX_HULL_UPGRADES,
  ESCAPE_POD_PRICE,
  type ShipTypeId
} from '@game/index'
import { weaponName, shieldName, gadgetName, shipName, shipClassName, economyName } from '@i18n/index'
import { fmt } from '../util/format'
import { ShipArt } from '../components/ShipArt'

export function ShipyardScreen(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const s = useGameStore.getState()
  const { t } = useI18n()
  const sys = currentSystem(game)
  const ship = game.ship
  const type = SHIP_TYPES[ship.type]

  const fuelCap = maxFuel(ship) // includes fuelCompactor gadgets
  const fuelMissing = fuelCap - ship.fuel
  const hullMissing = maxHull(ship) - ship.hull
  const fuelUnit = fuelPricePerParsec(game)

  return (
    <div>
      <div className="screen-title">🛠️ {t('shipyard.title')}</div>
      <div className="screen-sub">{sys.nameId}</div>

      <div className="grid grid-2">
        {/* Fuel & repair */}
        <div className="panel panel-pad">
          <div className="kv">
            <span className="k">{t('shipyard.fuel')}</span>
            <span className="v">{ship.fuel}/{fuelCap}</span>
          </div>
          <div className="meter" style={{ margin: '6px 0 8px' }}>
            <div className="meter-fill fuel" style={{ width: `${(ship.fuel / fuelCap) * 100}%` }} />
          </div>
          <div className="kv" style={{ marginBottom: 8 }}>
            <span className="k">{t('shipyard.fuelPrice')}</span>
            <span className="v">
              {fmt(fuelUnit)} {t('common.cr')}/{t('common.pc')}
              <span className="muted" style={{ marginLeft: 6, fontWeight: 400 }}>
                · {economyName(sys.economyType)}
              </span>
            </span>
          </div>
          <button
            className="btn btn-block"
            disabled={fuelMissing <= 0}
            onClick={() => s.refuelFull()}
          >
            {t('shipyard.refuelFull')} · {fmt(fuelMissing * fuelUnit)} {t('common.cr')}
          </button>

          <label className="checkbox-row" style={{ marginTop: 10 }}>
            <input
              type="checkbox"
              checked={!!game.autoRefuel}
              onChange={(e) => s.setAutoRefuel(e.target.checked)}
            />
            <span>{t('shipyard.autoRefuel')}</span>
          </label>

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

          <div className="kv" style={{ marginTop: 12 }}>
            <span className="k">{t('shipyard.hullUpgrade')}</span>
            <span className="v">{(ship.hullUpgrades ?? 0)}/{MAX_HULL_UPGRADES}</span>
          </div>
          {(ship.hullUpgrades ?? 0) >= MAX_HULL_UPGRADES ? (
            <div className="badge">{t('shipyard.hullUpgradeMax')}</div>
          ) : (
            <button
              className="btn btn-block"
              disabled={game.credits < hullUpgradePrice(ship)}
              onClick={() => s.buyHullUpgrade()}
            >
              {t('shipyard.buyHullUpgrade', { amount: HULL_UPGRADE_AMOUNT })} ·{' '}
              {fmt(hullUpgradePrice(ship))} {t('common.cr')}
            </button>
          )}

          <div style={{ marginTop: 18 }}>
            {ship.escapePod ? (
              <div className="badge">{t('shipyard.hasEscapePod')}</div>
            ) : (
              <button
                className="btn btn-block"
                disabled={game.credits < ESCAPE_POD_PRICE}
                onClick={() => s.buyEscapePod()}
              >
                {t('shipyard.buyEscapePod')} · {fmt(ESCAPE_POD_PRICE)} {t('common.cr')}
              </button>
            )}
          </div>
        </div>

        {/* Equipment */}
        <div className="panel panel-pad">
          <div className="screen-sub" style={{ marginBottom: 8 }}>{t('shipyard.weapons')}</div>
          {WEAPON_IDS.filter((id) => WEAPONS[id].minTechLevel <= sys.techLevel).map((id) => (
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
          {SHIELD_IDS.filter((id) => SHIELDS[id].minTechLevel <= sys.techLevel).map((id) => (
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
          {GADGET_IDS.filter((id) => GADGETS[id].minTechLevel <= sys.techLevel).map((id) => (
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

      {/* Installed modules */}
      {(ship.weapons.length > 0 || ship.shields.length > 0 || ship.gadgets.length > 0) && (
        <div className="panel panel-pad" style={{ marginTop: 16 }}>
          <div className="screen-sub" style={{ marginBottom: 8 }}>{t('shipyard.installed')}</div>
          <div className="grid grid-3">
            <div>
              <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>{t('shipyard.weapons')}</div>
              {ship.weapons.length === 0 && <div className="muted">{t('ship.empty')}</div>}
              {ship.weapons.map((id, i) => (
                <div className="kv" key={i}>
                  <span className="k">{weaponName(id)}</span>
                  <button className="btn btn-sm btn-danger" onClick={() => s.sellWeapon(i)}>
                    {t('common.sell')} {fmt(Math.round(WEAPONS[id].price * 0.75))}
                  </button>
                </div>
              ))}
            </div>
            <div>
              <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>{t('shipyard.shields')}</div>
              {ship.shields.length === 0 && <div className="muted">{t('ship.empty')}</div>}
              {ship.shields.map((id, i) => (
                <div className="kv" key={i}>
                  <span className="k">{shieldName(id)}</span>
                  <button className="btn btn-sm btn-danger" onClick={() => s.sellShield(i)}>
                    {t('common.sell')} {fmt(Math.round(SHIELDS[id].price * 0.75))}
                  </button>
                </div>
              ))}
            </div>
            <div>
              <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>{t('shipyard.gadgets')}</div>
              {ship.gadgets.length === 0 && <div className="muted">{t('ship.empty')}</div>}
              {ship.gadgets.map((id, i) => (
                <div className="kv" key={i}>
                  <span className="k">{gadgetName(id)}</span>
                  <button className="btn btn-sm btn-danger" onClick={() => s.sellGadget(i)}>
                    {t('common.sell')} {fmt(Math.round(GADGETS[id].price * 0.75))}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ships for sale */}
      <div className="panel panel-pad" style={{ marginTop: 16 }}>
        <div className="screen-sub" style={{ marginBottom: 8 }}>
          {t('shipyard.ships')} · {t('shipyard.tradeIn')}: {fmt(shipValue(ship))} {t('common.cr')}
        </div>
        <table>
          <thead>
            <tr>
              <th>{t('ship.type')}</th>
              <th>{t('ship.class')}</th>
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
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ShipArt type={id} size={30} />
                      {shipName(id)}
                    </div>
                  </td>
                  <td className="muted">{shipClassName(st.shipClass)}</td>
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
