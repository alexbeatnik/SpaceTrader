import type { GameState } from './types'
import { Rng } from './rng'
import { GOOD_IDS } from '../data/goods'
import { freeCargoBays, maxHull, pushLog, MAX_SKILL } from './game'

/**
 * A one-off special event surfaced to the player after a jump. Some events are
 * purely informational; others apply an immediate effect and are reported.
 */
export interface GameEvent {
  id: string
  /** i18n key for the headline. */
  titleKey: string
  /** i18n key for the body, with optional params. */
  bodyKey: string
  params?: Record<string, string | number>
}

type EventDef = {
  id: string
  weight: number
  /** Returns an event (after applying effects) or null if not applicable now. */
  run: (state: GameState, rng: Rng) => GameEvent | null
}

const EVENTS: EventDef[] = [
  {
    id: 'derelict',
    weight: 3,
    run: (state, rng) => {
      if (freeCargoBays(state.ship) <= 0) return null
      const qty = Math.min(freeCargoBays(state.ship), rng.int(1, 5))
      const good = rng.pick(GOOD_IDS)
      state.ship.cargo[good] += qty
      pushLog(state, 'event.derelict.log', { qty, good })
      return {
        id: 'derelict',
        titleKey: 'event.derelict.title',
        bodyKey: 'event.derelict.body',
        params: { qty, good }
      }
    }
  },
  {
    id: 'fuelLeak',
    weight: 2,
    run: (state, rng) => {
      if (state.ship.fuel <= 1) return null
      const lost = Math.min(state.ship.fuel - 1, rng.int(1, 3))
      state.ship.fuel -= lost
      pushLog(state, 'event.fuelLeak.log', { lost })
      return {
        id: 'fuelLeak',
        titleKey: 'event.fuelLeak.title',
        bodyKey: 'event.fuelLeak.body',
        params: { lost }
      }
    }
  },
  {
    id: 'micrometeorite',
    weight: 2,
    run: (state, rng) => {
      if (state.ship.hull <= 10) return null
      const dmg = Math.min(state.ship.hull - 5, rng.int(3, Math.max(4, Math.round(maxHull(state.ship) * 0.15))))
      state.ship.hull -= dmg
      pushLog(state, 'event.micrometeorite.log', { dmg })
      return {
        id: 'micrometeorite',
        titleKey: 'event.micrometeorite.title',
        bodyKey: 'event.micrometeorite.body',
        params: { dmg }
      }
    }
  },
  {
    id: 'lottery',
    weight: 2,
    run: (state, rng) => {
      const prize = rng.int(200, 2000)
      state.credits += prize
      pushLog(state, 'event.lottery.log', { prize })
      return {
        id: 'lottery',
        titleKey: 'event.lottery.title',
        bodyKey: 'event.lottery.body',
        params: { prize }
      }
    }
  },
  {
    id: 'toll',
    weight: 2,
    run: (state, rng) => {
      const toll = Math.min(state.credits, rng.int(50, 400))
      if (toll <= 0) return null
      state.credits -= toll
      pushLog(state, 'event.toll.log', { toll })
      return {
        id: 'toll',
        titleKey: 'event.toll.title',
        bodyKey: 'event.toll.body',
        params: { toll }
      }
    }
  },
  {
    id: 'newsTip',
    weight: 3,
    run: (state, rng) => {
      // Reveal an interesting nearby system's status via a "newspaper" tip.
      const interesting = state.systems.filter((s) => s.status !== 'uneventful')
      if (interesting.length === 0) return null
      const tip = rng.pick(interesting)
      return {
        id: 'newsTip',
        titleKey: 'event.newsTip.title',
        bodyKey: 'event.newsTip.body',
        params: { system: tip.nameId, status: `status.${tip.status}` }
      }
    }
  },
  {
    id: 'wanderer',
    weight: 2,
    run: (state) => {
      // A wandering expert shares a trick — a permanent skill nudge (once).
      if ((state.flags.wandererMet ?? 0) >= 1) return null
      state.flags.wandererMet = 1
      state.skills.engineer = Math.min(MAX_SKILL, state.skills.engineer + 1)
      pushLog(state, 'event.wanderer.log')
      return {
        id: 'wanderer',
        titleKey: 'event.wanderer.title',
        bodyKey: 'event.wanderer.body'
      }
    }
  }
]

const TOTAL_WEIGHT = EVENTS.reduce((s, e) => s + e.weight, 0)

/**
 * With some probability, pick and run a weighted random event. Returns the event
 * to surface, or null for none. Called on arrival when no combat occurred.
 */
export function maybeTriggerEvent(state: GameState, rng: Rng, chance = 0.22): GameEvent | null {
  if (!rng.chance(chance)) return null
  // Try a few times to find an applicable event.
  for (let attempt = 0; attempt < 5; attempt++) {
    let roll = rng.int(0, TOTAL_WEIGHT - 1)
    let chosen = EVENTS[0]
    for (const e of EVENTS) {
      if (roll < e.weight) {
        chosen = e
        break
      }
      roll -= e.weight
    }
    const result = chosen.run(state, rng)
    if (result) return result
  }
  return null
}
