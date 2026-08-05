import { useEffect } from 'react'
import { atCapital, hasShipyard } from '@game/index'
import { useGameStore, type Screen } from './store/gameStore'
import { useI18n } from './hooks/useI18n'
import { useBackButton } from './hooks/useBackButton'
import { useKeepAwake } from './hooks/useKeepAwake'
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
import { EscortOverlay } from './components/EscortOverlay'
import { CrewIncidentModal } from './components/CrewIncidentModal'
import { MenuScreen } from './screens/MenuScreen'
import { SystemMapScreen } from './screens/SystemMapScreen'
import { SystemScreen } from './screens/SystemScreen'
import { MarketScreen } from './screens/MarketScreen'
import { ShipyardScreen } from './screens/ShipyardScreen'
import { BankScreen } from './screens/BankScreen'
import { PersonnelScreen } from './screens/PersonnelScreen'
import { QuestsScreen } from './screens/QuestsScreen'
import { ChartScreen } from './screens/ChartScreen'
import { ShipScreen } from './screens/ShipScreen'
import { LogScreen } from './screens/LogScreen'
import { SavesScreen } from './screens/SavesScreen'
import { AboutScreen } from './screens/AboutScreen'

/** Screens that only exist at the capital planet's spaceport. */
const PLANET_ONLY: Screen[] = ['market', 'bank', 'crew']

export function App(): React.JSX.Element {
  const game = useGameStore((s) => s.game)
  const rawScreen = useGameStore((s) => s.screen)
  const encounter = useGameStore((s) => s.encounter)
  const gameOver = useGameStore((s) => s.gameOver)
  const travel = useGameStore((s) => s.travel)
  const mining = useGameStore((s) => s.mining)
  const escort = useGameStore((s) => s.escort)
  const incident = useGameStore((s) => s.incident)
  useI18n() // subscribe to locale changes for the whole tree
  // Before the menu's early return below: hooks cannot be called conditionally,
  // and the menu is exactly where back has to mean "leave the app".
  useBackButton()

  useEffect(() => {
    document.title = 'Space Trader'
  }, [])

  // Leaving port takes the port's services with it. Rather than leave a stale
  // market on screen after the ship has flown out to a moon, fall back to the
  // planet dossier — which explains where the ship actually is.
  const screen: Screen =
    game && PLANET_ONLY.includes(rawScreen) && !atCapital(game)
      ? 'system'
      : game && rawScreen === 'shipyard' && !hasShipyard(game)
        ? 'system'
        : rawScreen

  // A jump runs half a minute on its own and a mining run loops indefinitely,
  // neither of them touching the screen — so the display is held awake while
  // the voyage is on screen. Keyed off exactly what the branch below renders,
  // not off `game`: quitting to the menu deliberately keeps the state loaded so
  // Continue works, so a game-is-loaded test holds the screen lit on the menu.
  const inVoyage = game !== null && screen !== 'menu'
  useKeepAwake(inVoyage)

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
          {screen === 'systemMap' && <SystemMapScreen />}
          {screen === 'system' && <SystemScreen />}
          {screen === 'market' && <MarketScreen />}
          {screen === 'shipyard' && <ShipyardScreen />}
          {screen === 'bank' && <BankScreen />}
          {screen === 'crew' && <PersonnelScreen />}
          {screen === 'quests' && <QuestsScreen />}
          {screen === 'chart' && <ChartScreen />}
          {screen === 'ship' && <ShipScreen />}
          {screen === 'log' && <LogScreen />}
          {screen === 'saves' && <SavesScreen />}
          {screen === 'about' && <AboutScreen />}
        </div>
      </div>
      {travel && <WarpTransition />}
      {escort && !travel && <EscortOverlay />}
      {mining && !encounter && !escort && <MiningOverlay />}
      {/* Combat may interrupt a jump, so this one renders over the warp too. */}
      {!mining && !escort && encounter && !gameOver && <CombatModal />}
      {/* Mishaps may strike mid-extraction: the modal outranks the overlay. */}
      {!travel && !escort && !encounter && !gameOver && <CrewIncidentModal />}
      {!travel && !mining && !escort && !encounter && !incident && !gameOver && <EventModal />}
      {!travel && !mining && !escort && !encounter && !incident && !gameOver && <QuestOfferModal />}
      {!travel && !mining && !escort && !encounter && !incident && !gameOver && <QuestCompleteModal />}
      {gameOver && <GameOverModal />}
      <Toast />
    </div>
  )
}
