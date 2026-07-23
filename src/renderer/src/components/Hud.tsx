import { useGameStore } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { fmt } from '../util/format'
import {
  totalCargoBays,
  usedCargoBays,
  maxHull,
  maxFuel,
  currentSystem
} from '@game/index'
import { LocaleToggle } from './LocaleToggle'

export function Hud(): React.JSX.Element {
  const game = useGameStore((s) => s.game)!
  const { t } = useI18n()
  const ship = game.ship
  const sys = currentSystem(game)

  return (
    <div className="hud">
      <span className="hud-brand">★ STAR TRADER</span>

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
        <span className="value">
          {ship.fuel}/{maxFuel(ship)}
        </span>
      </div>
      <div className="hud-stat">
        <span className="label">{t('hud.hull')}</span>
        <span className="value">
          {ship.hull}/{maxHull(ship)}
        </span>
      </div>
      <div className="hud-stat">
        <span className="label">{t('hud.cargo')}</span>
        <span className="value">
          {usedCargoBays(ship)}/{totalCargoBays(ship)}
        </span>
      </div>
      <div className="hud-stat">
        <span className="label">{t('nav.system')}</span>
        <span className="value">{sys.nameId}</span>
      </div>

      <div className="hud-spacer" />
      <LocaleToggle />
    </div>
  )
}
