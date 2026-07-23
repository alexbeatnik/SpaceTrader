import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import {
  SHIP_TYPES,
  GOOD_IDS,
  maxHull,
  totalCargoBays,
  usedCargoBays,
  totalShieldPower,
  currentShieldCharge,
  weaponPower,
  HULL_UPGRADE_AMOUNT
} from '@game/index'
import { shipName, weaponName, shieldName, gadgetName, goodName } from '@i18n/index'
import { ShipArt } from '../components/ShipArt'

export function ShipScreen(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const { t } = useI18n()
  const ship = game.ship
  const type = SHIP_TYPES[ship.type]
  const cargoItems = GOOD_IDS.filter((id) => ship.cargo[id] > 0)

  return (
    <div>
      <div className="screen-title">🚀 {t('ship.title')}</div>
      <div className="screen-sub">
        {shipName(ship.type)} · {game.commanderName}
      </div>

      <div className="ship-visual" style={{ marginBottom: 16 }}>
        <ShipArt type={ship.type} size={84} />
        <div style={{ flex: 1 }}>
          <div className="kv">
            <span className="k">{t('ship.hull')}</span>
            <span className="v">{ship.hull}/{maxHull(ship)}</span>
          </div>
          <div className="meter"><div className="meter-fill hull" style={{ width: `${(ship.hull / maxHull(ship)) * 100}%` }} /></div>
          {totalShieldPower(ship) > 0 && (
            <>
              <div className="kv"><span className="k">{t('hud.shields')}</span><span className="v">{currentShieldCharge(ship)}/{totalShieldPower(ship)}</span></div>
              <div className="meter"><div className="meter-fill shield" style={{ width: `${(currentShieldCharge(ship) / totalShieldPower(ship)) * 100}%` }} /></div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="panel panel-pad">
          <div className="kv"><span className="k">{t('ship.type')}</span><span className="v">{shipName(ship.type)}</span></div>
          {(ship.hullUpgrades ?? 0) > 0 && (
            <div className="kv">
              <span className="k">{t('shipyard.hullUpgrade')}</span>
              <span className="v pos">+{(ship.hullUpgrades ?? 0) * HULL_UPGRADE_AMOUNT} ({ship.hullUpgrades})</span>
            </div>
          )}
          <div className="kv"><span className="k">{t('ship.cargoBays')}</span><span className="v">{usedCargoBays(ship)}/{totalCargoBays(ship)}</span></div>
          <div className="kv"><span className="k">{t('ship.fuelTank')}</span><span className="v">{ship.fuel}/{type.fuelTanks} {t('common.pc')}</span></div>
          <div className="kv"><span className="k">{t('shipyard.weapons')}</span><span className="v">{ship.weapons.length ? ship.weapons.map(weaponName).join(', ') : t('ship.empty')} ({weaponPower(ship)}⚔)</span></div>
          <div className="kv"><span className="k">{t('shipyard.shields')}</span><span className="v">{ship.shields.length ? ship.shields.map(shieldName).join(', ') : t('ship.empty')}</span></div>
          <div className="kv"><span className="k">{t('shipyard.gadgets')}</span><span className="v">{ship.gadgets.length ? ship.gadgets.map(gadgetName).join(', ') : t('ship.empty')}</span></div>
          <div className="kv"><span className="k">{t('ship.escapePod')}</span><span className="v">{ship.escapePod ? t('common.yes') : t('common.no')}</span></div>
        </div>

        <div className="panel panel-pad">
          <div className="screen-sub" style={{ marginBottom: 8 }}>{t('ship.skills')}</div>
          <div className="kv"><span className="k">{t('skill.pilot')}</span><span className="v">{game.skills.pilot}</span></div>
          <div className="kv"><span className="k">{t('skill.fighter')}</span><span className="v">{game.skills.fighter}</span></div>
          <div className="kv"><span className="k">{t('skill.trader')}</span><span className="v">{game.skills.trader}</span></div>
          <div className="kv"><span className="k">{t('skill.engineer')}</span><span className="v">{game.skills.engineer}</span></div>

          <div className="screen-sub" style={{ margin: '14px 0 8px' }}>{t('hud.cargo')}</div>
          {cargoItems.length === 0 ? (
            <div className="muted">{t('market.emptyHold')}</div>
          ) : (
            cargoItems.map((id) => (
              <div className="kv" key={id}>
                <span className="k">{goodName(id)}</span>
                <span className="v">{ship.cargo[id]}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
