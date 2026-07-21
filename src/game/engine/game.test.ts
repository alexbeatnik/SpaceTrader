import { describe, it, expect } from 'vitest'
import {
  newGame,
  buyGood,
  sellGood,
  usedCargoBays,
  freeCargoBays,
  refuelFull,
  hireMercenary,
  fireMercenary,
  effectiveSkills,
  crewWages,
  maxFuel,
  buyWeapon,
  sellWeapon
} from './game'
import { warp } from './warp'
import { generateGalaxy, SYSTEM_COUNT } from './galaxy'
import { standardPrice } from './market'
import { TRADE_GOODS } from '../data/goods'
import { reachableSystems } from './travel'
import { acceptQuest, checkQuestArrival, completeBounty } from './quests'
import type { Quest } from './types'

describe('galaxy generation', () => {
  it('is deterministic for a given seed', () => {
    const a = generateGalaxy(12345)
    const b = generateGalaxy(12345)
    expect(a.map((s) => [s.x, s.y, s.techLevel])).toEqual(b.map((s) => [s.x, s.y, s.techLevel]))
  })

  it('produces the expected number of systems', () => {
    expect(generateGalaxy(999).length).toBe(SYSTEM_COUNT)
  })
})

describe('new game', () => {
  it('starts with a Gnat, 1000 credits and day 1', () => {
    const g = newGame({ commanderName: 'Test', seed: 42 })
    expect(g.ship.type).toBe('gnat')
    expect(g.credits).toBe(1000)
    expect(g.day).toBe(1)
    expect(g.systems.length).toBe(SYSTEM_COUNT)
    expect(g.systems[g.currentSystem].visited).toBe(true)
  })
})

describe('trading', () => {
  it('buying reduces credits and fills cargo; selling reverses it', () => {
    const g = newGame({ commanderName: 'Test', seed: 7 })
    // find a good that is buyable here
    const sys = g.systems[g.currentSystem]
    const good = Object.keys(sys.buyPrice).find(
      (k) => sys.buyPrice[k as keyof typeof sys.buyPrice] > 0 && sys.qty[k as keyof typeof sys.qty] > 0
    ) as keyof typeof sys.buyPrice | undefined
    expect(good).toBeDefined()
    if (!good) return

    const before = g.credits
    const res = buyGood(g, good, 3)
    expect(res.ok).toBe(true)
    expect(g.credits).toBeLessThan(before)
    expect(usedCargoBays(g.ship)).toBeGreaterThan(0)

    const sell = sellGood(g, good, 999)
    expect(sell.ok).toBe(true)
    expect(g.ship.cargo[good]).toBe(0)
  })

  it('cannot buy with a full hold', () => {
    const g = newGame({ commanderName: 'Test', seed: 3 })
    // artificially fill hold
    const bays = freeCargoBays(g.ship)
    g.ship.cargo.water = bays
    const sys = g.systems[g.currentSystem]
    const good = Object.keys(sys.buyPrice).find(
      (k) => sys.buyPrice[k as keyof typeof sys.buyPrice] > 0
    ) as keyof typeof sys.buyPrice
    const res = buyGood(g, good, 1)
    expect(res.ok).toBe(false)
  })
})

describe('pricing', () => {
  it('natural goods get pricier and industrial goods cheaper with tech level', () => {
    const g = newGame({ commanderName: 'Test', seed: 5 })
    const low = { ...g.systems[0], techLevel: 0 as const }
    const high = { ...g.systems[0], techLevel: 7 as const, specialResource: 'none' as const, status: 'uneventful' as const }
    const lowFixed = { ...low, specialResource: 'none' as const, status: 'uneventful' as const }
    // water is a natural good
    expect(standardPrice(TRADE_GOODS.water, high)).toBeGreaterThan(
      standardPrice(TRADE_GOODS.water, lowFixed)
    )
  })
})

describe('crew / mercenaries', () => {
  it('hiring a mercenary raises effective skills and daily wages', () => {
    const g = newGame({ commanderName: 'Test', seed: 21 })
    g.skills = { pilot: 5, fighter: 5, trader: 5, engineer: 5 }
    g.ship.type = 'bumblebee' // has spare crew quarters
    g.systems[g.currentSystem].mercenaryId = 'nox' // fighter 10
    const hired = hireMercenary(g, 'nox')
    expect(hired.ok).toBe(true)
    expect(g.ship.crew).toContain('nox')
    expect(effectiveSkills(g).fighter).toBe(10)
    expect(crewWages(g)).toBeGreaterThan(0)

    const fired = fireMercenary(g, 'nox')
    expect(fired.ok).toBe(true)
    expect(g.ship.crew).not.toContain('nox')
    expect(crewWages(g)).toBe(0)
  })

  it('cannot hire without free quarters (Gnat has none)', () => {
    const g = newGame({ commanderName: 'Test', seed: 22 })
    g.systems[g.currentSystem].mercenaryId = 'pax'
    // Gnat has 1 crew quarter = commander only, so no room.
    const res = hireMercenary(g, 'pax')
    expect(res.ok).toBe(false)
  })
})

