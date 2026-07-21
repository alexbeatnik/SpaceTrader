import { create } from 'zustand'
import {
  newGame,
  buyGood,
  sellGood,
  dumpGood,
  refuel,
  refuelFull,
  repair,
  repairFull,
  buyWeapon,
  buyShield,
  buyGadget,
  buyEscapePod,
  buyShip,
  sellWeapon,
  sellShield,
  sellGadget,
  hireMercenary,
  fireMercenary,
  getLoan,
  payDebt,
  buyInsurance,
  cancelInsurance,
  warp,
  resolveRound,
  plunder,
  acceptQuest,
  pushLog,
  Rng,
  SHIP_TYPES,
  type GameState,
  type Encounter,
  type GameEvent,
  type Quest,
  type CombatAction,
  type ActionResult,
  type GoodId,
  type ShipTypeId,
  type WeaponId,
  type ShieldId,
  type GadgetId,
  type NewGameOptions
} from '@game/index'
import { renderMessage } from '@i18n/index'

export type Screen =
  | 'menu'
  | 'system'
  | 'market'
  | 'shipyard'
  | 'bank'
  | 'crew'
  | 'quests'
  | 'chart'
  | 'ship'
  | 'log'

export interface Toast {
  id: number
  type: 'info' | 'error'
  text: string
}

interface GameStore {
  game: GameState | null
  encounter: Encounter | null
  event: GameEvent | null
  questOffer: Quest | null
  screen: Screen
  toast: Toast | null
  gameOver: boolean

  // lifecycle
  startNewGame: (opts: NewGameOptions) => void
  loadGame: () => Promise<boolean>
  saveGame: () => Promise<void>
  setScreen: (s: Screen) => void
  quitToMenu: () => void

  // market
  buy: (good: GoodId, amount: number) => void
  sell: (good: GoodId, amount: number) => void
  dump: (good: GoodId, amount: number) => void

  // shipyard
  refuel: (parsecs: number) => void
  refuelFull: () => void
  repair: (units: number) => void
  repairFull: () => void
  buyWeapon: (id: WeaponId) => void
  buyShield: (id: ShieldId) => void
  buyGadget: (id: GadgetId) => void
  buyEscapePod: () => void
  buyShip: (id: ShipTypeId) => void
  sellWeapon: (index: number) => void
  sellShield: (index: number) => void
  sellGadget: (index: number) => void

  // crew
  hireMercenary: (id: string) => void
  fireMercenary: (id: string) => void

  // bank
  getLoan: (amount: number) => void
  payDebt: (amount: number) => void
  buyInsurance: () => void
  cancelInsurance: () => void

  // travel & combat
  warpTo: (targetId: number) => void
  combatAction: (action: CombatAction) => void
  plunderNow: () => void
  dismissEncounter: () => void
  dismissEvent: () => void
  acceptQuestOffer: () => void
  declineQuestOffer: () => void
}

let toastCounter = 0

function clone<T>(v: T): T {
  return structuredClone(v)
}

