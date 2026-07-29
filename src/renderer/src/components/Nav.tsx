import { useGameStore, type Screen } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { atCapital, hasShipyard, questsReadyToTurnIn } from '@game/index'

/**
 * `planetSide` marks the tabs that only mean anything at the capital planet's
 * spaceport; `yardSide` the ones a station can serve too. Away from either, the
 * tab is greyed rather than hidden, so it stays obvious where to go back to.
 */
const ITEMS: {
  screen: Screen
  icon: string
  key: string
  planetSide?: boolean
  yardSide?: boolean
}[] = [
  { screen: 'systemMap', icon: '🛰️', key: 'nav.systemMap' },
  { screen: 'system', icon: '🪐', key: 'nav.system' },
  { screen: 'market', icon: '💱', key: 'nav.market', planetSide: true },
  { screen: 'shipyard', icon: '🛠️', key: 'nav.shipyard', yardSide: true },
  { screen: 'bank', icon: '🏦', key: 'nav.bank', planetSide: true },
  { screen: 'crew', icon: '🧑‍🚀', key: 'nav.crew', planetSide: true },
  { screen: 'quests', icon: '📋', key: 'nav.quests' },
  { screen: 'chart', icon: '🗺️', key: 'nav.chart' },
  { screen: 'ship', icon: '🚀', key: 'nav.ship' },
  { screen: 'log', icon: '📜', key: 'nav.log' },
  { screen: 'saves', icon: '💾', key: 'nav.saves' },
  // Not ℹ️: on Windows it falls back to a plain serif "i" next to the other
  // tabs' full-colour glyphs.
  { screen: 'about', icon: '📘', key: 'nav.about' }
]

export function Nav(): React.JSX.Element {
  const screen = useGameStore((s) => s.screen)
  const setScreen = useGameStore((s) => s.setScreen)
  const quitToMenu = useGameStore((s) => s.quitToMenu)
  const game = useGameStore((s) => s.game)
  const { t } = useI18n()

  // Assignments that can be handed in at the current planet -> nudge the tab.
  const readyCount = game ? questsReadyToTurnIn(game).length : 0
  const docked = game ? atCapital(game) : true
  const atYard = game ? hasShipyard(game) : true

  return (
    <nav className="nav">
      {ITEMS.map((item) => {
        const unavailable =
          (item.planetSide === true && !docked) || (item.yardSide === true && !atYard)
        return (
          <button
            key={item.screen}
            className={`${screen === item.screen ? 'active' : ''}${unavailable ? ' nav-off' : ''}`}
            disabled={unavailable}
            onClick={() => setScreen(item.screen)}
          >
            <span className="nav-icon">{item.icon}</span>
            {t(item.key)}
            {item.screen === 'quests' && readyCount > 0 && (
              <span className="nav-badge">{readyCount}</span>
            )}
          </button>
        )
      })}
      <button className="nav-quit" onClick={quitToMenu}>
        {/* Not ⏻: Android has no glyph for it and draws an empty box, the same
            trap as ℹ️ on Windows above. 🚪 is a full-colour emoji everywhere. */}
        <span className="nav-icon">🚪</span>
        {t('common.back')}
      </button>
    </nav>
  )
}