describe('equipment', () => {
  it('fuelCompactor increases max fuel; selling a weapon refunds credits', () => {
    const g = newGame({ commanderName: 'Test', seed: 31 })
    const baseFuel = maxFuel(g.ship)
    g.ship.gadgets.push('fuelCompactor')
    expect(maxFuel(g.ship)).toBeGreaterThan(baseFuel)

    // Buy then sell a weapon (Gnat has one weapon slot, starts with a pulse).
    g.ship.weapons = []
    g.credits = 100000
    expect(buyWeapon(g, 'beam').ok).toBe(true)
    const before = g.credits
    expect(sellWeapon(g, 0).ok).toBe(true)
    expect(g.credits).toBeGreaterThan(before)
    expect(g.ship.weapons.length).toBe(0)
  })
})

describe('quests', () => {
  it('delivery quest completes on arrival at the target and pays the reward', () => {
    const g = newGame({ commanderName: 'Test', seed: 41 })
    const target = g.systems.find((s) => s.id !== g.currentSystem)!
    const quest: Quest = {
      id: 'test-delivery',
      type: 'delivery',
      giverSystem: g.currentSystem,
      targetSystem: target.id,
      reward: 1500,
      status: 'offered'
    }
    acceptQuest(g, quest)
    const before = g.credits
    // Simulate arrival at the target.
    g.currentSystem = target.id
    const done = checkQuestArrival(g)
    expect(done.map((q) => q.id)).toContain('test-delivery')
    expect(g.credits).toBe(before + 1500)
    expect(g.quests.find((q) => q.id === 'test-delivery')?.status).toBe('completed')
  })

  it('relief quest requires the goods in the hold to complete', () => {
    const g = newGame({ commanderName: 'Test', seed: 42 })
    const target = g.systems.find((s) => s.id !== g.currentSystem)!
    const quest: Quest = {
      id: 'test-relief',
      type: 'relief',
      giverSystem: g.currentSystem,
      targetSystem: target.id,
      reward: 3000,
      status: 'offered',
      good: 'medicine',
      amount: 3
    }
    acceptQuest(g, quest)
    g.currentSystem = target.id

    // Without the goods, it stays active.
    expect(checkQuestArrival(g).length).toBe(0)
    expect(g.quests[0].status).toBe('active')

    // With the goods, it completes and consumes them.
    g.ship.cargo.medicine = 5
    const before = g.credits
    expect(checkQuestArrival(g).length).toBe(1)
    expect(g.credits).toBe(before + 3000)
    expect(g.ship.cargo.medicine).toBe(2)
  })

  it('bounty completion pays reward and raises reputation', () => {
    const g = newGame({ commanderName: 'Test', seed: 43 })
    const quest: Quest = {
      id: 'test-bounty',
      type: 'bounty',
      giverSystem: g.currentSystem,
      targetSystem: g.systems[1].id,
      reward: 4000,
      status: 'offered',
      bountyName: 'Vex'
    }
    acceptQuest(g, quest)
    const before = g.credits
    const rep = g.record.reputation
    const q = completeBounty(g, 'test-bounty')
    expect(q).not.toBeNull()
    expect(g.credits).toBe(before + 4000)
    expect(g.record.reputation).toBeGreaterThan(rep)
  })
})

describe('travel and warp', () => {
  it('warp to a reachable system advances the day and consumes fuel', () => {
    const g = newGame({ commanderName: 'Test', seed: 11 })
    refuelFull(g)
    const targets = reachableSystems(g)
    expect(targets.length).toBeGreaterThan(0)
    const target = targets[0]
    const fuelBefore = g.ship.fuel
    const dayBefore = g.day
    const res = warp(g, target.id)
    expect(res.ok).toBe(true)
    expect(g.day).toBe(dayBefore + 1)
    expect(g.ship.fuel).toBeLessThan(fuelBefore)
    expect(g.currentSystem).toBe(target.id)
  })
})
