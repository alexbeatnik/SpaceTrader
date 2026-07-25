import type { GameState, Quest } from './types'
import { Rng } from './rng'
import { SHIP_TYPES } from '../data/ships'
import { SHIELDS } from '../data/equipment'
import { refreshMarket } from './market'
import { fuelCost, systemDistance } from './travel'
import { pushLog, refuelFull, advanceDay, clearLocalSourcing, effectiveSkills, maxHull } from './game'
import { rollEncounter, createBountyEncounter, type Encounter } from './combat'
import { maybeTriggerEvent, type GameEvent } from './events'
import { questsReadyToTurnIn, generateQuestOffer, generateQuestBoard, hasActiveBounty } from './quests'
import { generateCrewRoster, type CrewIncident } from './crew'
import { generateNews } from './news'

/** Encounter rolls made on a leg — a longer haul means more chances to meet someone. */
export function encounterRolls(distance: number): number {
  return Math.max(1, Math.min(3, 1 + Math.floor(distance / 6)))
}

// --- Black holes -------------------------------------------------------------
/** Base chance a leg strays too close to a singularity nobody had charted. */
export const BLACK_HOLE_CHANCE = 0.02
/** Extra chance per parsec flown — the longer the haul, the worse the odds. */
export const BLACK_HOLE_CHANCE_PER_PARSEC = 0.0015
/** Ceiling on the per-jump chance, however long the leg. */
export const BLACK_HOLE_CHANCE_MAX = 0.06

/**
 * A singularity met in transit. There is no fighting it and no bargaining with
 * it: the helm either pulls the ship out of the well or it does not, and the
 * ships that do come out have lost time and hull plate doing it.
 */
export interface BlackHoleEvent {
  /** False when the ship went over the horizon and did not come back. */
  survived: boolean
  /** Hull lost to tidal stress on the way out. */
  damage: number
  /** Days the calendar gained while the ship was down the well. */
  daysLost: number
  /** The odds the helm was working with, for the after-action report. */
  escapeChance: number
}

/**
 * Odds of pulling clear of a black hole. Flying is most of it, but a strong
 * hull, live shields and an explorer's oversized drives all buy margin — those
 * hulls are built for exactly this kind of place.
 */
export function blackHoleEscapeChance(state: GameState): number {
  const skills = effectiveSkills(state)
  const hullFraction = maxHull(state.ship) > 0 ? state.ship.hull / maxHull(state.ship) : 0
  const shielded = state.ship.shieldPoints.some((p) => p > 0) ? 0.08 : 0
  const explorer = SHIP_TYPES[state.ship.type].shipClass === 'explorer' ? 0.12 : 0
  const raw = 0.3 + skills.pilot * 0.045 + hullFraction * 0.15 + shielded + explorer
  return Math.max(0.1, Math.min(0.95, raw))
}

/** Per-jump chance of straying into one, growing with the distance flown. */
export function blackHoleChance(distance: number): number {
  return Math.min(
    BLACK_HOLE_CHANCE_MAX,
    BLACK_HOLE_CHANCE + Math.max(0, distance) * BLACK_HOLE_CHANCE_PER_PARSEC
  )
}

/**
 * Resolve an encounter with a singularity. Mutates the ship and the calendar;
 * a ship that fails the roll is left at zero hull for the caller to deal with
 * exactly as it deals with being shot to pieces (an escape pod still works).
 */
function resolveBlackHole(state: GameState, rng: Rng): BlackHoleEvent {
  const escapeChance = blackHoleEscapeChance(state)
  const survived = rng.chance(escapeChance)
  // Time runs differently down there whether or not the ship comes back out.
  const daysLost = rng.int(1, 4)
  for (let i = 0; i < daysLost; i++) advanceDay(state)

  if (!survived) {
    const damage = state.ship.hull
    state.ship.hull = 0
    state.ship.shieldPoints = state.ship.shieldPoints.map(() => 0)
    pushLog(state, 'event.blackHole.logLost')
    return { survived: false, damage, daysLost, escapeChance }
  }

  // Clear of it, but the hull was stretched getting out.
  const stress = rng.int(5, Math.max(6, Math.round(maxHull(state.ship) * 0.35)))
  const damage = Math.min(state.ship.hull - 1, stress)
  if (damage > 0) state.ship.hull -= damage
  state.ship.shieldPoints = state.ship.shieldPoints.map(() => 0)
  pushLog(state, 'event.blackHole.logSurvived', { dmg: Math.max(0, damage), days: daysLost })
  return { survived: true, damage: Math.max(0, damage), daysLost, escapeChance }
}

