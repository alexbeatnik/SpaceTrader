import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { useI18n } from './hooks/useI18n'
import { Hud } from './components/Hud'
import { Nav } from './components/Nav'
import { Toast } from './components/Toast'
import { CombatModal } from './components/CombatModal'
import { GameOverModal } from './components/GameOverModal'
import { MenuScreen } from './screens/MenuScreen'
import { SystemScreen } from './screens/SystemScreen'
import { MarketScreen } from './screens/MarketScreen'
import { ShipyardScreen } from './screens/ShipyardScreen'
import { BankScreen } from './screens/BankScreen'
import { ChartScreen } from './screens/ChartScreen'
import { ShipScreen } from './screens/ShipScreen'
import { LogScreen } from './screens/LogScreen'

export function App(): React.JSX.Element {
  const game = useGameStore((s) => s.game)
  const screen = useGameStore((s) => s.screen)
  const encounter = useGameStore((s) => s.encounter)
  const gameOver = useGameStore((s) => s.gameOver)
  useI18n() // subscribe to locale changes for the whole tree

  useEffect(() => {
    document.title = 'Star Trader'
  }, [])

  if (!game || screen === 'menu') {
    return (
      <>
        <div className="starfield" />
        <MenuScreen />
        <Toast />
      </>
    )
  }

  return (
    <div className="app">
      <div className="starfield" />
      <Hud />
      <div className="main">
        <Nav />
        <div className="content">
          {screen === 'system' && <SystemScreen />}
          {screen === 'market' && <MarketScreen />}
          {screen === 'shipyard' && <ShipyardScreen />}
          {screen === 'bank' && <BankScreen />}
          {screen === 'chart' && <ChartScreen />}
          {screen === 'ship' && <ShipScreen />}
          {screen === 'log' && <LogScreen />}
        </div>
      </div>
      {encounter && !gameOver && <CombatModal />}
      {gameOver && <GameOverModal />}
      <Toast />
    </div>
  )
}
