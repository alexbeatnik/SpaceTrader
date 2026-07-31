import type { GameState, GoodId } from './types'
import { Rng } from './rng'
import {
  currentMineSite,
  atCapital,
  freeCargoBays,
  maxFuel,
  advanceDay,
  pushLog,
  noteLocalSourcing,
  INDUSTRIAL_MINING_YIELD
} from './game'
import { SHIP_TYPES } from '../data/ships'
import { pirateEncounterChance, spawnPirates, type Encounter } from './combat'
import type { CrewIncident } from './crew'

export interface MineResult {
  ok: boolean
  error?: string
  /** Resource extracted this tick: a good id, or 'fuel'. */
  resource?: GoodId | 'fuel'
  amount?: number
  /** Rare bonus good struck while mining (asteroid gems), if any. */
  bonus?: GoodId
  /** Raiders that jumped the operation, if any. */
  encounter?: Encounter | null
  /** Anything that went wrong aboard during the day's work. */
  incident?: CrewIncident | null
}

/**
 * Extract from the site at whichever body the ship is docked at — the belt or
 * the ice moon out in the system, as often as the capital planet's own workings.
 * A day passes each time, and there is a chance raiders jump the operation.
 * Industrial-class hulls run heavy rigs and extract several units per day.
 */
export function mineOnce(state: GameState, rng: Rng): MineResult {
  const site = currentMineSite(state)
  if (!site) return { ok: false, error: 'error.noMineSite' }

  // Make sure there's somewhere to put the yield before spending a day.
  if (site.resource === 'fuel') {
    if (state.ship.fuel >= maxFuel(state.ship)) return { ok: false, error: 'error.tankFull' }
  } else if (freeCargoBays(state.ship) <= 0) {
    return { ok: false, error: 'error.holdFull' }
  }

  const incident = advanceDay(state, rng)

  const yieldPerDay =
    SHIP_TYPES[state.ship.type].shipClass === 'industrial' ? INDUSTRIAL_MINING_YIELD : 1

  let bonus: GoodId | undefined
  let amount: number
  if (site.resource === 'fuel') {
    const cap = maxFuel(state.ship)
    amount = Math.min(yieldPerDay, cap - state.ship.fuel)
    state.ship.fuel += amount
    pushLog(state, 'log.minedFuel')
  } else {
    amount = Math.min(yieldPerDay, freeCargoBays(state.ship))
    state.ship.cargo[site.resource] += amount
    // Mining at the capital is local sourcing; mining at another body in the
    // system is cargo hauled in from elsewhere and may fulfil a port contract.
    if (atCapital(state)) noteLocalSourcing(state, site.resource, amount)
    pushLog(state, 'log.mined', { good: site.resource })
    // Asteroid fields occasionally yield a rare gem.
    if (
      site.kind === 'asteroidField' &&
      freeCargoBays(state.ship) > 0 &&
      rng.chance(0.05 + site.richness * 0.004)
    ) {
      state.ship.cargo.gems += 1
      if (atCapital(state)) noteLocalSourcing(state, 'gems', 1)
      bonus = 'gems'
      pushLog(state, 'log.minedBonus', { good: 'gems' })
    }
  }

  // Raiders sometimes pounce on an exposed mining operation.
  const encounter = rng.chance(pirateEncounterChance(state, 0.12)) ? spawnPirates(state, rng) : null
  return { ok: true, resource: site.resource, amount, bonus, encounter, incident }
}
