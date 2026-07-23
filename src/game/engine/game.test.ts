import { describe, it, expect } from 'vitest'
import {
  newGame,
  buyGood,
  sellGood,
  usedCargoBays,
  freeCargoBays,
  hireMercenary,
  fireMercenary,
  effectiveSkills,
  crewWages,
  maxFuel,
  buyWeapon,
  sellWeapon,
  fuelPricePerParsec,
  maxHull,
  buyHullUpgrade,
  HULL_UPGRADE_AMOUNT,
  MAX_HULL_UPGRADES
} from './game'
import { warp } from './warp'
import { resolveRound, tradeBuy, tradeSell } from './combat'
import type { Encounter, EncounterKind, Opponent } from './combat'
import { generateGalaxy, SYSTEM_COUNT } from './galaxy'
import { standardPrice } from './market'
import { TRADE_GOODS, GOOD_IDS } from '../data/goods'
import { SHIP_TYPES, SHIP_TYPE_IDS } from '../data/ships'
import { MERCENARIES, MERCENARY_IDS } from '../data/mercenaries'
import { systemDistance } from './travel'
import {
  acceptQuest,
  canTurnIn,
  turnInQuest,
  completeBounty,
  generateQuestOffer,
  generateQuestBoard,
  acceptBoardQuest,
  buyQuestSupplies,
  questSupplyMissing
} from './quests'
import { Rng } from './rng'
import type { Quest, GoodId } from './types'

// --- Test helpers ------------------------------------------------------------
function emptyCargo(): Record<GoodId, number> {
  const rec = {} as Record<GoodId, number>
  for (const g of GOOD_IDS) rec[g] = 0
  return rec
}

/** Build an ongoing encounter with an inert opponent, overriding as needed. */
function testEncounter(kind: EncounterKind, opp: Partial<Opponent> = {}): Encounter {
  const opponent: Opponent = {
    kind,
    shipType: 'gnat',
    hull: 100,
    maxHull: 100,
    shieldPoints: 0,
    maxShield: 0,
    weaponPower: 0,
    pilot: 0,
    fighter: 5,
    cargo: emptyCargo(),
    fleeing: false,
    ...opp
  }
  return {
    kind,
    opponent,
    reserves: [],
    fleetSize: 1,
    defeated: 0,
    status: 'ongoing',
    round: 0,
    bribeCost: 0,
    messages: []
  }
}

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

