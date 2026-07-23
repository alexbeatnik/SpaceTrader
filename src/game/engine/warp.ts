import type { GameState, Quest } from './types'
import { Rng } from './rng'
import { SHIP_TYPES } from '../data/ships'
import { SHIELDS } from '../data/equipment'
import { refreshMarket } from './market'
import { fuelCost, systemDistance } from './travel'
import { pushLog, crewWages, refuelFull } from './game'
import { rollEncounter, createBountyEncounter, type Encounter } from './combat'
import { maybeTriggerEvent, type GameEvent } from './events'
import { checkQuestArrival, generateQuestOffer, hasActiveBounty } from './quests'

export interface WarpResult {
  ok: boolean
  error?: string
  encounter?: Encounter | null
  event?: GameEvent | null
  questOffer?: Quest | null
  questsCompleted?: Quest[]
}

/** Advance daily finances, economy and ship recharge. */
function advanceDay(state: GameState): void {
  state.day++

  // Daily loan interest (10%).
  if (state.debt > 0) {
    const interest = Math.ceil(state.debt * 0.1)
    state.debt += interest
    state.credits -= interest
    if (state.credits < 0) {
      // Overdue debt is not forgiven; it simply accrues.
      state.debt += -state.credits
      state.credits = 0
    }
  }

  // Crew wages. If the player cannot pay, the crew leaves.
  const wages = crewWages(state)
  if (wages > 0) {
    if (state.credits >= wages) {
      state.credits -= wages
    } else {
      state.ship.crew = []
      pushLog(state, 'log.crewLeft')
    }
  }

  // Insurance premium & no-claim accrual.
  if (state.insurance) {
    const premium = Math.ceil(shipInsuranceValue(state) * 0.005 * (1 - Math.min(0.9, state.noClaim * 0.01)))
    state.credits = Math.max(0, state.credits - premium)
    state.noClaim++
  }

  // Police record slowly normalises toward zero.
  if (state.record.policeRecord < 0) state.record.policeRecord += 0
}

function shipInsuranceValue(state: GameState): number {
  return SHIP_TYPES[state.ship.type].price
}

/** Recharge shields fully (as when docking) and top up hull slightly. */
function onArrival(state: GameState, rng: Rng): void {
  const target = state.systems[state.currentSystem]
  target.visited = true
  // Shields recharge to full on docking.
  state.ship.shieldPoints = state.ship.shields.map((s) => SHIELDS[s].power)
  // Refresh the destination economy for the new day.
  refreshMarket(target, rng)
  // Auto-refuel at the spaceport if the player has opted in (buys what it can).
  if (state.autoRefuel) {
    const res = refuelFull(state)
    if (res.ok && res.info) pushLog(state, 'log.autoRefuel', res.info.params)
  }
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
  advanceDay(state)

  let encounter = rollEncounter(state, rng)

  // Bounty targets: tag a rolled pirate, or occasionally ambush on a quiet leg.
  const bounty = hasActiveBounty(state)
  if (bounty && bounty.bountyName) {
    if (encounter && encounter.kind === 'pirate') {
      encounter.bountyQuestId = bounty.id
      encounter.bountyName = bounty.bountyName
      encounter.messages = [{ key: 'encounter.bounty.appear', params: { name: bounty.bountyName } }]
    } else if (!encounter && rng.chance(0.35)) {
      encounter = createBountyEncounter(state, bounty.id, bounty.bountyName, rng)
    }
  }

  // If no encounter (or a benign one), finalise arrival immediately.
  onArrival(state, rng)

  pushLog(state, 'log.arrived', {
    system: target.nameId,
    distance: viaWormhole ? 0 : systemDistance(here, target)
  })

  // Complete any delivery/relief quests satisfied by this arrival.
  const questsCompleted = checkQuestArrival(state)

  // Special events and new offers only occur on otherwise-quiet arrivals.
  const event = encounter ? null : maybeTriggerEvent(state, rng)
  const questOffer = !encounter && !event ? generateQuestOffer(state, rng) : null

  return { ok: true, encounter, event, questOffer, questsCompleted }
}

export function wormholeTax(state: GameState): number {
  return Math.round(SHIP_TYPES[state.ship.type].price * 0.02)
}
