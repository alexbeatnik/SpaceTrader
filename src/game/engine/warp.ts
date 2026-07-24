import type { GameState, Quest } from './types'
import { Rng } from './rng'
import { SHIP_TYPES } from '../data/ships'
import { SHIELDS } from '../data/equipment'
import { refreshMarket } from './market'
import { fuelCost, systemDistance } from './travel'
import { pushLog, refuelFull, advanceDay, clearLocalSourcing } from './game'
import { rollEncounter, createBountyEncounter, type Encounter } from './combat'
import { maybeTriggerEvent, type GameEvent } from './events'
import { questsReadyToTurnIn, generateQuestOffer, generateQuestBoard, hasActiveBounty } from './quests'
import { generateCrewRoster, type CrewIncident } from './crew'

/** Encounter rolls made on a leg — a longer haul means more chances to meet someone. */
export function encounterRolls(distance: number): number {
  return Math.max(1, Math.min(3, 1 + Math.floor(distance / 6)))
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
}

/**
 * Dock at the current system: recharge shields, refresh the market and job
 * board, and clear local sourcing. Shared by ordinary jumps and convoy runs.
 */
export function settleArrival(state: GameState, rng: Rng): void {
  const target = state.systems[state.currentSystem]
  target.visited = true
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
  // Post a fresh set of jobs on this planet's board, and see who is looking
  // for a berth at the hiring hall today.
  target.questBoard = generateQuestBoard(state, rng)
  target.mercenaryIds = generateCrewRoster(state, rng)
}

/**
 * Warp to a target system. Returns an encounter to resolve (or null).
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

  // Encounter roll uses destination government characteristics.
  state.currentSystem = targetId
  const incident = advanceDay(state, rng)

  // A leg is not one meeting: roll several times over the distance flown.
  const encounters: Encounter[] = []
  const rolls = encounterRolls(viaWormhole ? 0 : systemDistance(here, target))
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

  // If no encounter (or a benign one), finalise arrival immediately.
  settleArrival(state, rng)

  pushLog(state, 'log.arrived', {
    system: target.nameId,
    distance: viaWormhole ? 0 : systemDistance(here, target)
  })

  // Quests are handed in manually from the Quests screen; just flag which are
  // ready at this destination so the UI can prompt the player.
  const questsReady = questsReadyToTurnIn(state)

  // Special events and new offers only occur on otherwise-quiet arrivals.
  const quiet = encounters.length === 0
  const event = quiet ? maybeTriggerEvent(state, rng) : null
  const questOffer = quiet && !event ? generateQuestOffer(state, rng) : null

  return { ok: true, encounters, event, questOffer, questsReady, incident }
}

export function wormholeTax(state: GameState): number {
  return Math.round(SHIP_TYPES[state.ship.type].price * 0.02)
}
