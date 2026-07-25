import type { GameState, SystemBody } from './types'
import { Rng } from './rng'
import { SHIELDS } from '../data/equipment'
import { advanceDay, pushLog } from './game'
import {
  bodyTransitDays,
  currentBodyIndex,
  systemBodies
} from './location'
import { rollEncounter, type Encounter } from './combat'
import type { CrewIncident } from './crew'

/**
 * Travel inside a star system.
 *
 * A warp drive needs flat space; this deep in a star's gravity well it is so
 * much dead weight, so crossing from the capital planet out to the belt or a
 * station is done on the impulse drive. That costs no fuel worth metering but
 * it costs days, and days out in the dark are days somebody can find you.
 *
 * What it deliberately does *not* do is re-run `settleArrival`. Hopping to a
 * moon and back must not refresh the market, repost the job board, or wipe the
 * local-sourcing ledger — the last of those would launder cargo bought at a
 * planet into cargo "hauled in" to it, and quietly break every supply contract.
 */

/** Chance per day underway that something crosses the ship's course. */
export const IN_SYSTEM_ENCOUNTER_CHANCE = 0.12

export interface SystemTravelResult {
  ok: boolean
  error?: string
  /** Body index the ship ended up at. */
  arrivedAt?: number
  /** Days the crossing took. */
  days?: number
  /** Anyone met on the way out, in the order they turned up. */
  encounters?: Encounter[]
  /** Anything that went wrong aboard during the crossing. */
  incident?: CrewIncident | null
}

/** Why the ship cannot make for that body right now, or null if it can. */
export function bodyTravelProblem(state: GameState, bodyId: number): string | null {
  const bodies = systemBodies(state.systems[state.currentSystem])
  if (!bodies[bodyId]) return 'error.invalidTarget'
  if (bodyId === currentBodyIndex(state)) return 'error.alreadyHere'
  return null
}

/**
 * Run the impulse drive across the system to another body. Days pass on the
 * calendar (with everything that entails — wages, interest, an undermanned
 * station going wrong), and the ship may be intercepted on the way.
 */
export function travelToBody(state: GameState, bodyId: number, rng: Rng): SystemTravelResult {
  const problem = bodyTravelProblem(state, bodyId)
  if (problem) return { ok: false, error: problem }

  const bodies = systemBodies(state.systems[state.currentSystem])
  const from: SystemBody = bodies[currentBodyIndex(state)]
  const to: SystemBody = bodies[bodyId]
  const days = bodyTransitDays(from, to)

  let incident: CrewIncident | null = null
  const encounters: Encounter[] = []
  for (let day = 0; day < days; day++) {
    const dayIncident = advanceDay(state, rng)
    if (dayIncident && !incident) incident = dayIncident
    if (rng.chance(IN_SYSTEM_ENCOUNTER_CHANCE)) {
      const met = rollEncounter(state, rng)
      if (met) encounters.push(met)
    }
  }

  state.currentBody = bodyId
  // Docking tops the shields back up, wherever the ship has tied up.
  state.ship.shieldPoints = state.ship.shields.map((s) => SHIELDS[s].power)
  pushLog(state, 'log.arrivedBody', { days })

  return { ok: true, arrivedAt: bodyId, days, encounters, incident }
}
