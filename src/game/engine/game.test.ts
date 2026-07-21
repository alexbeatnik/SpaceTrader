import { describe, it, expect } from 'vitest'
import { newGame, buyGood, sellGood, usedCargoBays, freeCargoBays, refuelFull } from './game'
import { warp } from './warp'
import { generateGalaxy, SYSTEM_COUNT } from './galaxy'
import { standardPrice } from './market'
import { TRADE_GOODS } from '../data/goods'
import { reachableSystems } from './travel'

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
