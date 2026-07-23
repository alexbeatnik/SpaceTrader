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
  buyHullUpgrade,
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
  acceptBoardQuest,
  buyQuestSupplies,
  turnInQuest,
  generateQuestBoard,
  mineOnce,
  currentSystem,
  pushLog,
  systemDistance,
  Rng,
  SHIP_TYPES,
  GOOD_IDS,
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
  type WarpResult,
  type MineKind
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

/** Active real-time mining operation at the current system. */
export interface MiningSession {
  kind: MineKind
  resource: GoodId | 'fuel'
  /** Real-time milliseconds to extract one unit. */
  unitMs: number
}

interface GameStore {
  game: GameState | null
  encounter: Encounter | null
  event: GameEvent | null
  questOffer: Quest | null
  /** Active mining session; while set, the mining overlay runs. */
  mining: MiningSession | null
  /** A just-handed-in quest, shown in the reward modal until dismissed. */
  questReward: Quest | null
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
  buyHullUpgrade: () => void
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
  startMining: () => void
  mineTick: () => void
  stopMining: () => void
  combatAction: (action: CombatAction) => void
  plunderNow: () => void
  tradeBuyFromTrader: (good: GoodId, amount: number) => void
  tradeSellToTrader: (good: GoodId, amount: number) => void
  dismissEncounter: () => void
  dismissEvent: () => void
  acceptQuestOffer: () => void
  acceptQuestOfferBuying: () => void
  declineQuestOffer: () => void
  acceptBoardQuest: (questId: string) => void
  turnInQuest: (questId: string) => void
  dismissQuestReward: () => void
}

let toastCounter = 0

// Warp result whose encounter/event/offer is deferred until the travel
// animation finishes. Kept outside reactive state (it is not rendered directly).
let pendingWarp: WarpResult | null = null

function clone<T>(v: T): T {
  return structuredClone(v)
}

/** Ensure the current system has a job board (fresh game / legacy save). */
function ensureBoard(game: GameState): void {
  const sys = game.systems[game.currentSystem]
  if (!sys.questBoard || sys.questBoard.length === 0) {
    sys.questBoard = generateQuestBoard(game, new Rng((game.seed ^ (game.day * 2654435761)) >>> 0))
  }
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
    questReward: null,
    mining: null,
    screen: 'menu',
    toast: null,
    gameOver: false,
    travel: null,

    startNewGame: (opts) => {
      const game = newGame(opts)
      ensureBoard(game)
      pendingWarp = null
      set({
        game,
        screen: 'system',
        encounter: null,
        event: null,
        questOffer: null,
        questReward: null,
        mining: null,
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
        ensureBoard(game)
        pendingWarp = null
        set({ game, screen: 'system', encounter: null, event: null, questOffer: null, questReward: null, mining: null, gameOver: false, travel: null })
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
      set({ screen: 'menu', encounter: null, event: null, questOffer: null, questReward: null, mining: null, travel: null })
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
    buyHullUpgrade: () => withGame((g) => applyResult(g, buyHullUpgrade(g))),
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
        // A long, skippable jump: ~10s (wormhole / short hop) up to ~30s far.
        const durationMs = viaWormhole
          ? 10000
          : Math.min(30000, Math.max(10000, distance * 900))

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
      const ready = result?.questsReady ?? []
      set({
        travel: null,
        encounter: result?.encounter ? clone(result.encounter) : null,
        event: result?.event ? clone(result.event) : null,
        questOffer: result?.questOffer ? clone(result.questOffer) : null,
        // Prompt the player to hand in any quest that's ready here.
        toast: ready.length
          ? {
              id: ++toastCounter,
              type: 'info',
              text: renderMessage('quest.readyToast', { count: ready.length })
            }
          : get().toast
      })
    },

    startMining: () =>
      withGame((g) => {
        const site = currentSystem(g).mineSite
        if (!site) {
          set({ toast: { id: ++toastCounter, type: 'error', text: renderMessage('error.noMineSite') } })
          return
        }
        set({ mining: { kind: site.kind, resource: site.resource, unitMs: 30000 } })
      }),

    mineTick: () =>
      withGame((g) => {
        if (!get().mining) return
        const rng = new Rng((g.seed ^ (g.day * 2654435761)) >>> 0)
        const res = mineOnce(g, rng)
        if (!res.ok) {
          // No room (hold/tank full) — stop the operation.
          set({ mining: null, toast: { id: ++toastCounter, type: 'error', text: renderMessage(res.error!) } })
          void get().saveGame()
          return
        }
        if (res.encounter) {
          // Raiders! Break off mining and drop into combat.
          set({
            game: clone(g),
            mining: null,
            encounter: clone(res.encounter),
            toast: { id: ++toastCounter, type: 'error', text: renderMessage('mining.raid') }
          })
          void get().saveGame()
          return
        }
        set({
          game: clone(g),
          toast: {
            id: ++toastCounter,
            type: 'info',
            text:
              res.resource === 'fuel'
                ? renderMessage('log.minedFuel')
                : renderMessage('log.mined', { good: res.resource! })
          }
        })
        void get().saveGame()
      }),

    stopMining: () => set({ mining: null }),

    combatAction: (action) =>
      withGame((g) => {
        const enc = get().encounter
        if (!enc) return
        const rng = new Rng((g.seed ^ (g.day * 40503) ^ (enc.round * 2654435761)) >>> 0)
        resolveRound(g, enc, action, rng)

        if (enc.status === 'playerDestroyed') {
          // Whether the player survives depends on owning a pod *before*
          // handleDestruction swaps in a fresh (pod-less) Flea.
          const survives = g.ship.escapePod
          handleDestruction(g)
          if (!survives) {
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

    declineQuestOffer: () => set({ questOffer: null }),

    acceptBoardQuest: (questId) =>
      withGame((g) => {
        const res = acceptBoardQuest(g, questId)
        applyResult(g, res)
        if (res.ok) void get().saveGame()
      }),

    turnInQuest: (questId) =>
      withGame((g) => {
        const q = turnInQuest(g, questId)
        if (!q) {
          set({ toast: { id: ++toastCounter, type: 'error', text: renderMessage('error.cannotTurnIn') } })
          return
        }
        set({ game: clone(g), questReward: clone(q) })
        void get().saveGame()
      }),

    dismissQuestReward: () => set({ questReward: null })
  }
})

/** Handle ship destruction with an escape pod: drop into a Flea. */
function handleDestruction(g: GameState): void {
  if (!g.ship.escapePod) return
  const flea = SHIP_TYPES.flea
  g.ship = {
    type: 'flea',
    hull: flea.hullStrength,
    hullUpgrades: 0,
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
  const rec = {} as GameState['ship']['cargo']
  for (const g of GOOD_IDS) rec[g] = 0
  return rec
}