/**
 * The singularity written up as an event the UI can show like any other. Kept
 * in the engine so the keys stay where every other message id lives.
 *
 * Three endings, not two: the ship pulls clear, the ship is lost with all
 * hands, or the ship is lost and the pod gets the commander out — the pod is
 * the caller's business (as it is in combat), so it is passed in.
 */
export function blackHoleEvent(bh: BlackHoleEvent, escapedByPod = false): GameEvent {
  const bodyKey = bh.survived
    ? 'event.blackHole.bodySurvived'
    : escapedByPod
      ? 'event.blackHole.bodyPod'
      : 'event.blackHole.bodyLost'
  return {
    id: 'blackHole',
    titleKey: 'event.blackHole.title',
    bodyKey,
    params: {
      dmg: bh.damage,
      days: bh.daysLost,
      chance: Math.round(bh.escapeChance * 100)
    }
  }
}

export interface WarpResult {
  ok: boolean
  error?: string
  /** Everyone met en route, in the order they cut across your course. */
  encounters?: Encounter[]
  event?: GameEvent | null
  questOffer?: Quest | null
  /** Active quests that can now be handed in at the destination. */
  questsReady?: Quest[]
  /** Anything that went wrong aboard on the way over. */
  incident?: CrewIncident | null
  /** A singularity met in transit, if the leg found one. */
  blackHole?: BlackHoleEvent | null
  /**
   * Where the ship actually ended up. Normally the requested target, but an
   * unmapped wormhole picks its own destination, so never assume the two match.
   */
  arrivedAt?: number
}

/**
 * Dock at the current system: recharge shields, refresh the market, the job
 * board, the hiring hall and the news, and clear local sourcing. Shared by
 * ordinary jumps and convoy runs.
 */
export function settleArrival(state: GameState, rng: Rng): void {
  const target = state.systems[state.currentSystem]
  target.visited = true
  // A ship arriving from outside makes port at the capital planet.
  state.currentBody = 0
  // Whatever is in the hold was hauled here, so it may settle contracts; only
  // what gets bought or mined at this planet from now on may not.
  clearLocalSourcing(state)
  // Shields recharge to full on docking.
  state.ship.shieldPoints = state.ship.shields.map((s) => SHIELDS[s].power)
  // Refresh the destination economy for the new day.
  refreshMarket(target, rng)
  // Auto-refuel at the spaceport if the player has opted in (buys what it can).
  if (state.autoRefuel) {
    const res = refuelFull(state)
    if (res.ok && res.info) pushLog(state, 'log.autoRefuel', res.info.params)
  }
  // Post a fresh set of jobs on this planet's board, see who is looking for a
  // berth at the hiring hall today, and pick up what the local feeds are saying.
  target.questBoard = generateQuestBoard(state, rng)
  target.mercenaryIds = generateCrewRoster(state, rng)
  target.news = generateNews(target, rng)
}

/**
 * Everything that happens between lighting the drive and making port: the day
 * passing, whatever the leg throws at the ship, and docking at the far end.
 * Shared by ordinary jumps, surveyed wormholes and unmapped ones.
 */
