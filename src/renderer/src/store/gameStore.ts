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
  buyRobot,
  sellRobot,
  generateCrewRoster,
  getLoan,
  payDebt,
  buyInsurance,
  cancelInsurance,
  payFine,
  warp,
  resolveRound,
  plunder,
  tradeBuy,
  tradeSell,
  acceptQuest,
  acceptBoardQuest,
  abandonQuest,
  buyQuestSupplies,
  turnInQuest,
  generateQuestBoard,
  generateNews,
  runEscort,
  mineOnce,
  currentSystem,
  currentMineSite,
  currentBodyIndex,
  systemBodies,
  travelToBody,
  enterUnstableWormhole,
  blackHoleEvent,
  ensureBodies,
  pushLog,
  shipValue,
  systemDistance,
  transitDaysTo,
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
  type MineKind,
  type EscortRun,
  type CrewIncident
} from '@game/index'
import { renderMessage } from '@i18n/index'
import { bodyDisplayName } from '../util/bodyText'
import {
  AUTO_SLOT,
  SAVE_FORMAT,
  parseSaveFile,
  type SaveFile,
  type SaveSlotId,
  type SaveSlotInfo
} from '@shared/saves'

export type Screen =
  | 'menu'
  | 'systemMap'
  | 'system'
  | 'market'
  | 'shipyard'
  | 'bank'
  | 'crew'
  | 'quests'
  | 'chart'
  | 'ship'
  | 'log'
  | 'saves'
  | 'about'

export interface Toast {
  id: number
  type: 'info' | 'error'
  text: string
}

/**
 * How the ship is getting there. A warp jump between stars, a fall through a
 * wormhole, and an impulse crossing inside one system all replay through the
 * same overlay, and only the caption and the pace differ.
 */
export type TravelMode = 'warp' | 'wormhole' | 'impulse'

/** Descriptor of an in-progress journey, used to drive the travel animation. */
export interface TravelAnim {
  mode: TravelMode
  fromId: number
  toId: number
  fromName: string
  toName: string
  /** Parsecs for a warp jump; days under way for an impulse crossing. */
  distance: number
  viaWormhole: boolean
  shipType: ShipTypeId
  /** Animation duration in milliseconds. */
  durationMs: number
  /**
   * Points along the leg (0 = the moment you light the drive, 1 = arrival) at
   * which something cuts across your course, ascending — one per encounter. The
   * jump halts at each, the fight plays out, and the rest is flown after.
   */
  interceptPoints: number[]
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
  /** A resolved convoy run being replayed by the escort overlay. */
  escort: EscortRun | null
  /** A mishap caused by an undermanned station, shown once and dismissed. */
  incident: CrewIncident | null
  /** A just-handed-in quest, shown in the reward modal until dismissed. */
  questReward: Quest | null
  screen: Screen
  toast: Toast | null
  gameOver: boolean
  /** What finished the run, when there is a story to tell about it. */
  gameOverCause: GameEvent | null
  /** Active warp animation; while set, the destination results are deferred. */
  travel: TravelAnim | null

  // lifecycle
  startNewGame: (opts: NewGameOptions) => void
  /** Load a slot into play; defaults to the autosave ("Continue"). */
  loadGame: (slot?: SaveSlotId) => Promise<boolean>
  /** Write the current game to a slot, silently; defaults to the autosave. */
  saveGame: (slot?: SaveSlotId) => Promise<boolean>
  /** Write to a manual slot and report the outcome to the player. */
  saveToSlot: (slot: SaveSlotId) => Promise<boolean>
  listSaves: () => Promise<SaveSlotInfo[]>
  deleteSave: (slot: SaveSlotId) => Promise<boolean>
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
  buyRobot: (id: string) => void
  sellRobot: (index: number) => void

  // bank
  getLoan: (amount: number) => void
  payDebt: (amount: number) => void
  buyInsurance: () => void
  cancelInsurance: () => void
  payFine: () => void

