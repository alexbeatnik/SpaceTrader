import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { useI18n } from './hooks/useI18n'
import { Hud } from './components/Hud'
import { Nav } from './components/Nav'
import { Toast } from './components/Toast'
import { CombatModal } from './components/CombatModal'
import { EventModal } from './components/EventModal'
import { QuestOfferModal } from './components/QuestOfferModal'
import { QuestCompleteModal } from './components/QuestCompleteModal'
import { GameOverModal } from './components/GameOverModal'
import { WarpTransition } from './components/WarpTransition'
import { MiningOverlay } from './components/MiningOverlay'
import { MenuScreen } from './screens/MenuScreen'
import { SystemScreen } from './screens/SystemScreen'
import { MarketScreen } from './screens/MarketScreen'
import { ShipyardScreen } from './screens/ShipyardScreen'
import { BankScreen } from './screens/BankScreen'
import { PersonnelScreen } from './screens/PersonnelScreen'
import { QuestsScreen } from './screens/QuestsScreen'
import { ChartScreen } from './screens/ChartScreen'
import { ShipScreen } from './screens/ShipScreen'
import { LogScreen } from './screens/LogScreen'

export function App(): React.JSX.Element {
  const game = useGameStore((s) => s.game)
  const screen = useGameStore((s) => s.screen)
  const encounter = useGameStore((s) => s.encounter)
  const gameOver = useGameStore((s) => s.gameOver)
  const travel = useGameStore((s) => s.travel)
  const mining = useGameStore((s) => s.mining)
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
          {screen === 'crew' && <PersonnelScreen />}
          {screen === 'quests' && <QuestsScreen />}
          {screen === 'chart' && <ChartScreen />}
          {screen === 'ship' && <ShipScreen />}
          {screen === 'log' && <LogScreen />}
        </div>
      </div>
      {travel && <WarpTransition />}
      {mining && !encounter && <MiningOverlay />}
      {!travel && !mining && encounter && !gameOver && <CombatModal />}
      {!travel && !mining && !encounter && !gameOver && <EventModal />}
      {!travel && !mining && !encounter && !gameOver && <QuestOfferModal />}
      {!travel && !mining && !encounter && !gameOver && <QuestCompleteModal />}
      {gameOver && <GameOverModal />}
      <Toast />
    </div>
  )
}
