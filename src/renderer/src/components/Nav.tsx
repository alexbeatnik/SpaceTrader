import { useGameStore, type Screen } from '../store/gameStore'
import { useI18n } from '../hooks/useI18n'

const ITEMS: { screen: Screen; icon: string; key: string }[] = [
  { screen: 'system', icon: '🪐', key: 'nav.system' },
  { screen: 'market', icon: '💱', key: 'nav.market' },
  { screen: 'shipyard', icon: '🛠️', key: 'nav.shipyard' },
  { screen: 'bank', icon: '🏦', key: 'nav.bank' },
  { screen: 'chart', icon: '🗺️', key: 'nav.chart' },
  { screen: 'ship', icon: '🚀', key: 'nav.ship' },
  { screen: 'log', icon: '📜', key: 'nav.log' }
]

export function Nav(): React.JSX.Element {
  const screen = useGameStore((s) => s.screen)
  const setScreen = useGameStore((s) => s.setScreen)
  const quitToMenu = useGameStore((s) => s.quitToMenu)
  const { t } = useI18n()

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
        </button>
      ))}
      <button className="nav-quit" onClick={quitToMenu}>
        <span className="nav-icon">⏻</span>
        {t('common.back')}
      </button>
    </nav>
  )
}