  // travel & combat
  warpTo: (targetId: number) => void
  /** Run the impulse drive to another body inside the current system. */
  flyToBody: (bodyId: number) => void
  /** Fall into the unmapped wormhole here; the far end is anyone's guess. */
  enterWormhole: () => void
  /** Surfaces the next en-route encounter; false when there was none left. */
  interceptTravel: () => boolean
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
  dismissIncident: () => void
  acceptQuestOffer: () => void
  acceptQuestOfferBuying: () => void
  declineQuestOffer: () => void
  acceptBoardQuest: (questId: string) => void
  abandonQuest: (questId: string) => void
  turnInQuest: (questId: string) => void
  startEscort: (questId: string) => void
  finishEscort: () => void
  dismissQuestReward: () => void
}

let toastCounter = 0

// Warp result whose encounter/event/offer is deferred until the travel
// animation finishes. Kept outside reactive state (it is not rendered directly).
let pendingWarp: WarpResult | null = null

function clone<T>(v: T): T {
  return structuredClone(v)
}

/**
 * Ensure the current system has a job board and a hiring hall (fresh game, or
 * a save written before either existed), and that every system has the bodies
 * the system map draws.
 */
function ensureBoard(game: GameState): void {
  // Saves written before star systems had insides get theirs grown now, from
  // the galaxy seed, so the same save always yields the same worlds.
  ensureBodies(game.seed, game.systems)
  if (game.currentBody === undefined) game.currentBody = 0
  const sys = game.systems[game.currentSystem]
  const rng = new Rng((game.seed ^ (game.day * 2654435761)) >>> 0)
  if (!sys.questBoard || sys.questBoard.length === 0) {
    sys.questBoard = generateQuestBoard(game, rng)
  }
  if (!sys.mercenaryIds) sys.mercenaryIds = generateCrewRoster(game, rng)
  if (!sys.news || sys.news.length === 0) sys.news = generateNews(sys, rng)
  // Legacy saves predate robots and the electrician trade.
  if (!game.ship.robots) game.ship.robots = []
  if (game.skills.electrician === undefined) game.skills.electrician = game.skills.engineer
}