function flyTo(state: GameState, targetId: number, distance: number, rng: Rng): WarpResult {
  const target = state.systems[targetId]
  state.currentSystem = targetId
  const incident = advanceDay(state, rng)

  // A leg is not one meeting: roll several times over the distance flown.
  const encounters: Encounter[] = []
  const rolls = encounterRolls(distance)
  for (let i = 0; i < rolls; i++) {
    const rolled = rollEncounter(state, rng)
    if (rolled) encounters.push(rolled)
  }

  // Bounty targets: tag a rolled pirate, or occasionally ambush on a quiet leg.
  const bounty = hasActiveBounty(state)
  if (bounty && bounty.bountyName) {
    const pirate = encounters.find((e) => e.kind === 'pirate')
    if (pirate) {
      pirate.bountyQuestId = bounty.id
      pirate.bountyName = bounty.bountyName
      pirate.messages = [{ key: 'encounter.bounty.appear', params: { bounty: bounty.bountyName } }]
    } else if (encounters.length === 0 && rng.chance(0.35)) {
      encounters.push(createBountyEncounter(state, bounty.id, bounty.bountyName, rng))
    }
  }

  // Deep space keeps one hazard nobody can shoot back at.
  const blackHole = rng.chance(blackHoleChance(distance)) ? resolveBlackHole(state, rng) : null

  // If no encounter (or a benign one), finalise arrival immediately.
  settleArrival(state, rng)

  pushLog(state, 'log.arrived', { system: target.nameId, distance })

  // Quests are handed in manually from the Quests screen; just flag which are
  // ready at this destination so the UI can prompt the player.
  const questsReady = questsReadyToTurnIn(state)

  // Special events and new offers only occur on otherwise-quiet arrivals.
  const quiet = encounters.length === 0 && !blackHole
  const event = quiet ? maybeTriggerEvent(state, rng) : null
  const questOffer = quiet && !event ? generateQuestOffer(state, rng) : null

  return {
    ok: true,
    encounters,
    event,
    questOffer,
    questsReady,
    incident,
    blackHole,
    arrivedAt: targetId
  }
}

/**
 * Warp to a target system. Returns the encounters met en route (or none).
 * The player is moved to the destination; encounters are considered "en route"
 * but are surfaced to the UI for resolution after the jump.
 */
export function warp(state: GameState, targetId: number): WarpResult {
  const here = state.systems[state.currentSystem]
  const target = state.systems[targetId]
  if (!target || targetId === state.currentSystem) return { ok: false, error: 'error.invalidTarget' }

  const viaWormhole = here.wormholeTo === targetId
  const cost = fuelCost(state, targetId)

  if (!viaWormhole && cost > state.ship.fuel) return { ok: false, error: 'error.notEnoughFuel' }

  const rng = new Rng((state.seed ^ (state.day * 2654435761)) >>> 0)

  if (viaWormhole) {
    const tax = wormholeTax(state)
    if (state.credits < tax) return { ok: false, error: 'error.cannotAffordWormhole' }
    state.credits -= tax
    pushLog(state, 'log.wormhole', { system: target.nameId, tax })
  } else {
    state.ship.fuel -= cost
  }

  return flyTo(state, targetId, viaWormhole ? 0 : systemDistance(here, target), rng)
}

/**
 * Fall into the unmapped wormhole hanging in this system.
 *
 * A surveyed wormhole is a road; this is a hole in the floor. It costs no fuel
 * and no tax, and where it puts the ship down is decided the moment the ship
 * goes in — anywhere on the chart, near or absurdly far. There is no way to
 * aim it, which is the whole point of one.
 */
export function enterUnstableWormhole(state: GameState): WarpResult {
  const here = state.systems[state.currentSystem]
  if (!here?.unstableWormhole) return { ok: false, error: 'error.noWormholeHere' }
  const elsewhere = state.systems.filter((s) => s.id !== here.id)
  if (elsewhere.length === 0) return { ok: false, error: 'error.invalidTarget' }

  const rng = new Rng((state.seed ^ (state.day * 40503) ^ (here.id * 2654435761)) >>> 0)
  const target = rng.pick(elsewhere)

  pushLog(state, 'log.unstableWormhole', { system: target.nameId })
  // The throat is violent: distance for encounter purposes is nil, but the
  // transit itself is what shakes the ship.
  return flyTo(state, target.id, 0, rng)
}

export function wormholeTax(state: GameState): number {
  return Math.round(SHIP_TYPES[state.ship.type].price * 0.02)
}