export const useGameStore = create<GameStore>((set, get) => {
  // Apply an engine mutation, refresh reactive state, and surface a toast.
  const applyResult = (game: GameState, result: ActionResult): void => {
    if (result.ok && result.info) {
      set({
        game: clone(game),
        toast: {
          id: ++toastCounter,
          type: 'info',
          text: renderMessage(result.info.key, result.info.params)
        }
      })
    } else if (!result.ok && result.error) {
      set({
        toast: { id: ++toastCounter, type: 'error', text: renderMessage(result.error) }
      })
    } else {
      set({ game: clone(game) })
    }
  }

  const withGame = (fn: (g: GameState) => void): void => {
    const g = get().game
    if (!g) return
    fn(g)
  }

  return {
    game: null,
    encounter: null,
    event: null,
    questOffer: null,
    screen: 'menu',
    toast: null,
    gameOver: false,

    startNewGame: (opts) => {
      const game = newGame(opts)
      set({
        game,
        screen: 'system',
        encounter: null,
        event: null,
        questOffer: null,
        gameOver: false,
        toast: null
      })
      void get().saveGame()
    },

    loadGame: async () => {
      if (typeof window === 'undefined' || !window.api) return false
      const data = await window.api.loadGame()
      if (!data) return false
      try {
        const game = JSON.parse(data) as GameState
        set({ game, screen: 'system', encounter: null, gameOver: false })
        return true
      } catch {
        return false
      }
    },

    saveGame: async () => {
      const g = get().game
      if (!g || typeof window === 'undefined' || !window.api) return
      await window.api.saveGame(JSON.stringify(g))
    },

    setScreen: (s) => set({ screen: s }),

    quitToMenu: () => set({ screen: 'menu', encounter: null }),

    buy: (good, amount) => withGame((g) => applyResult(g, buyGood(g, good, amount))),
    sell: (good, amount) => withGame((g) => applyResult(g, sellGood(g, good, amount))),
    dump: (good, amount) => withGame((g) => applyResult(g, dumpGood(g, good, amount))),

    refuel: (parsecs) => withGame((g) => applyResult(g, refuel(g, parsecs))),
    refuelFull: () => withGame((g) => applyResult(g, refuelFull(g))),
    repair: (units) => withGame((g) => applyResult(g, repair(g, units))),
    repairFull: () => withGame((g) => applyResult(g, repairFull(g))),
    buyWeapon: (id) => withGame((g) => applyResult(g, buyWeapon(g, id))),
    buyShield: (id) => withGame((g) => applyResult(g, buyShield(g, id))),
    buyGadget: (id) => withGame((g) => applyResult(g, buyGadget(g, id))),
    buyEscapePod: () => withGame((g) => applyResult(g, buyEscapePod(g))),
    buyShip: (id) => withGame((g) => applyResult(g, buyShip(g, id))),
    sellWeapon: (index) => withGame((g) => applyResult(g, sellWeapon(g, index))),
    sellShield: (index) => withGame((g) => applyResult(g, sellShield(g, index))),
    sellGadget: (index) => withGame((g) => applyResult(g, sellGadget(g, index))),

    hireMercenary: (id) => withGame((g) => applyResult(g, hireMercenary(g, id))),
    fireMercenary: (id) => withGame((g) => applyResult(g, fireMercenary(g, id))),

    getLoan: (amount) => withGame((g) => applyResult(g, getLoan(g, amount))),
    payDebt: (amount) => withGame((g) => applyResult(g, payDebt(g, amount))),
    buyInsurance: () => withGame((g) => applyResult(g, buyInsurance(g))),
    cancelInsurance: () => withGame((g) => applyResult(g, cancelInsurance(g))),

    warpTo: (targetId) =>
      withGame((g) => {
        const result = warp(g, targetId)
        if (!result.ok) {
          set({ toast: { id: ++toastCounter, type: 'error', text: renderMessage(result.error!) } })
          return
        }
        const done = result.questsCompleted ?? []
        set({
          game: clone(g),
          encounter: result.encounter ? clone(result.encounter) : null,
          event: result.event ? clone(result.event) : null,
          questOffer: result.questOffer ? clone(result.questOffer) : null,
          screen: 'system',
          toast: done.length
            ? {
                id: ++toastCounter,
                type: 'info',
                text: renderMessage('quest.completedToast', { reward: done.reduce((s, q) => s + q.reward, 0) })
              }
            : get().toast
        })
        void get().saveGame()
      }),

    combatAction: (action) =>
      withGame((g) => {
        const enc = get().encounter
        if (!enc) return
        const rng = new Rng((g.seed ^ (g.day * 40503) ^ (enc.round * 2654435761)) >>> 0)
        resolveRound(g, enc, action, rng)

        if (enc.status === 'playerDestroyed') {
          handleDestruction(g)
          if (!g.ship.escapePod) {
            set({ game: clone(g), encounter: clone(enc), gameOver: true })
            return
          }
        }
        set({ game: clone(g), encounter: clone(enc) })
        void get().saveGame()
      }),

    plunderNow: () =>
      withGame((g) => {
        const enc = get().encounter
        if (!enc) return
        plunder(g, enc)
        set({ game: clone(g), encounter: clone(enc) })
      }),

    dismissEncounter: () => {
      const g = get().game
      set({ encounter: null })
      if (g) void get().saveGame()
    },

    dismissEvent: () => set({ event: null }),

    acceptQuestOffer: () =>
      withGame((g) => {
        const offer = get().questOffer
        if (!offer) return
        acceptQuest(g, offer)
        set({ game: clone(g), questOffer: null })
        void get().saveGame()
      }),

    declineQuestOffer: () => set({ questOffer: null })
  }
})

/** Handle ship destruction with an escape pod: drop into a Flea. */
function handleDestruction(g: GameState): void {
  if (!g.ship.escapePod) return
  const flea = SHIP_TYPES.flea
  g.ship = {
    type: 'flea',
    hull: flea.hullStrength,
    fuel: flea.fuelTanks,
    cargo: emptyCargo(),
    weapons: [],
    shields: [],
    shieldPoints: [],
    gadgets: [],
    crew: [],
    escapePod: false
  }
  if (g.insurance) {
    // Insurance refunds a base amount; simplified.
    g.credits += Math.round(SHIP_TYPES.flea.price)
    g.insurance = false
    g.noClaim = 0
  }
  pushLog(g, 'encounter.escapePod')
}

function emptyCargo(): GameState['ship']['cargo'] {
  return {
    water: 0, furs: 0, food: 0, ore: 0, games: 0,
    firearms: 0, medicine: 0, machines: 0, narcotics: 0, robots: 0
  }
}