export const useGameStore = create<GameStore>((set, get) => {
  // Apply an engine mutation, refresh reactive state, and surface a toast.
  const applyResult = (game: GameState, result: ActionResult): void => {
    if (!result.ok) {
      // A rejected action changed nothing — report it and leave the save alone.
      if (result.error) {
        set({ toast: { id: ++toastCounter, type: 'error', text: renderMessage(result.error) } })
      }
      return
    }
    if (result.info) {
      set({
        game: clone(game),
        toast: {
          id: ++toastCounter,
          type: 'info',
          text: renderMessage(result.info.key, result.info.params)
        }
      })
    } else {
      set({ game: clone(game) })
    }
    // Persist every successful action. Without this a purchase (a new ship
    // above all) lives only in memory until the next jump, and quitting or
    // crashing before that silently rolls it back.
    void get().saveGame()
  }

  const withGame = (fn: (g: GameState) => void): void => {
    const g = get().game
    if (!g) return
    fn(g)
  }

  /**
   * Hand a resolved journey over to the travel overlay. The engine has already
   * moved the ship and settled the arrival; what is deferred is *showing* the
   * player what happened on the way, so the jump does not resolve instantly.
   * Warp jumps, wormhole falls and impulse crossings all come through here.
   */
  const startTravel = (
    game: GameState,
    result: WarpResult,
    anim: Omit<TravelAnim, 'interceptPoints' | 'toId'> & { toId?: number }
  ): void => {
    pendingWarp = result
    const toId = anim.toId ?? result.arrivedAt ?? 0
    // Whoever is out there does not politely wait at the destination: scatter
    // each meeting anywhere along the leg, from the drive lighting up to the
    // moment you make port.
    const rng = new Rng((game.seed ^ (game.day * 668265263) ^ ((toId + 1) * 2654435761)) >>> 0)
    const interceptPoints = (result.encounters ?? []).map(() => rng.next()).sort((a, b) => a - b)
    set({
      game: clone(game),
      encounter: null,
      event: null,
      questOffer: null,
      screen: 'systemMap',
      travel: { ...anim, toId, interceptPoints }
    })
    void get().saveGame()
  }

  return {
    game: null,
    encounter: null,
    event: null,
    questOffer: null,
    questReward: null,
    mining: null,
    escort: null,
    incident: null,
    screen: 'menu',
    toast: null,
    gameOver: false,
    gameOverCause: null,
    travel: null,

    startNewGame: (opts) => {
      const game = newGame(opts)
      ensureBoard(game)
      pendingWarp = null
      set({
        game,
        // A ship arriving anywhere sees the system before it sees the planet.
        screen: 'systemMap',
        encounter: null,
        event: null,
        questOffer: null,
        questReward: null,
        mining: null,
        escort: null,
        incident: null,
        gameOver: false,
        gameOverCause: null,
        toast: null,
        travel: null
      })
      void get().saveGame()
    },

    loadGame: async (slot = AUTO_SLOT) => {
      if (typeof window === 'undefined' || !window.api) return false
      try {
        const data = await window.api.loadGame(slot)
        if (!data) return false
        const file = parseSaveFile(data)
        if (!file) throw new Error('unreadable save file')
        const game = file.state as GameState
        ensureBoard(game)
        pendingWarp = null
        set({ game, screen: 'systemMap', encounter: null, event: null, questOffer: null, questReward: null, mining: null, escort: null, incident: null, gameOver: false, gameOverCause: null, travel: null })
        return true
      } catch {
        // Corrupt save file or a failed read — tell the player instead of
        // silently doing nothing.
        set({ toast: { id: ++toastCounter, type: 'error', text: renderMessage('error.loadFailed') } })
        return false
      }
    },

    saveGame: async (slot = AUTO_SLOT) => {
      const g = get().game
      if (!g || typeof window === 'undefined' || !window.api) return false
      try {
        // The summary is written alongside the state so the slot list can be
        // built without the main process ever understanding a GameState.
        const file: SaveFile<GameState> = {
          format: SAVE_FORMAT,
          meta: {
            commanderName: g.commanderName,
            day: g.day,
            credits: g.credits,
            shipType: g.ship.type,
            systemName: currentSystem(g).nameId,
            savedAt: Date.now()
          },
          state: g
        }
        return await window.api.saveGame(slot, JSON.stringify(file))
      } catch {
        // A failed save must not crash the game; the next auto-save retries.
        return false
      }
    },

    saveToSlot: async (slot) => {
      const ok = await get().saveGame(slot)
      set({
        toast: {
          id: ++toastCounter,
          type: ok ? 'info' : 'error',
          text: ok ? renderMessage('saves.saved', { slot }) : renderMessage('saves.saveFailed')
        }
      })
      return ok
    },

    listSaves: async () => {
      if (typeof window === 'undefined' || !window.api) return []
      try {
        return await window.api.listSaves()
      } catch {
        return []
      }
    },

    deleteSave: async (slot) => {
      if (typeof window === 'undefined' || !window.api) return false
      try {
        return await window.api.deleteSave(slot)
      } catch {
        return false
      }
    },

    setScreen: (s) => set({ screen: s }),

    quitToMenu: () => {
      pendingWarp = null
      set({ screen: 'menu', encounter: null, event: null, questOffer: null, questReward: null, mining: null, escort: null, incident: null, travel: null, gameOverCause: null })
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
    buyRobot: (id) => withGame((g) => applyResult(g, buyRobot(g, id))),
    sellRobot: (index) => withGame((g) => applyResult(g, sellRobot(g, index))),

    getLoan: (amount) => withGame((g) => applyResult(g, getLoan(g, amount))),
    payDebt: (amount) => withGame((g) => applyResult(g, payDebt(g, amount))),
    buyInsurance: () => withGame((g) => applyResult(g, buyInsurance(g))),
    cancelInsurance: () => withGame((g) => applyResult(g, cancelInsurance(g))),
    payFine: () => withGame((g) => applyResult(g, payFine(g))),

    warpTo: (targetId) =>
      withGame((g) => {
        // Capture origin details before the jump mutates the game state.
        const fromSys = g.systems[g.currentSystem]
        const toSys = g.systems[targetId]
        const viaWormhole = fromSys.wormholeTo === targetId
        const distance = systemDistance(fromSys, toSys)
        const fromName = fromSys.nameId
        const shipType = g.ship.type

        const result = warp(g, targetId)
        if (!result.ok) {
          set({ toast: { id: ++toastCounter, type: 'error', text: renderMessage(result.error!) } })
          return
        }

        // A long jump: ~10s (wormhole / short hop) up to ~30s far.
        const durationMs = viaWormhole
          ? 10000
          : Math.min(30000, Math.max(10000, distance * 900))

        startTravel(g, result, {
          mode: viaWormhole ? 'wormhole' : 'warp',
          fromId: fromSys.id,
          fromName,
          toName: toSys.nameId,
          distance,
          viaWormhole,
          shipType,
          durationMs
        })
      }),

    // Impulse across the system: no warp drive works this deep in a star's
    // well, so this is measured in days rather than parsecs — and days out
    // there are days somebody can find you.
    flyToBody: (bodyId) =>
      withGame((g) => {
        const sys = g.systems[g.currentSystem]
        const bodies = systemBodies(sys)
        const fromIndex = currentBodyIndex(g)
        const days = transitDaysTo(g, bodyId)
        const shipType = g.ship.type

        const rng = new Rng((g.seed ^ (g.day * 2246822519) ^ ((bodyId + 1) * 40503)) >>> 0)
        const result = travelToBody(g, bodyId, rng)
        if (!result.ok) {
          set({ toast: { id: ++toastCounter, type: 'error', text: renderMessage(result.error!) } })
          return
        }

        startTravel(
          g,
          { ok: true, encounters: result.encounters, incident: result.incident },
          {
            mode: 'impulse',
            fromId: fromIndex,
            toId: bodyId,
            fromName: bodyDisplayName(sys.nameId, bodies[fromIndex]),
            toName: bodyDisplayName(sys.nameId, bodies[bodyId]),
            distance: days,
            viaWormhole: false,
            shipType,
            // Roughly four seconds a day under way, within sane bounds.
            durationMs: Math.min(20000, Math.max(6000, days * 4000))
          }
        )
      }),

    enterWormhole: () =>
      withGame((g) => {
        const fromSys = g.systems[g.currentSystem]
        const shipType = g.ship.type
        const result = enterUnstableWormhole(g)
        if (!result.ok) {
          set({ toast: { id: ++toastCounter, type: 'error', text: renderMessage(result.error!) } })
          return
        }
        const toSys = g.systems[result.arrivedAt ?? g.currentSystem]
        startTravel(g, result, {
          mode: 'wormhole',
          fromId: fromSys.id,
          toName: toSys.nameId,
          fromName: fromSys.nameId,
          distance: 0,
          viaWormhole: true,
          shipType,
          durationMs: 9000
        })
      }),

    // Something cuts across the course mid-jump: surface the next encounter in
    // the queue and leave the rest of the arrival for when the leg is finished.
    interceptTravel: () => {
      const queue = pendingWarp?.encounters ?? []
      if (!pendingWarp || queue.length === 0) return false
      const [next, ...rest] = queue
      pendingWarp = { ...pendingWarp, encounters: rest }
      set({ encounter: clone(next) })
      return true
    },

    finishTravel: () => {
      const result = pendingWarp
      pendingWarp = null
      const ready = result?.questsReady ?? []
      const g = get().game

      // A singularity met en route is settled here, at the far end: the engine
      // has already left the ship at zero hull if it did not pull clear, and it
      // is resolved exactly as being shot to pieces is.
      const blackHole = result?.blackHole ?? null
      if (blackHole && g) {
        if (!blackHole.survived) {
          const survives = g.ship.escapePod
          const story = blackHoleEvent(blackHole, survives)
          handleDestruction(g)
          set({
            travel: null,
            game: clone(g),
            encounter: null,
            event: survives ? clone(story) : null,
            incident: null,
            questOffer: null,
            gameOver: !survives,
            gameOverCause: survives ? null : clone(story)
          })
          void get().saveGame()
          return
        }
        // Survived it — the story is told, and anything else waiting on this
        // arrival can wait for the next screen.
        set({
          travel: null,
          encounter: result?.encounters?.length ? clone(result.encounters[0]) : null,
          event: clone(blackHoleEvent(blackHole)),
          incident: result?.incident ? clone(result.incident) : null,
          questOffer: null
        })
        return
      }

      set({
        travel: null,
        // Normally every encounter has already been met en route; anything left
        // (a throttled animation cut short) is surfaced rather than dropped.
        encounter: result?.encounters?.length ? clone(result.encounters[0]) : null,
        event: result?.event ? clone(result.event) : null,
        incident: result?.incident ? clone(result.incident) : null,
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
        const site = currentMineSite(g)
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
          incident: res.incident ? clone(res.incident) : null,
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
        // Seeded off this encounter, not the calendar: keyed on the day alone,
        // two fights on the same leg rolled the very same dice round for round.
        const rng = new Rng((enc.seed ^ (enc.round * 2654435761)) >>> 0)
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
        void get().saveGame()
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

    dismissIncident: () => set({ incident: null }),

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

    acceptBoardQuest: (questId) => withGame((g) => applyResult(g, acceptBoardQuest(g, questId))),

    abandonQuest: (questId) => withGame((g) => applyResult(g, abandonQuest(g, questId))),

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

    // The whole convoy run resolves in one engine call; the overlay then
    // replays it leg by leg so the player watches it unfold.
    startEscort: (questId) =>
      withGame((g) => {
        const rng = new Rng((g.seed ^ (g.day * 2654435761) ^ 0x5c07) >>> 0)
        const res = runEscort(g, questId, rng)
        if (!res.ok || !res.run) {
          set({
            toast: {
              id: ++toastCounter,
              type: 'error',
              text: renderMessage(res.error ?? 'error.questGone')
            }
          })
          return
        }
        set({ game: clone(g), escort: clone(res.run), screen: 'systemMap' })
        void get().saveGame()
      }),

    finishEscort: () => {
      const run = get().escort
      const g = get().game
      set({ escort: null })
      if (!run || !g) return
      if (run.destroyed) {
        // Losing the ship on contract is resolved exactly as in combat.
        const survives = g.ship.escapePod
        handleDestruction(g)
        set({ game: clone(g), gameOver: !survives })
        void get().saveGame()
        return
      }
      const quest = g.quests.find((q) => q.id === run.questId)
      set({ questReward: quest ? clone(quest) : null })
      void get().saveGame()
    },

    dismissQuestReward: () => set({ questReward: null })
  }
})

/** Handle ship destruction with an escape pod: drop into a Flea. */
function handleDestruction(g: GameState): void {
  if (!g.ship.escapePod) return
  // Value the wreck *before* it is replaced: insurance must pay out on the ship
  // that was actually lost, not on the Flea handed over as a replacement.
  const payout = g.insurance ? shipValue(g.ship) : 0
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
    robots: [],
    escapePod: false
  }
  if (payout > 0) {
    g.credits += payout
    g.insurance = false
    g.noClaim = 0
    pushLog(g, 'log.insurancePaid', { amount: payout })
  }
  pushLog(g, 'encounter.escapePod')
}

function emptyCargo(): GameState['ship']['cargo'] {
  const rec = {} as GameState['ship']['cargo']
  for (const g of GOOD_IDS) rec[g] = 0
  return rec
}