describe('planet economies', () => {
  it('agrarian worlds sell food cheaper and machines dearer than industrial ones', () => {
    const g = newGame({ commanderName: 'Test', seed: 8 })
    const base = {
      ...g.systems[0],
      techLevel: 5 as const,
      specialResource: 'none' as const,
      status: 'uneventful' as const,
      politics: 'democracy' as const
    }
    const agrarian = { ...base, economyType: 'agricultural' as const }
    const industrial = { ...base, economyType: 'industrial' as const }
    expect(standardPrice(TRADE_GOODS.food, agrarian)).toBeLessThan(
      standardPrice(TRADE_GOODS.food, industrial)
    )
    expect(standardPrice(TRADE_GOODS.machines, agrarian)).toBeGreaterThan(
      standardPrice(TRADE_GOODS.machines, industrial)
    )
  })

  it('fuel is cheaper on energy worlds than on resort worlds', () => {
    const g = newGame({ commanderName: 'Test', seed: 9 })
    g.systems[g.currentSystem].economyType = 'refinery'
    const cheap = fuelPricePerParsec(g)
    g.systems[g.currentSystem].economyType = 'resort'
    const dear = fuelPricePerParsec(g)
    expect(dear).toBeGreaterThan(cheap)
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
  it('a hull upgrade raises max and current hull, and is capped', () => {
    const g = newGame({ commanderName: 'Test', seed: 81 })
    g.credits = 200000
    const baseMax = maxHull(g.ship)
    const hp0 = g.ship.hull
    const res = buyHullUpgrade(g)
    expect(res.ok).toBe(true)
    expect(maxHull(g.ship)).toBe(baseMax + HULL_UPGRADE_AMOUNT)
    expect(g.ship.hull).toBe(hp0 + HULL_UPGRADE_AMOUNT)
    expect(g.ship.hullUpgrades).toBe(1)

    for (let i = 0; i < MAX_HULL_UPGRADES + 3; i++) buyHullUpgrade(g)
    expect(g.ship.hullUpgrades).toBe(MAX_HULL_UPGRADES)
    expect(buyHullUpgrade(g).ok).toBe(false) // capped
  })

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
  it('delivery hands in at the target (never at the giver) and pays the reward', () => {
    const g = newGame({ commanderName: 'Test', seed: 41 })
    const giver = g.currentSystem
    const target = g.systems.find((s) => s.id !== giver)!
    const quest: Quest = {
      id: 'test-delivery',
      type: 'delivery',
      giverSystem: giver,
      targetSystem: target.id,
      reward: 1500,
      status: 'offered'
    }
    acceptQuest(g, quest)
    const before = g.credits

    // Cannot be handed in at the giver planet.
    expect(canTurnIn(g, quest)).toBe(false)

    // At the destination it can be handed in manually.
    g.currentSystem = target.id
    expect(canTurnIn(g, quest)).toBe(true)
    const done = turnInQuest(g, 'test-delivery')
    expect(done?.id).toBe('test-delivery')
    expect(g.credits).toBe(before + 1500)
    expect(g.quests.find((q) => q.id === 'test-delivery')?.status).toBe('completed')
  })

  it('relief requires the goods in the hold before it can be handed in', () => {
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

    // At the target but without the goods: cannot hand in.
    expect(canTurnIn(g, quest)).toBe(false)
    expect(turnInQuest(g, 'test-relief')).toBeNull()

    // With the goods, it completes and consumes them.
    g.ship.cargo.medicine = 5
    const before = g.credits
    expect(canTurnIn(g, quest)).toBe(true)
    expect(turnInQuest(g, 'test-relief')).not.toBeNull()
    expect(g.credits).toBe(before + 3000)
    expect(g.ship.cargo.medicine).toBe(2)
  })

  it('passenger hands in at the destination', () => {
    const g = newGame({ commanderName: 'Test', seed: 44 })
    const target = g.systems.find((s) => s.id !== g.currentSystem)!
    const quest: Quest = {
      id: 'test-passenger',
      type: 'passenger',
      giverSystem: g.currentSystem,
      targetSystem: target.id,
      reward: 2000,
      status: 'offered',
      passengerName: 'Envoy Sarn'
    }
    acceptQuest(g, quest)
    const before = g.credits
    g.currentSystem = target.id
    expect(canTurnIn(g, quest)).toBe(true)
    expect(turnInQuest(g, 'test-passenger')?.id).toBe('test-passenger')
    expect(g.credits).toBe(before + 2000)
  })

  it('smuggle requires the contraband in the hold and consumes it', () => {
    const g = newGame({ commanderName: 'Test', seed: 45 })
    const target = g.systems.find((s) => s.id !== g.currentSystem)!
    const quest: Quest = {
      id: 'test-smuggle',
      type: 'smuggle',
      giverSystem: g.currentSystem,
      targetSystem: target.id,
      reward: 5000,
      status: 'offered',
      good: 'firearms',
      amount: 3
    }
    acceptQuest(g, quest)
    g.currentSystem = target.id
    expect(canTurnIn(g, quest)).toBe(false)
    g.ship.cargo.firearms = 4
    const before = g.credits
    expect(turnInQuest(g, 'test-smuggle')).not.toBeNull()
    expect(g.credits).toBe(before + 5000)
    expect(g.ship.cargo.firearms).toBe(1)
  })

  it('fetch hands in when the goods are returned to the giver system', () => {
    const g = newGame({ commanderName: 'Test', seed: 46 })
    const giver = g.currentSystem
    const quest: Quest = {
      id: 'test-fetch',
      type: 'fetch',
      giverSystem: giver,
      targetSystem: giver, // must return here
      reward: 1800,
      status: 'offered',
      good: 'ore',
      amount: 4
    }
    acceptQuest(g, quest)
    // Away from the giver: cannot hand in.
    const elsewhere = g.systems.find((s) => s.id !== giver)!
    g.currentSystem = elsewhere.id
    expect(canTurnIn(g, quest)).toBe(false)
    // Return with the goods.
    g.currentSystem = giver
    g.ship.cargo.ore = 4
    const before = g.credits
    expect(turnInQuest(g, 'test-fetch')).not.toBeNull()
    expect(g.credits).toBe(before + 1800)
    expect(g.ship.cargo.ore).toBe(0)
  })

  it('job board postings can be accepted and move into active quests', () => {
    const g = newGame({ commanderName: 'Test', seed: 48 })
    const board = generateQuestBoard(g, new Rng(123))
    expect(board.length).toBeGreaterThan(0)
    g.systems[g.currentSystem].questBoard = board
    const posting = board[0]
    const res = acceptBoardQuest(g, posting.id)
    expect(res.ok).toBe(true)
    expect(g.quests.some((q) => q.id === posting.id && q.status === 'active')).toBe(true)
    // Removed from the board once taken.
    expect(g.systems[g.currentSystem].questBoard.some((q) => q.id === posting.id)).toBe(false)
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

  it('buys a cargo quest\'s required goods on the spot', () => {
    const g = newGame({ commanderName: 'Test', seed: 47 })
    g.credits = 100000
    const target = g.systems.find((s) => s.id !== g.currentSystem)!
    const quest: Quest = {
      id: 'test-supply',
      type: 'relief',
      giverSystem: g.currentSystem,
      targetSystem: target.id,
      reward: 3000,
      status: 'offered',
      good: 'medicine',
      amount: 4
    }
    acceptQuest(g, quest)
    expect(questSupplyMissing(g, quest)).toBe(4)

    const before = g.credits
    const res = buyQuestSupplies(g, quest)
    expect(res.ok).toBe(true)
    expect(g.ship.cargo.medicine).toBe(4)
    expect(g.credits).toBeLessThan(before)
    expect(questSupplyMissing(g, quest)).toBe(0)

    // Nothing left to buy once the hold already covers the requirement.
    expect(buyQuestSupplies(g, quest).ok).toBe(false)
  })
})

describe('data integrity', () => {
  it('every ship type has a complete, sane stat block', () => {
    for (const id of SHIP_TYPE_IDS) {
      const s = SHIP_TYPES[id]
      expect(s.id).toBe(id)
      expect(s.price).toBeGreaterThan(0)
      expect(s.hullStrength).toBeGreaterThan(0)
      expect(s.fuelTanks).toBeGreaterThan(0)
      expect(s.crewQuarters).toBeGreaterThanOrEqual(1)
    }
    for (const id of ['dragonfly', 'locust', 'mantis', 'centipede', 'scorpion', 'widow'] as const) {
      expect(SHIP_TYPE_IDS).toContain(id)
    }
  })

  it('every mercenary has four skills and a positive wage', () => {
    for (const id of MERCENARY_IDS) {
      const m = MERCENARIES[id]
      expect(m.id).toBe(id)
      expect(m.wage).toBeGreaterThan(0)
      for (const k of ['pilot', 'fighter', 'trader', 'engineer'] as const) {
        expect(m.skills[k]).toBeGreaterThanOrEqual(0)
      }
    }
    expect(MERCENARY_IDS).toContain('zane')
  })
})

describe('encounter kinds', () => {
  it('surrendering to a bounty hunter costs a ransom but ends the fight', () => {
    const g = newGame({ commanderName: 'Test', seed: 72 })
    g.credits = 10000
    const enc = testEncounter('bountyHunter')
    resolveRound(g, enc, 'surrender', new Rng(1))
    expect(enc.status).toBe('playerSurrendered')
    expect(g.credits).toBe(6500) // max(500, round(10000 * 0.35)) = 3500 taken
  })

  it('a corruptible bounty hunter can be bribed', () => {
    const g = newGame({ commanderName: 'Test', seed: 73 })
    g.credits = 10000
    const enc = testEncounter('bountyHunter')
    enc.bribeCost = 500
    resolveRound(g, enc, 'bribe', new Rng(1))
    expect(enc.status).toBe('bribed')
    expect(g.credits).toBe(9500)
  })

  it('destroying an alien vessel raises combat reputation', () => {
    const g = newGame({ commanderName: 'Test', seed: 74 })
    g.skills.fighter = 13 // near-certain hits
    const enc = testEncounter('alien', { hull: 1, maxHull: 1, pilot: 0, weaponPower: 0 })
    const repBefore = g.record.reputation
    const rng = new Rng(5)
    let guard = 0
    while (enc.status === 'ongoing' && guard++ < 100) resolveRound(g, enc, 'attack', rng)
    expect(enc.status).toBe('oppDestroyed')
    expect(g.record.reputation).toBeGreaterThan(repBefore)
  })

  it('a fleet advances ship-by-ship and drops loot on each kill', () => {
    const g = newGame({ commanderName: 'Test', seed: 80 })
    g.skills.fighter = 13 // near-certain hits
    g.ship.hull = 500 // survive comfortably
    const reserve = testEncounter('pirate', {
      hull: 1,
      maxHull: 1,
      weaponPower: 0,
      pilot: 0
    }).opponent
    const enc = testEncounter('pirate', {
      hull: 1,
      maxHull: 1,
      weaponPower: 0,
      pilot: 0,
      cargo: { ...emptyCargo(), water: 2 }
    })
    enc.reserves = [reserve]
    enc.fleetSize = 2

    const rng = new Rng(9)
    let guard = 0
    while (enc.defeated < 1 && guard++ < 100) resolveRound(g, enc, 'attack', rng)
    // First ship down: the reserve steps up and the fight continues.
    expect(enc.defeated).toBe(1)
    expect(enc.status).toBe('ongoing')
    expect(g.ship.cargo.water).toBe(2) // loot from the first wreck

    guard = 0
    while (enc.status === 'ongoing' && guard++ < 100) resolveRound(g, enc, 'attack', rng)
    expect(enc.status).toBe('oppDestroyed')
    expect(enc.defeated).toBe(2)
  })

  it('a fatal blow with an escape pod flags survival, not permanent death', () => {
    const g = newGame({ commanderName: 'Test', seed: 77 })
    g.ship.hull = 5
    g.ship.escapePod = true
    g.skills.pilot = 0 // makes the enemy hit reliably
    // An unkillable, hard-hitting opponent guarantees the player goes down.
    const enc = testEncounter('pirate', {
      hull: 99999,
      maxHull: 99999,
      weaponPower: 9999,
      fighter: 12,
      pilot: 5
    })
    const rng = new Rng(3)
    let guard = 0
    while (enc.status === 'ongoing' && guard++ < 200) resolveRound(g, enc, 'attack', rng)
    expect(enc.status).toBe('playerDestroyed')
    expect(g.ship.hull).toBeLessThanOrEqual(0)
    // The engine keeps the pod flag set; the store reads it to grant survival.
    expect(g.ship.escapePod).toBe(true)
    expect(enc.messages.some((m) => m.key === 'encounter.escapePod')).toBe(true)
  })
})

describe('trader trading', () => {
  it('buys goods from a met trader: credits down, cargo up, stock down', () => {
    const g = newGame({ commanderName: 'Test', seed: 61 })
    g.credits = 10000
    const enc = testEncounter('trader', { cargo: { ...emptyCargo(), water: 5 } })
    enc.trade = { sells: { water: { price: 20, qty: 5 } }, buys: {} }
    const res = tradeBuy(g, enc, 'water', 3)
    expect(res.ok).toBe(true)
    expect(g.credits).toBe(10000 - 60)
    expect(g.ship.cargo.water).toBe(3)
    expect(enc.trade.sells.water?.qty).toBe(2)
  })

  it('sells goods to a met trader: credits up, cargo down', () => {
    const g = newGame({ commanderName: 'Test', seed: 62 })
    g.ship.cargo.furs = 4
    const before = g.credits
    const enc = testEncounter('trader')
    enc.trade = { sells: {}, buys: { furs: 200 } }
    const res = tradeSell(g, enc, 'furs', 2)
    expect(res.ok).toBe(true)
    expect(g.ship.cargo.furs).toBe(2)
    expect(g.credits).toBe(before + 400)
  })

  it('refuses to trade a good the trader is not dealing in', () => {
    const g = newGame({ commanderName: 'Test', seed: 63 })
    const enc = testEncounter('trader')
    enc.trade = { sells: {}, buys: {} }
    expect(tradeBuy(g, enc, 'water', 1).ok).toBe(false)
    expect(tradeSell(g, enc, 'water', 1).ok).toBe(false)
  })
})

describe('quest generation', () => {
  it('offers the full range of quest types over many rolls', () => {
    const g = newGame({ commanderName: 'Test', seed: 999 })
    g.ship.type = 'bumblebee' // spare quarters so passenger quests can appear
    const seen = new Set<string>()
    for (let i = 0; i < 800; i++) {
      g.quests = []
      const q = generateQuestOffer(g, new Rng((i * 2654435761 + 1) >>> 0))
      if (q) {
        expect(q.targetSystem).toBeGreaterThanOrEqual(0)
        expect(q.reward).toBeGreaterThan(0)
        seen.add(q.type)
      }
    }
    for (const type of ['delivery', 'smuggle', 'passenger', 'bounty', 'fetch']) {
      expect(seen).toContain(type)
    }
  })
})

describe('travel and warp', () => {
  /** Nearest other system to the current one (always exists in a full galaxy). */
  const nearestTo = (g: ReturnType<typeof newGame>, fromId: number): number =>
    g.systems
      .filter((s) => s.id !== fromId)
      .reduce((a, b) =>
        systemDistance(g.systems[fromId], b) < systemDistance(g.systems[fromId], a) ? b : a
      ).id

  it('warp to a reachable system advances the day and consumes fuel', () => {
    const g = newGame({ commanderName: 'Test', seed: 11 })
    const target = nearestTo(g, g.currentSystem)
    g.ship.fuel = 999 // ample range to reach the nearest neighbour
    const fuelBefore = g.ship.fuel
    const dayBefore = g.day
    const res = warp(g, target)
    expect(res.ok).toBe(true)
    expect(g.day).toBe(dayBefore + 1)
    expect(g.ship.fuel).toBeLessThan(fuelBefore)
    expect(g.currentSystem).toBe(target)
  })

  it('auto-refuel tops the tank back up on arrival when enabled', () => {
    const g = newGame({ commanderName: 'Test', seed: 12 })
    g.autoRefuel = true
    g.credits = 100000
    // Find a system pair within tank range and start the jump from there.
    const cap = maxFuel(g.ship)
    let fromId = -1
    let toId = -1
    for (const a of g.systems) {
      const near = g.systems.find((b) => b.id !== a.id && systemDistance(a, b) <= cap)
      if (near) {
        fromId = a.id
        toId = near.id
        break
      }
    }
    expect(fromId).toBeGreaterThanOrEqual(0)
    g.currentSystem = fromId
    g.ship.fuel = cap
    const res = warp(g, toId)
    expect(res.ok).toBe(true)
    // The jump burned fuel, but auto-refuel refilled the tank on arrival.
    expect(g.ship.fuel).toBe(maxFuel(g.ship))
  })
})
