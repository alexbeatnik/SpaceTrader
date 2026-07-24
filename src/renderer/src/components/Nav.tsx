import { useGameStore, type Screen } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'
import { questsReadyToTurnIn } from '@game/index'

const ITEMS: { screen: Screen; icon: string; key: string }[] = [
  { screen: 'system', icon: '🪐', key: 'nav.system' },
  { screen: 'market', icon: '💱', key: 'nav.market' },
  { screen: 'shipyard', icon: '🛠️', key: 'nav.shipyard' },
  { screen: 'bank', icon: '🏦', key: 'nav.bank' },
  { screen: 'crew', icon: '🧑‍🚀', key: 'nav.crew' },
  { screen: 'quests', icon: '📋', key: 'nav.quests' },
  { screen: 'chart', icon: '🗺️', key: 'nav.chart' },
  { screen: 'ship', icon: '🚀', key: 'nav.ship' },
  { screen: 'log', icon: '📜', key: 'nav.log' },
  { screen: 'saves', icon: '💾', key: 'nav.saves' }
]

export function Nav(): React.JSX.Element {
  const screen = useGameStore((s) => s.screen)
  const setScreen = useGameStore((s) => s.setScreen)
  const quitToMenu = useGameStore((s) => s.quitToMenu)
  const game = useGameStore((s) => s.game)
  const { t } = useI18n()

  // Assignments that can be handed in at the current planet -> nudge the tab.
  const readyCount = game ? questsReadyToTurnIn(game).length : 0

  return (
    <nav className="nav">
      {ITEMS.map((item) => (
        <button
          key={item.screen}
          className={screen === item.screen ? 'active' : ''}
          onClick={() => setScreen(item.screen)}
        >
          <span className="nav-icon">{item.icon}</span>
          {t(item.key)}
          {item.screen === 'quests' && readyCount > 0 && (
            <span className="nav-badge">{readyCount}</span>
          )}
        </button>
      ))}
      <button className="nav-quit" onClick={quitToMenu}>
        <span className="nav-icon">⏻</span>
        {t('common.back')}
      </button>
    </nav>
  )
}
