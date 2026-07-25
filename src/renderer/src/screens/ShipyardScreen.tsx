import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import {
  currentSystem,
  currentBody,
  currentStation,
  maxHullUpgradesHere,
  repairPricePerUnit,
  weaponsForSale,
  shieldsForSale,
  gadgetsForSale,
  shipsForSale,
  SHIP_TYPES,
  WEAPONS,
  SHIELDS,
  GADGETS,
  maxHull,
  maxFuel,
  shipValue,
  fuelPricePerParsec,
  hullUpgradePrice,
  HULL_UPGRADE_AMOUNT,
  ESCAPE_POD_PRICE,
  type ShipTypeId
} from '@game/index'
import {
  weaponName,
  shieldName,
  gadgetName,
  shipName,
  shipClassName,
  economyName,
  stationName
} from '@i18n/index'
import { fmt } from '../util/format'
import { ShipArt } from '../components/ShipArt'
import { bodyDisplayName } from '../util/bodyText'

export function ShipyardScreen(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const s = useGameStore.getState()
  const { t } = useI18n()
  const sys = currentSystem(game)
  const ship = game.ship
  const type = SHIP_TYPES[ship.type]

  // A station yard has its own catalogue, its own hull-reinforcement limit and
  // its own repair rates; the planet below has the ordinary stock and the lot.
  const station = currentStation(game)
  const maxUpgrades = maxHullUpgradesHere(game)
  const repairUnit = repairPricePerUnit(game)
  const weapons = weaponsForSale(game)
  const shields = shieldsForSale(game)
  const gadgets = gadgetsForSale(game)
  const hulls = shipsForSale(game)

  const fuelCap = maxFuel(ship) // includes compactor gadgets
  const fuelMissing = fuelCap - ship.fuel
  const hullMissing = maxHull(ship) - ship.hull
  const fuelUnit = fuelPricePerParsec(game)

  return (
    <div>
      <div className="screen-title">
        🛠️ {station ? stationName(station) : t('shipyard.title')}
      </div>
      <div className="screen-sub">
        {bodyDisplayName(sys.nameId, currentBody(game))}
        {station ? ` · ${t('station.grade')}` : ''}
      </div>

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
            {t('shipyard.repairFull')} · {fmt(hullMissing * repairUnit)} {t('common.cr')}
          </button>
          {station && repairUnit < type.repairCostPerUnit && (
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              {t('station.repairDiscount', {
                percent: Math.round((repairUnit / type.repairCostPerUnit) * 100)
              })}
            </div>
          )}

          <div className="kv" style={{ marginTop: 12 }}>
            <span className="k">{t('shipyard.hullUpgrade')}</span>
            <span className="v">{(ship.hullUpgrades ?? 0)}/{maxUpgrades}</span>
          </div>
          {(ship.hullUpgrades ?? 0) >= maxUpgrades ? (
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
          <div className="screen-sub" style={{ marginBottom: 8 }}>
            {station ? t('station.catalog') : t('shipyard.weapons')}
          </div>
          {station && (
            <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
              {t(`station.blurb.${station}`)}
            </div>
          )}
          {station && <div className="screen-sub" style={{ marginBottom: 8 }}>{t('shipyard.weapons')}</div>}
          {weapons.length === 0 && <div className="muted">{t('station.nothing')}</div>}
          {weapons.map((id) => (
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
          {shields.length === 0 && <div className="muted">{t('station.nothing')}</div>}
          {shields.map((id) => (
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
          {gadgets.length === 0 && <div className="muted">{t('station.nothing')}</div>}
          {gadgets.map((id) => (
            <div className="kv" key={id}>
              <span className="k">{gadgetName(id)}</span>
              <button
                className="btn btn-sm"
                disabled={
                  ship.gadgets.length >= type.gadgetSlots ||
                  (id !== 'cargoBays' && id !== 'nanoHold' && ship.gadgets.includes(id))
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

      {/* Ships for sale — hulls are sold planet-side; a station only fits them out. */}
      {hulls.length > 0 && (
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
            {hulls.map((id: ShipTypeId) => {
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
      )}
    </div>
  )
}
