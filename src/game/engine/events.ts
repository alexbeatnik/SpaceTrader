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
  },
  {
    id: 'ionStorm',
    weight: 2,
    run: (state, rng) => {
      if (state.ship.hull <= 12) return null
      const dmg = Math.min(state.ship.hull - 6, rng.int(4, Math.max(5, Math.round(maxHull(state.ship) * 0.12))))
      state.ship.hull -= dmg
      pushLog(state, 'event.ionStorm.log', { dmg })
      return {
        id: 'ionStorm',
        titleKey: 'event.ionStorm.title',
        bodyKey: 'event.ionStorm.body',
        params: { dmg }
      }
    }
  },
  {
    id: 'skillTrainer',
    weight: 2,
    run: (state, rng) => {
      // A retired ace drills you in one discipline (each learnable once).
      const trainable = [
        { skill: 'pilot', flag: 'trainedPilot' },
        { skill: 'fighter', flag: 'trainedFighter' },
        { skill: 'trader', flag: 'trainedTrader' },
        { skill: 'electrician', flag: 'trainedElectrician' }
      ] as Array<{ skill: 'pilot' | 'fighter' | 'trader' | 'electrician'; flag: string }>
      const options = trainable.filter(
        (o) => (state.flags[o.flag] ?? 0) < 1 && state.skills[o.skill] < MAX_SKILL
      )
      if (options.length === 0) return null
      const choice = rng.pick(options)
      state.flags[choice.flag] = 1
      state.skills[choice.skill] = Math.min(MAX_SKILL, state.skills[choice.skill] + 1)
      pushLog(state, 'event.skillTrainer.log', { skill: `skill.${choice.skill}` })
      return {
        id: 'skillTrainer',
        titleKey: 'event.skillTrainer.title',
        bodyKey: 'event.skillTrainer.body',
        params: { skill: `skill.${choice.skill}` }
      }
    }
  },
  {
    id: 'merchantConvoy',
    weight: 3,
    run: (state, rng) => {
      // A friendly convoy shares fuel money or a bit of surplus stock.
      if (freeCargoBays(state.ship) > 0 && rng.chance(0.5)) {
        const qty = Math.min(freeCargoBays(state.ship), rng.int(1, 4))
        const good = rng.pick(GOOD_IDS)
        state.ship.cargo[good] += qty
        pushLog(state, 'event.merchantConvoy.logGoods', { qty, good })
        const ev: GameEvent = {
          id: 'merchantConvoy',
          titleKey: 'event.merchantConvoy.title',
          bodyKey: 'event.merchantConvoy.bodyGoods',
          params: { qty, good }
        }
        return ev
      }
      const gift = rng.int(150, 900)
      state.credits += gift
      pushLog(state, 'event.merchantConvoy.logCredits', { gift })
      const ev: GameEvent = {
        id: 'merchantConvoy',
        titleKey: 'event.merchantConvoy.title',
        bodyKey: 'event.merchantConvoy.bodyCredits',
        params: { gift }
      }
      return ev
    }
  },
  {
    id: 'refugees',
    weight: 2,
    run: (state, rng) => {
      // Give a struggling family passage money; the deed earns goodwill.
      const aid = Math.min(state.credits, rng.int(100, 500))
      if (aid < 100) return null
      state.credits -= aid
      state.record.reputation += 1
      pushLog(state, 'event.refugees.log', { aid })
      return {
        id: 'refugees',
        titleKey: 'event.refugees.title',
        bodyKey: 'event.refugees.body',
        params: { aid }
      }
    }
  },
  {
    id: 'bountyPayout',
    weight: 2,
    run: (state, rng) => {
      // A grateful colony rewards a captain of standing.
      if (state.record.reputation < 4) return null
      const reward = rng.int(400, 1200) + state.record.reputation * 60
      state.credits += reward
      pushLog(state, 'event.bountyPayout.log', { reward })
      return {
        id: 'bountyPayout',
        titleKey: 'event.bountyPayout.title',
        bodyKey: 'event.bountyPayout.body',
        params: { reward }
      }
    }
  },
  {
    id: 'ancientProbe',
    weight: 2,
    run: (state, rng) => {
      // Recover a drifting alien probe and sell its exotic tech.
      const value = rng.int(500, 1800)
      state.credits += value
      pushLog(state, 'event.ancientProbe.log', { value })
      return {
        id: 'ancientProbe',
        titleKey: 'event.ancientProbe.title',
        bodyKey: 'event.ancientProbe.body',
        params: { value }
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
