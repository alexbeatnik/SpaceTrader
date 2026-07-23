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
  tradeBuy,
  tradeSell,
  acceptQuest,
  buyQuestSupplies,
  pushLog,
  systemDistance,
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
  type NewGameOptions,
  type WarpResult
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

/** Descriptor of an in-progress warp jump, used to drive the travel animation. */
export interface TravelAnim {
  fromId: number
  toId: number
  fromName: string
  toName: string
  distance: number
  viaWormhole: boolean
  shipType: ShipTypeId
  /** Animation duration in milliseconds. */
  durationMs: number
}

interface GameStore {
  game: GameState | null
  encounter: Encounter | null
  event: GameEvent | null
  questOffer: Quest | null
  screen: Screen
  toast: Toast | null
  gameOver: boolean
  /** Active warp animation; while set, the destination results are deferred. */
  travel: TravelAnim | null

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
  setAutoRefuel: (enabled: boolean) => void
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
  finishTravel: () => void
  combatAction: (action: CombatAction) => void
  plunderNow: () => void
  tradeBuyFromTrader: (good: GoodId, amount: number) => void
  tradeSellToTrader: (good: GoodId, amount: number) => void
  dismissEncounter: () => void
  dismissEvent: () => void
  acceptQuestOffer: () => void
  acceptQuestOfferBuying: () => void
  declineQuestOffer: () => void
}

let toastCounter = 0

// Warp result whose encounter/event/offer is deferred until the travel
// animation finishes. Kept outside reactive state (it is not rendered directly).
let pendingWarp: WarpResult | null = null

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
    travel: null,

    startNewGame: (opts) => {
      const game = newGame(opts)
      pendingWarp = null
      set({
        game,
        screen: 'system',
        encounter: null,
        event: null,
        questOffer: null,
        gameOver: false,
        toast: null,
        travel: null
      })
      void get().saveGame()
    },

    loadGame: async () => {
      if (typeof window === 'undefined' || !window.api) return false
      const data = await window.api.loadGame()
      if (!data) return false
      try {
        const game = JSON.parse(data) as GameState
        pendingWarp = null
        set({ game, screen: 'system', encounter: null, event: null, questOffer: null, gameOver: false, travel: null })
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

    quitToMenu: () => {
      pendingWarp = null
      set({ screen: 'menu', encounter: null, event: null, questOffer: null, travel: null })
    },

    buy: (good, amount) => withGame((g) => applyResult(g, buyGood(g, good, amount))),
    sell: (good, amount) => withGame((g) => applyResult(g, sellGood(g, good, amount))),
    dump: (good, amount) => withGame((g) => applyResult(g, dumpGood(g, good, amount))),

    refuel: (parsecs) => withGame((g) => applyResult(g, refuel(g, parsecs))),
    refuelFull: () => withGame((g) => applyResult(g, refuelFull(g))),
    setAutoRefuel: (enabled) =>
      withGame((g) => {
        g.autoRefuel = enabled
        set({ game: clone(g) })
        void get().saveGame()
      }),
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
        // Capture origin details before the jump mutates the game state.
        const fromSys = g.systems[g.currentSystem]
        const toSys = g.systems[targetId]
        const viaWormhole = fromSys.wormholeTo === targetId
        const distance = systemDistance(fromSys, toSys)
        const fromName = fromSys.nameId
        const toName = toSys.nameId
        const shipType = g.ship.type

        const result = warp(g, targetId)
        if (!result.ok) {
          set({ toast: { id: ++toastCounter, type: 'error', text: renderMessage(result.error!) } })
          return
        }

        // Defer surfacing encounter/event/offer until the travel animation ends.
        pendingWarp = result
        const durationMs = viaWormhole
          ? 1600
          : Math.min(3400, Math.max(1500, distance * 130))

        set({
          game: clone(g),
          encounter: null,
          event: null,
          questOffer: null,
          screen: 'system',
          travel: { fromId: fromSys.id, toId: targetId, fromName, toName, distance, viaWormhole, shipType, durationMs }
        })
        void get().saveGame()
      }),

    finishTravel: () => {
      const result = pendingWarp
      pendingWarp = null
      const done = result?.questsCompleted ?? []
      set({
        travel: null,
        encounter: result?.encounter ? clone(result.encounter) : null,
        event: result?.event ? clone(result.event) : null,
        questOffer: result?.questOffer ? clone(result.questOffer) : null,
        toast: done.length
          ? {
              id: ++toastCounter,
              type: 'info',
              text: renderMessage('quest.completedToast', { reward: done.reduce((s, q) => s + q.reward, 0) })
            }
          : get().toast
      })
    },

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

    tradeBuyFromTrader: (good, amount) =>
      withGame((g) => {
        const enc = get().encounter
        if (!enc) return
        const result = tradeBuy(g, enc, good, amount)
        if (result.ok && result.info) {
          set({
            game: clone(g),
            encounter: clone(enc),
            toast: { id: ++toastCounter, type: 'info', text: renderMessage(result.info.key, result.info.params) }
          })
          void get().saveGame()
        } else if (result.error) {
          set({ toast: { id: ++toastCounter, type: 'error', text: renderMessage(result.error) } })
        }
      }),

    tradeSellToTrader: (good, amount) =>
      withGame((g) => {
        const enc = get().encounter
        if (!enc) return
        const result = tradeSell(g, enc, good, amount)
        if (result.ok && result.info) {
          set({
            game: clone(g),
            encounter: clone(enc),
            toast: { id: ++toastCounter, type: 'info', text: renderMessage(result.info.key, result.info.params) }
          })
          void get().saveGame()
        } else if (result.error) {
          set({ toast: { id: ++toastCounter, type: 'error', text: renderMessage(result.error) } })
        }
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

    acceptQuestOfferBuying: () =>
      withGame((g) => {
        const offer = get().questOffer
        if (!offer) return
        acceptQuest(g, offer)
        const res = buyQuestSupplies(g, offer)
        set({
          game: clone(g),
          questOffer: null,
          toast:
            res.ok && res.info
              ? { id: ++toastCounter, type: 'info', text: renderMessage(res.info.key, res.info.params) }
              : get().toast
        })
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
