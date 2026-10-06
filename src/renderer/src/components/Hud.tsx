import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { fmt } from '../util/format'
import {
  totalCargoBays,
  usedCargoBays,
  maxHull,
  maxFuel,
  currentBody,
  currentSystem
} from '@game/index'
import { LocaleToggle } from './LocaleToggle'
import { bodyDisplayName } from '../util/bodyText'

export function Hud(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const { t } = useI18n()
  const ship = game.ship
  const sys = currentSystem(game)
  // The figures a voyage ends on get a colour before they get a crisis. A plain
  // white "12/100" read exactly like "100/100" at a glance, which is how a ship
  // gets jumped with no hull left. Hull goes amber at half and red at a quarter;
  // a tank is routinely half empty, so fuel only speaks up near the bottom.
  const hullLevel =
    ship.hull <= maxHull(ship) * 0.25 ? ' bad' : ship.hull <= maxHull(ship) * 0.5 ? ' warn' : ''
  const fuelLevel = ship.fuel <= 0 ? ' bad' : ship.fuel <= maxFuel(ship) * 0.25 ? ' warn' : ''
  const cargoFull = usedCargoBays(ship) >= totalCargoBays(ship)

  return (
    <div className="hud">
      <span className="hud-brand">★ SPACE TRADER</span>

      <div className="hud-stat">
        <span className="label">{t('hud.credits')}</span>
        <span className="value good">{fmt(game.credits)}</span>
      </div>
      {game.debt > 0 && (
        <div className="hud-stat">
          <span className="label">{t('hud.debt')}</span>
          <span className="value bad">{fmt(game.debt)}</span>
        </div>
      )}
      <div className="hud-stat">
        <span className="label">{t('hud.day')}</span>
        <span className="value">{game.day}</span>
      </div>
      <div className="hud-stat">
        <span className="label">{t('hud.fuel')}</span>
        <span className={`value${fuelLevel}`}>
          {ship.fuel}/{maxFuel(ship)}
        </span>
      </div>
      <div className="hud-stat">
        <span className="label">{t('hud.hull')}</span>
        <span className={`value${hullLevel}`}>
          {ship.hull}/{maxHull(ship)}
        </span>
      </div>
      <div className="hud-stat">
        <span className="label">{t('hud.cargo')}</span>
        <span className={`value${cargoFull ? ' warn' : ''}`}>
          {usedCargoBays(ship)}/{totalCargoBays(ship)}
        </span>
      </div>
      {/* Where the ship actually is, not just which star it is under: away
          from the capital the name carries the orbit or the station. */}
      <div className="hud-stat">
        <span className="label">{t('nav.systemMap')}</span>
        <span className="value">{bodyDisplayName(sys.nameId, currentBody(game))}</span>
      </div>

      <div className="hud-spacer" />
      <LocaleToggle />
    </div>
  )
}
