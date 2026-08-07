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
  MAX_HULL_UPGRADES,
  advanceDay,
  weaponPower,
  deliverableUnits,
  dumpGood,
  noteLocalSourcing,
  marketBuyPrice,
  atCapital,
  hasShipyard,
  currentStation,
  currentMineSite,
  systemBodies,
  maxHullUpgradesHere,
  repairPricePerUnit,
  weaponsForSale,
  shieldsForSale,
  shipsForSale,
  buyShield,
  buyGadget,
  buyShip,
  getLoan,
  refuel,
  totalCargoBays,
  EXPLORER_RANGE_BONUS,
  INDUSTRIAL_MINING_YIELD
} from './game'
import {
  warp,
  encounterRolls,
  enterUnstableWormhole,
  blackHoleChance,
  blackHoleEscapeChance,
  blackHoleEvent,
  BLACK_HOLE_CHANCE_MAX
} from './warp'
import { travelToBody, bodyTravelProblem } from './system'
import { generateNews, systemNews, NEWS_MIN, NEWS_MAX } from './news'
import { t } from '../../i18n/index'
import { WEAPONS, SHIELDS, WEAPON_IDS, SHIELD_IDS, EXTRA_CARGO_BAYS, EXTRA_CARGO_BAYS_ADVANCED } from '../data/equipment'
import { STATION_KINDS } from './types'
import {
  resolveRound,
  tradeBuy,
  tradeSell,
  tractorChance,
  fleeChance,
  spawnPirates,
  pirateCargoChance,
  pirateCargoValue,
  rollEncounter,
  setTarget,
  playerHitChance,
  opponentHitChance,
  isPeacefulTrader,
  POINT_BLANK_RANGE,
  MAX_ENGAGEMENT_RANGE,
  RANGE_MANOEUVRE_STEP
} from './combat'
import type { Encounter, EncounterKind, Opponent } from './combat'
import {
  applyKarma,
  fineToClear,
  hunterChance,
  notoriety,
  payFine,
  sentenceDays,
  serveSentence,
  standing,
  wantedByBank,
  wantedByLaw,
  BANK_BOUNTY_DEBT,
  PIRACY_KARMA,
  WANTED_THRESHOLD,
  QUEST_KARMA
} from './reputation'
import {
  generateGalaxy,
  ensureBodies,
  SYSTEM_COUNT,
  MAX_SYSTEM_BODIES,
  WORMHOLE_PAIRS,
  UNSTABLE_WORMHOLES
} from './galaxy'
import { standardPrice, refreshMarket } from './market'
import { TRADE_GOODS, GOOD_IDS } from '../data/goods'
import { SHIP_TYPES, SHIP_TYPE_IDS } from '../data/ships'
import { MERCENARIES, MERCENARY_IDS } from '../data/mercenaries'
import { systemDistance } from './travel'
import { mineOnce } from './mining'
import {
  acceptQuest,
  canTurnIn,
  turnInQuest,
  completeBounty,
  generateQuestOffer,
  generateQuestBoard,
  acceptBoardQuest,
  abandonQuest,
  buyQuestSupplies,
  questSupplyMissing,
  questSupply,
  questSupplyUnitPrice,
  questDemand,
  activeQuests,
  boardQuestProblem,
  isContractEmbargoed
} from './quests'
import { runEscort, escortLegs, ESCORT_KILL_BONUS } from './escort'
import { escortShipProblem, canEscort, buyRobot, freeQuarters } from './game'
import {
  assignRoles,
  berthsUsed,
  battleStations,
  crewCount,
  crewLoad,
  crewRepairPerDay,
  crewShortfall,
  generateCrewRoster,
  minCrew,
  roleRisk,
  robotsPowered,
  rollCrewIncident,
  shipRobots
} from './crew'
import { CREW_ROLES, PROFESSIONS } from './types'
import { Rng } from './rng'
import type { Quest, GoodId, TechLevel } from './types'

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
    // Point blank unless a test says otherwise, so range never quietly moves
    // the hit chances a test is asserting on.
    distance: POINT_BLANK_RANGE,
    ...opp
  }
  return {
    kind,
    opponent,
    reserves: [],
    fleetSize: 1,
    defeated: 0,
    downed: [],
    status: 'ongoing',
    actionsLeft: 1,
    actionsPerRound: 1,
    round: 0,
    seed: 1,
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

  it('produces the expected number of systems, whatever the seed', () => {
    // The galaxy packs systems by rejection sampling against a minimum spacing,
    // so a denser one has to be checked over a spread of seeds, not just one:
    // a short attempt budget shows up as the odd galaxy quietly coming up short.
    for (let seed = 1; seed <= 25; seed++) {
      expect(generateGalaxy(seed).length).toBe(SYSTEM_COUNT)
    }
    expect(generateGalaxy(999).length).toBe(SYSTEM_COUNT)
  })

  it('gives every system its own name', () => {
    const names = generateGalaxy(2024).map((s) => s.nameId)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('new game', () => {
  it('starts solo in a Flea with 1000 credits on day 1', () => {
    const g = newGame({ commanderName: 'Test', seed: 42 })
    // The Flea is the only hull one person may legally fly.
    expect(g.ship.type).toBe('flea')
    expect(SHIP_TYPES.flea.minCrew).toBe(1)
    expect(g.ship.crew).toEqual([])
    expect(g.credits).toBe(1000)
    expect(g.day).toBe(1)
    expect(g.systems.length).toBe(SYSTEM_COUNT)
    expect(g.systems[g.currentSystem].visited).toBe(true)
  })

  it('every hull but the Flea needs a crew of at least two', () => {
    for (const id of SHIP_TYPE_IDS) {
      const type = SHIP_TYPES[id]
      if (id === 'flea') continue
      expect(type.minCrew).toBeGreaterThanOrEqual(2)
      // There must be somewhere to put the hands the hull demands.
      expect(type.crewQuarters).toBeGreaterThanOrEqual(type.minCrew)
    }
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
    g.ship.type = 'bumblebee' // a thirstier hull, so the multiplier is visible
    g.systems[g.currentSystem].economyType = 'refinery'
    const cheap = fuelPricePerParsec(g)
    g.systems[g.currentSystem].economyType = 'resort'
    const dear = fuelPricePerParsec(g)
    expect(dear).toBeGreaterThan(cheap)
  })
})

describe('exotic special-resource goods', () => {
  it('are cheap at their source resource and not buyable elsewhere', () => {
    const g = newGame({ commanderName: 'Test', seed: 90 })
    const gems = TRADE_GOODS.gems
    const source = { ...g.systems[0], specialResource: 'mineralRich' as const, techLevel: 3 as const }
    const plain = { ...g.systems[0], specialResource: 'none' as const, techLevel: 2 as const }
    expect(standardPrice(gems, source)).toBeGreaterThan(0)
    expect(standardPrice(gems, plain)).toBe(0)
  })

  it('can be bought at their source and sold at a wanting planet', () => {
    const g = newGame({ commanderName: 'Test', seed: 89 })
    const rng = new Rng(2)
    g.credits = 100000
    // Current planet is a gem source — buy gems here.
    const here = g.systems[g.currentSystem]
    here.specialResource = 'mineralRich'
    refreshMarket(here, rng)
    expect(buyGood(g, 'gems', 3).ok).toBe(true)
    const held = g.ship.cargo.gems
    expect(held).toBeGreaterThan(0)

    // Fly to a mineral-poor world that wants gems — sell them there.
    const demand = g.systems.find((s) => s.id !== here.id)!
    demand.specialResource = 'mineralPoor'
    refreshMarket(demand, rng)
    g.currentSystem = demand.id
    expect(sellGood(g, 'gems', held).ok).toBe(true)
    expect(g.ship.cargo.gems).toBe(0)
  })

  it('sell where wanted (complementary resource) but not at their own source', () => {
    const g = newGame({ commanderName: 'Test', seed: 91 })
    const rng = new Rng(1)

    // Complementary planet (mineral-poor wants gems): sellable, not buyable.
    const demand = structuredClone(g.systems[0])
    demand.specialResource = 'mineralPoor'
    demand.techLevel = 3
    refreshMarket(demand, rng)
    expect(demand.sellPrice.gems).toBeGreaterThan(0)
    expect(demand.buyPrice.gems).toBe(0)

    // Source planet: buyable, but no demand to sell back into.
    const source = structuredClone(g.systems[0])
    source.specialResource = 'mineralRich'
    source.techLevel = 3
    refreshMarket(source, rng)
    expect(source.buyPrice.gems).toBeGreaterThan(0)
    expect(source.sellPrice.gems).toBe(0)

    // A plain low-tech planet without the resource: no gem trade at all.
    const plain = structuredClone(g.systems[0])
    plain.specialResource = 'none'
    plain.techLevel = 2
    refreshMarket(plain, rng)
    expect(plain.buyPrice.gems).toBe(0)
    expect(plain.sellPrice.gems).toBe(0)
  })
})

describe('crew / mercenaries', () => {
  it('hiring a mercenary raises effective skills and daily wages', () => {
    const g = newGame({ commanderName: 'Test', seed: 21 })
    g.skills = { pilot: 5, fighter: 5, trader: 5, engineer: 5, electrician: 5 }
    g.ship.type = 'bumblebee' // has spare crew quarters
    g.systems[g.currentSystem].mercenaryIds = ['nox'] // fighter 10
    const hired = hireMercenary(g, 'nox')
    expect(hired.ok).toBe(true)
    expect(g.ship.crew).toContain('nox')
    // With two hands aboard, Nox takes the guns and the commander the helm.
    expect(effectiveSkills(g).fighter).toBe(10)
    expect(crewWages(g)).toBeGreaterThan(0)

    const fired = fireMercenary(g, 'nox')
    expect(fired.ok).toBe(true)
    expect(g.ship.crew).not.toContain('nox')
    expect(crewWages(g)).toBe(0)
  })

  it('cannot hire without free quarters (the Flea has none)', () => {
    const g = newGame({ commanderName: 'Test', seed: 22 })
    g.systems[g.currentSystem].mercenaryIds = ['pax']
    // The Flea has a single berth — the commander's own.
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

  it('cargo-backed board quests always pay more than the goods cost', () => {
    const g = newGame({ commanderName: 'Test', seed: 84 })
    g.ship.type = 'centipede' // roomy hold so bulk contracts are valid
    let checked = 0
    for (let i = 0; i < 200; i++) {
      const board = generateQuestBoard(g, new Rng((i * 2654435761 + 5) >>> 0))
      for (const q of board) {
        const need = questSupply(q)
        if (!need) continue
        const cost = need.amount * questSupplyUnitPrice(g, need.good)
        expect(q.reward).toBeGreaterThan(cost)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(0)
  })

  it('cannot accept a board quest when already at the active-quest cap', () => {
    const g = newGame({ commanderName: 'Test', seed: 85 })
    const board = generateQuestBoard(g, new Rng(1))
    g.systems[g.currentSystem].questBoard = board
    for (let i = 0; i < 5; i++) {
      g.quests.push({
        id: `dummy${i}`,
        type: 'bounty',
        giverSystem: g.currentSystem,
        targetSystem: g.systems[1].id,
        reward: 1000,
        status: 'active',
        bountyName: 'X'
      })
    }
    expect(acceptBoardQuest(g, board[0].id).ok).toBe(false)
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

  it('an active quest can be abandoned and leaves the journal', () => {
    const g = newGame({ commanderName: 'Test', seed: 49 })
    const quest: Quest = {
      id: 'test-abandon',
      type: 'delivery',
      giverSystem: g.currentSystem,
      targetSystem: g.systems[1].id,
      reward: 1000,
      status: 'offered'
    }
    acceptQuest(g, quest)
    expect(g.quests.some((q) => q.id === 'test-abandon')).toBe(true)

    const res = abandonQuest(g, 'test-abandon')
    expect(res.ok).toBe(true)
    expect(g.quests.some((q) => q.id === 'test-abandon')).toBe(false)
    // Abandoning twice (or a non-active quest) fails.
    expect(abandonQuest(g, 'test-abandon').ok).toBe(false)
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
      // Every hull can mount at least one weapon, shield and gadget.
      expect(s.weaponSlots).toBeGreaterThanOrEqual(1)
      expect(s.shieldSlots).toBeGreaterThanOrEqual(1)
      expect(s.gadgetSlots).toBeGreaterThanOrEqual(1)
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
  it('standing down to a bounty hunter means prison, not a ransom', () => {
    const g = newGame({ commanderName: 'Test', seed: 72 })
    g.credits = 10000
    g.record.policeRecord = -4 // notoriety 4
    g.ship.cargo.narcotics = 3
    const dayBefore = g.day
    const enc = testEncounter('bountyHunter')
    resolveRound(g, enc, 'surrender', new Rng(1))

    expect(enc.status).toBe('playerArrested')
    // Sentence: 5 base + 2 per notoriety point; fine 1000 + 500 per point.
    expect(g.day).toBe(dayBefore + 13)
    expect(g.credits).toBe(10000 - 3000)
    expect(g.ship.cargo.narcotics).toBe(0) // contraband seized on booking
    expect(g.record.policeRecord).toBe(0) // time served wipes the record
  })

  it('surrendering to pirates costs the cargo but leaves the ship flying', () => {
    const g = newGame({ commanderName: 'Test', seed: 78 })
    g.ship.cargo.furs = 4
    const enc = testEncounter('pirate')
    resolveRound(g, enc, 'surrender', new Rng(1))
    expect(enc.status).toBe('playerSurrendered')
    expect(g.ship.cargo.furs).toBe(0)
    expect(enc.messages.some((m) => m.key === 'encounter.pirate.released')).toBe(true)
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

describe('crew stations and manning', () => {
  it('a solo Flea pilot is not penalised — the hull is built for one', () => {
    const g = newGame({ commanderName: 'Test', seed: 400 })
    expect(crewCount(g)).toBe(1)
    expect(crewShortfall(g)).toBe(0)
    expect(crewLoad(g)).toBe(1)
    // All five commander skills still come through at full value.
    const eff = effectiveSkills(g)
    expect(eff.pilot).toBe(5)
    expect(eff.fighter).toBe(5)
    expect(eff.engineer).toBe(5)
    expect(eff.electrician).toBe(5)
  })

  it('one hand in a capital hull is stretched thin', () => {
    const g = newGame({ commanderName: 'Test', seed: 401 })
    g.ship.type = 'atlas'
    expect(minCrew(g)).toBe(7)
    expect(crewShortfall(g)).toBe(6)
    expect(crewLoad(g)).toBeCloseTo(7, 5)
    // Stations nobody can reach are worked at a heavy penalty.
    const posts = assignRoles(g)
    const covered = CREW_ROLES.filter((r) => posts[r].covered)
    expect(covered.length).toBe(3) // one hand can properly stand one watch
    expect(effectiveSkills(g).fighter).toBeLessThan(5)
  })

  it('specialists take the stations they are best at', () => {
    const g = newGame({ commanderName: 'Test', seed: 402 })
    g.ship.type = 'grasshopper' // large: four berths
    g.ship.crew = ['nox', 'wren', 'dex'] // gunner, electrician, mechanic
    const posts = assignRoles(g)
    expect(posts.gunner.hand?.id).toBe('nox')
    expect(posts.electrician.hand?.id).toBe('wren')
    expect(posts.mechanic.hand?.id).toBe('dex')
    expect(posts.pilot.hand?.kind).toBe('commander')
    for (const role of CREW_ROLES) expect(posts[role].covered).toBe(false)
  })

  it('an electrician with no mechanic aboard works both posts', () => {
    const g = newGame({ commanderName: 'Test', seed: 403 })
    g.ship.type = 'gnat' // small: two berths, minimum crew of two
    g.ship.crew = ['wren'] // electrician 9, engineer 7
    const posts = assignRoles(g)
    expect(posts.electrician.hand?.id).toBe('wren')
    // Two hands, four posts: the other two are covered by double duty.
    const covered = CREW_ROLES.filter((r) => posts[r].covered)
    expect(covered.length).toBe(2)
    expect(posts[covered[0]].hand).not.toBeNull()
  })

  it('leaving a station unmanned drives its incident risk up', () => {
    const solo = newGame({ commanderName: 'Test', seed: 404 })
    solo.ship.type = 'atlas'
    const crewed = newGame({ commanderName: 'Test', seed: 404 })
    crewed.ship.type = 'atlas'
    crewed.ship.crew = ['orin', 'nox', 'sol', 'wren', 'juno', 'pax']
    expect(roleRisk(solo, 'electrician')).toBeGreaterThan(roleRisk(crewed, 'electrician'))
    expect(roleRisk(crewed, 'electrician')).toBeLessThan(0.01)
  })

  it('a neglected ship eventually has an accident, and it costs something', () => {
    const g = newGame({ commanderName: 'Test', seed: 405 })
    g.ship.type = 'atlas' // seven hands needed, flying with one
    g.skills = { pilot: 1, fighter: 1, trader: 1, engineer: 1, electrician: 1 }
    g.ship.hull = 400
    g.ship.cargo.water = 20
    g.ship.fuel = 12

    const rng = new Rng(5)
    let incident = null
    for (let i = 0; i < 200 && !incident; i++) incident = rollCrewIncident(g, rng)
    expect(incident).not.toBeNull()
    expect(CREW_ROLES).toContain(incident!.role)
    // Whatever happened, it cost hull, cargo or fuel.
    const lost = g.ship.hull < 400 || g.ship.cargo.water < 20 || g.ship.fuel < 12
    expect(lost).toBe(true)
  })

  it('the engineering watch patches hull every day underway', () => {
    const g = newGame({ commanderName: 'Test', seed: 406 })
    g.ship.type = 'grasshopper'
    g.ship.crew = ['sol'] // engineer 9
    g.ship.hull = 10
    expect(crewRepairPerDay(g)).toBeGreaterThan(0)
    advanceDay(g)
    expect(g.ship.hull).toBeGreaterThan(10)
  })

  it('running repairs never overshoot the hull maximum', () => {
    const g = newGame({ commanderName: 'Test', seed: 407 })
    g.ship.type = 'grasshopper'
    g.ship.crew = ['sol']
    g.ship.hull = maxHull(g.ship)
    advanceDay(g)
    expect(g.ship.hull).toBe(maxHull(g.ship))
  })
})

describe('robot crew', () => {
  it('costs like a ship, draws no wage, and stands a watch', () => {
    const g = newGame({ commanderName: 'Test', seed: 410 })
    g.ship.type = 'grasshopper'
    g.credits = 200000
    g.systems[g.currentSystem].techLevel = 7
    const before = g.credits

    expect(buyRobot(g, 'spark').ok).toBe(true)
    expect(shipRobots(g)).toEqual(['spark'])
    expect(g.credits).toBeLessThan(before)
    expect(crewWages(g)).toBe(0) // androids are never paid
    // The power-systems unit takes the post it was built for.
    expect(assignRoles(g).electrician.hand?.id).toBe('spark')
  })

  it('burns fuel every day instead of wages', () => {
    const g = newGame({ commanderName: 'Test', seed: 411 })
    g.ship.type = 'grasshopper'
    g.ship.robots = ['wrench']
    g.ship.fuel = 10
    for (let i = 0; i < 3; i++) advanceDay(g)
    expect(g.ship.fuel).toBeLessThan(10)
  })

  it('goes dormant on a dry tank and stops standing its watch', () => {
    const g = newGame({ commanderName: 'Test', seed: 412 })
    g.ship.type = 'grasshopper'
    g.ship.robots = ['helm'] // pilot 10
    g.ship.fuel = 5
    expect(robotsPowered(g)).toBe(true)
    expect(effectiveSkills(g).pilot).toBe(10)

    g.ship.fuel = 0
    expect(robotsPowered(g)).toBe(false)
    expect(crewCount(g)).toBe(1) // the commander alone
    expect(effectiveSkills(g).pilot).toBeLessThan(10)
    // The berth stays occupied even while the unit is asleep.
    expect(berthsUsed(g)).toBe(2)
  })

  it('takes a berth like any other hand', () => {
    const g = newGame({ commanderName: 'Test', seed: 413 })
    g.ship.type = 'gnat' // two berths: commander + one
    g.credits = 200000
    g.systems[g.currentSystem].techLevel = 7
    expect(buyRobot(g, 'utility').ok).toBe(true)
    expect(freeQuarters(g.ship)).toBe(0)
    g.systems[g.currentSystem].mercenaryIds = ['pax']
    expect(hireMercenary(g, 'pax').ok).toBe(false) // no room left
  })
})

describe('hiring hall', () => {
  it('offers several hands, each advertising a trade', () => {
    const g = newGame({ commanderName: 'Test', seed: 420 })
    const roster = generateCrewRoster(g, new Rng(2))
    expect(roster.length).toBeGreaterThan(0)
    for (const id of roster) {
      expect(MERCENARIES[id]).toBeDefined()
      expect(PROFESSIONS).toContain(MERCENARIES[id].profession)
    }
    // No duplicates in one hall.
    expect(new Set(roster).size).toBe(roster.length)
  })

  it('never offers someone already in your crew', () => {
    const g = newGame({ commanderName: 'Test', seed: 421 })
    g.ship.crew = ['nox', 'orin']
    for (let seed = 1; seed < 20; seed++) {
      const roster = generateCrewRoster(g, new Rng(seed))
      expect(roster).not.toContain('nox')
      expect(roster).not.toContain('orin')
    }
  })

  it('covers every profession across the roster', () => {
    const seen = new Set(MERCENARY_IDS.map((id) => MERCENARIES[id].profession))
    for (const p of PROFESSIONS) expect(seen).toContain(p)
  })

  it('a dismissed hand goes back into the local hall', () => {
    const g = newGame({ commanderName: 'Test', seed: 422 })
    g.ship.type = 'grasshopper'
    g.systems[g.currentSystem].mercenaryIds = ['pax', 'mira']
    expect(hireMercenary(g, 'pax').ok).toBe(true)
    expect(g.systems[g.currentSystem].mercenaryIds).not.toContain('pax')
    expect(fireMercenary(g, 'pax').ok).toBe(true)
    expect(g.systems[g.currentSystem].mercenaryIds).toContain('pax')
  })
})

describe('convoy escort contracts', () => {
  /** Kit the player out with a hull the convoy will actually sign on. */
  function militaryEscort(g: ReturnType<typeof newGame>): void {
    g.ship.type = 'mosquito' // medium military hull
    g.ship.weapons = ['military', 'military']
    g.ship.shields = ['energy']
    g.ship.shieldPoints = [0] // the convoy tender tops these up between legs
    g.ship.hull = 5000 // survive the run comfortably
    g.skills.fighter = 13
  }

  function escortQuest(g: ReturnType<typeof newGame>): Quest {
    const q: Quest = {
      id: 'esc1',
      type: 'escort',
      giverSystem: g.currentSystem,
      targetSystem: (g.currentSystem + 1) % g.systems.length,
      reward: 3000,
      status: 'offered'
    }
    acceptQuest(g, q)
    return q
  }

  it('turns away a hull that is not a gunship', () => {
    const g = newGame({ commanderName: 'Test', seed: 300 })
    const q = escortQuest(g)
    // A Gnat is civilian with a single pulse laser.
    expect(escortShipProblem(g)).toBe('error.escortNeedsMilitary')
    expect(runEscort(g, q.id, new Rng(1)).ok).toBe(false)

    g.ship.type = 'mosquito'
    expect(escortShipProblem(g)).toBe('error.escortNeedsWeapons')

    g.ship.weapons = ['pulse', 'pulse']
    expect(escortShipProblem(g)).toBe('error.escortNeedsShield')

    g.ship.shields = ['energy']
    g.ship.shieldPoints = [0]
    expect(escortShipProblem(g)).toBeNull()
    expect(canEscort(g)).toBe(true)
  })

  it('forms up only at the system that posted the contract', () => {
    const g = newGame({ commanderName: 'Test', seed: 301 })
    militaryEscort(g)
    const q = escortQuest(g)
    g.currentSystem = q.targetSystem
    const res = runEscort(g, q.id, new Rng(1))
    expect(res.ok).toBe(false)
    expect(res.error).toBe('error.escortNotHere')
  })

  it('runs the convoy through, docks it and pays out', () => {
    const g = newGame({ commanderName: 'Test', seed: 302 })
    militaryEscort(g)
    const q = escortQuest(g)
    const creditsBefore = g.credits
    const dayBefore = g.day

    const res = runEscort(g, q.id, new Rng(7))
    expect(res.ok).toBe(true)
    const run = res.run!
    expect(run.destroyed).toBe(false)
    expect(run.legs.length).toBe(escortLegs(g, q))
    // One day per leg, and the convoy ends up at its destination.
    expect(g.day).toBe(dayBefore + run.legs.length)
    expect(g.currentSystem).toBe(q.targetSystem)
    expect(g.systems[q.targetSystem].visited).toBe(true)
    // Contract fee plus danger pay for anything shot down on the way.
    expect(run.dangerPay).toBe(run.kills * ESCORT_KILL_BONUS)
    expect(g.credits).toBe(creditsBefore + q.reward + run.dangerPay)
    expect(g.quests.find((x) => x.id === q.id)?.status).toBe('completed')
  })

  it('logs every leg, and command decides each engagement', () => {
    const g = newGame({ commanderName: 'Test', seed: 303 })
    militaryEscort(g)
    const q = escortQuest(g)
    const run = runEscort(g, q.id, new Rng(11)).run!

    for (const leg of run.legs) expect(leg.messages.length).toBeGreaterThan(0)
    // Every contact carries an order; the player is never asked to choose.
    for (const leg of run.legs.filter((l) => l.kind)) {
      expect(leg.order).toBeDefined()
      expect(leg.messages.some((m) => m.key.startsWith('escort.order.'))).toBe(true)
    }
    // Traders and patrols are waved past rather than shot at.
    for (const leg of run.legs.filter((l) => l.kind === 'trader')) {
      expect(leg.order).toBe('holdFire')
      expect(leg.kills).toBe(0)
    }
    for (const leg of run.legs.filter((l) => l.kind === 'police')) {
      expect(leg.order).toBe('standDown')
    }
  })

  it('escort contracts are never handed in over the counter', () => {
    const g = newGame({ commanderName: 'Test', seed: 304 })
    militaryEscort(g)
    const q = escortQuest(g)
    g.currentSystem = q.targetSystem
    expect(canTurnIn(g, q)).toBe(false)
    expect(turnInQuest(g, q.id)).toBeNull()
  })

  it('a run ends the moment the escort is destroyed, unpaid', () => {
    // Search seeds for a run where the (paper-thin) escort actually dies.
    for (let seed = 1; seed < 60; seed++) {
      const g = newGame({ commanderName: 'Test', seed: 305 })
      militaryEscort(g)
      g.ship.hull = 1 // a single hit finishes the ship
      g.skills.pilot = 0
      const q = escortQuest(g)
      const creditsBefore = g.credits

      const run = runEscort(g, q.id, new Rng(seed)).run!
      if (!run.destroyed) continue

      expect(g.currentSystem).toBe(q.giverSystem) // never made port
      expect(g.credits).toBe(creditsBefore) // and never got paid
      expect(g.quests.find((x) => x.id === q.id)?.status).toBe('active')
      expect(run.dangerPay).toBe(0)
      expect(run.legs[run.legs.length - 1].messages.some((m) => m.key === 'escort.lost')).toBe(true)
      return
    }
    throw new Error('no seed produced a destroyed escort run')
  })
})

describe('market contract hints', () => {
  it('adds up what active contracts want and what is already aboard', () => {
    const g = newGame({ commanderName: 'Test', seed: 310 })
    const other = (g.currentSystem + 1) % g.systems.length
    acceptQuest(g, {
      id: 'r1',
      type: 'relief',
      giverSystem: g.currentSystem,
      targetSystem: other,
      reward: 500,
      status: 'offered',
      good: 'water',
      amount: 5
    })
    acceptQuest(g, {
      id: 'r2',
      type: 'relief',
      giverSystem: g.currentSystem,
      targetSystem: other,
      reward: 500,
      status: 'offered',
      good: 'water',
      amount: 3
    })
    g.ship.cargo.water = 2

    const demand = questDemand(g)
    expect(demand.water).toEqual({ required: 8, have: 2, missing: 6, targets: [other] })
    // Goods no contract asks for are absent entirely.
    expect(demand.robots).toBeUndefined()
  })

  it('never counts more cargo than the contracts call for', () => {
    const g = newGame({ commanderName: 'Test', seed: 311 })
    acceptQuest(g, {
      id: 'f1',
      type: 'fetch',
      giverSystem: g.currentSystem,
      targetSystem: g.currentSystem,
      reward: 500,
      status: 'offered',
      good: 'ore',
      amount: 4
    })
    g.ship.cargo.ore = 10
    const demand = questDemand(g)
    expect(demand.ore?.have).toBe(4)
    expect(demand.ore?.missing).toBe(0)
  })
})

describe('contract cargo must be hauled in', () => {
  /** A relief contract for `amount` water, already accepted and due here. */
  function reliefQuest(g: ReturnType<typeof newGame>, amount: number): Quest {
    const q: Quest = {
      id: `relief${amount}${g.quests.length}`,
      type: 'relief',
      giverSystem: (g.currentSystem + 1) % g.systems.length,
      targetSystem: g.currentSystem,
      reward: 1000,
      status: 'offered',
      good: 'water',
      amount
    }
    acceptQuest(g, q)
    return q
  }

  it('goods bought at the delivery point do not settle the contract', () => {
    const g = newGame({ commanderName: 'Test', seed: 200 })
    const sys = g.systems[g.currentSystem]
    sys.buyPrice.water = 10
    sys.qty.water = 50
    g.credits = 10000

    // Bought here *before* signing anything, so the delivery embargo does not
    // apply yet — but the units are still local and cannot settle a job due here.
    buyGood(g, 'water', 5)
    const q = reliefQuest(g, 5)

    expect(g.ship.cargo.water).toBe(5) // the hold is full enough…
    expect(deliverableUnits(g, 'water')).toBe(0) // …but none of it was hauled in
    expect(canTurnIn(g, q)).toBe(false)
    expect(turnInQuest(g, q.id)).toBeNull()
  })

  it('goods hauled in from elsewhere settle it', () => {
    const g = newGame({ commanderName: 'Test', seed: 201 })
    const q = reliefQuest(g, 5)
    g.ship.cargo.water = 5 // arrived carrying it
    expect(deliverableUnits(g, 'water')).toBe(5)
    expect(canTurnIn(g, q)).toBe(true)
    expect(turnInQuest(g, q.id)).not.toBeNull()
  })

  it('handing in one run does not free locally bought goods for the next', () => {
    const g = newGame({ commanderName: 'Test', seed: 202 })
    const sys = g.systems[g.currentSystem]
    sys.buyPrice.water = 10
    sys.qty.water = 50
    g.credits = 10000

    // Five topped up here before signing, then two contracts taken on.
    buyGood(g, 'water', 5)
    const first = reliefQuest(g, 5)
    const second = reliefQuest(g, 5)
    // Plus five that were actually hauled in — enough for one of the two.
    g.ship.cargo.water += 5
    expect(deliverableUnits(g, 'water')).toBe(5)

    expect(turnInQuest(g, first.id)).not.toBeNull()

    // The five bought here are still aboard, and still cannot settle anything.
    expect(g.ship.cargo.water).toBe(5)
    expect(deliverableUnits(g, 'water')).toBe(0)
    expect(canTurnIn(g, second)).toBe(false)
    expect(turnInQuest(g, second.id)).toBeNull()
  })

  it('a supply contract cannot be filled from the giver\'s own market', () => {
    const g = newGame({ commanderName: 'Test', seed: 203 })
    const sys = g.systems[g.currentSystem]
    sys.buyPrice.ore = 20
    sys.qty.ore = 50
    g.credits = 10000
    const q: Quest = {
      id: 'fetch1',
      type: 'fetch',
      giverSystem: g.currentSystem,
      targetSystem: g.currentSystem, // fetch quests are handed back to the giver
      reward: 5000,
      status: 'offered',
      good: 'ore',
      amount: 4
    }
    acceptQuest(g, q)

    // Buying the goods on the spot — via the market or the supply shortcut —
    // must not turn the contract into free money.
    expect(buyQuestSupplies(g, q).ok).toBe(true)
    expect(g.ship.cargo.ore).toBe(4)
    expect(canTurnIn(g, q)).toBe(false)
  })

  it('arriving somewhere clears local sourcing', () => {
    const g = newGame({ commanderName: 'Test', seed: 204 })
    const sys = g.systems[g.currentSystem]
    sys.buyPrice.water = 5
    sys.qty.water = 50
    g.credits = 10000
    buyGood(g, 'water', 4)
    expect(deliverableUnits(g, 'water')).toBe(0)

    // Fly anywhere in range: the cargo has now been hauled.
    const from = g.systems[g.currentSystem]
    const target = g.systems.find((s) => s.id !== from.id && systemDistance(from, s) <= g.ship.fuel)
    expect(target).toBeDefined()
    if (!target) return
    expect(warp(g, target.id).ok).toBe(true)
    expect(deliverableUnits(g, 'water')).toBe(4)
  })

  it('cargo taken in space counts, cargo mined at this planet does not', () => {
    const g = newGame({ commanderName: 'Test', seed: 205 })
    // Salvage/plunder arrives with the ship and is deliverable.
    g.ship.cargo.ore += 3
    expect(deliverableUnits(g, 'ore')).toBe(3)

    // Mining at the local site is sourcing it here, same as buying it here.
    const sys = g.systems[g.currentSystem]
    sys.mineSite = { kind: 'asteroidField', resource: 'ore', richness: 5 }
    const res = mineOnce(g, new Rng(3))
    expect(res.ok).toBe(true)
    expect(g.ship.cargo.ore).toBeGreaterThan(3)
    expect(deliverableUnits(g, 'ore')).toBe(3)
  })
})

describe('tractor beams and escape', () => {
  it('only heavier hulls can get a lock, and a pack locks on more readily', () => {
    const g = newGame({ commanderName: 'Test', seed: 90 })
    g.ship.type = 'flea' // small hull
    g.skills.pilot = 0 // keep the pilot bonus out of the comparison

    const lone = testEncounter('pirate', { shipType: 'atlas' }) // capital, alone
    const pack = testEncounter('pirate', { shipType: 'atlas' })
    pack.reserves = [testEncounter('pirate', { shipType: 'atlas' }).opponent]
    pack.fleetSize = 2

    expect(tractorChance(g, pack)).toBeGreaterThan(tractorChance(g, lone))

    // Same size or smaller: nothing to tow with.
    const peer = testEncounter('pirate', { shipType: 'flea' })
    peer.reserves = [testEncounter('pirate', { shipType: 'flea' }).opponent]
    expect(tractorChance(g, peer)).toBe(0)

    // A big ship being chased by small ones is never the one getting towed.
    g.ship.type = 'atlas'
    expect(tractorChance(g, pack)).toBe(0)
  })

  it('traders and police never deploy a tractor beam', () => {
    const g = newGame({ commanderName: 'Test', seed: 91 })
    g.ship.type = 'flea'
    for (const kind of ['trader', 'police'] as EncounterKind[]) {
      const enc = testEncounter(kind, { shipType: 'atlas' })
      enc.reserves = [testEncounter(kind, { shipType: 'atlas' }).opponent]
      expect(tractorChance(g, enc)).toBe(0)
    }
  })

  it('a lock must be broken before the player can run', () => {
    const g = newGame({ commanderName: 'Test', seed: 92 })
    g.ship.type = 'flea'
    g.ship.hull = 500 // survive the free shots taken while pinned
    const enc = testEncounter('pirate', { shipType: 'atlas', weaponPower: 0 })
    enc.tractorLocked = true

    const rng = new Rng(11)
    let guard = 0
    while (enc.status === 'ongoing' && guard++ < 300) {
      const lockedBefore = enc.tractorLocked
      resolveRound(g, enc, 'flee', rng)
      // No escape can happen on a round where the beam still had hold.
      if (lockedBefore && enc.tractorLocked) expect(enc.status).toBe('ongoing')
    }
    expect(enc.status).toBe('playerFled')
    expect(enc.messages.some((m) => m.key === 'encounter.tractor.broke')).toBe(true)
  })

  it('small hulls outrun big ones more easily than the other way round', () => {
    const g = newGame({ commanderName: 'Test', seed: 93 })
    const heavy = testEncounter('pirate', { shipType: 'atlas' })
    const light = testEncounter('pirate', { shipType: 'flea' })

    g.ship.type = 'flea'
    const smallFleeingBig = fleeChance(g, heavy, g.skills.pilot)
    g.ship.type = 'atlas'
    const bigFleeingSmall = fleeChance(g, light, g.skills.pilot)

    expect(smallFleeingBig).toBeGreaterThan(bigFleeingSmall)
  })
})

describe('combat log detail', () => {
  it('reports critical hits, shield saves and a crippled hull', () => {
    const g = newGame({ commanderName: 'Test', seed: 94 })
    g.skills.fighter = 13 // near-certain hits, high crit rate
    g.ship.hull = 5000
    // A punchbag with shields deep enough to soak some volleys outright.
    const enc = testEncounter('pirate', {
      hull: 4000,
      maxHull: 4000,
      shieldPoints: 200,
      maxShield: 200,
      weaponPower: 0,
      pilot: 0
    })

    const rng = new Rng(21)
    for (let i = 0; i < 200 && enc.status === 'ongoing'; i++) resolveRound(g, enc, 'attack', rng)

    const keys = enc.messages.map((m) => m.key)
    expect(keys).toContain('encounter.playerCrit')
    expect(keys).toContain('encounter.oppShieldsHeld')
    expect(keys).toContain('encounter.oppShieldDown')
  })

  it('a critical hit lands harder than a normal one', () => {
    const g = newGame({ commanderName: 'Test', seed: 95 })
    g.skills.fighter = 13
    g.ship.hull = 5000
    const enc = testEncounter('pirate', {
      hull: 9000,
      maxHull: 9000,
      weaponPower: 0,
      pilot: 0
    })
    const rng = new Rng(22)
    for (let i = 0; i < 120 && enc.status === 'ongoing'; i++) resolveRound(g, enc, 'attack', rng)

    const dmg = (key: string): number[] =>
      enc.messages.filter((m) => m.key === key).map((m) => Number(m.params?.dmg))
    const crits = dmg('encounter.playerCrit')
    const normals = dmg('encounter.playerHit')
    expect(crits.length).toBeGreaterThan(0)
    expect(Math.min(...crits)).toBeGreaterThan(Math.max(...normals))
  })

  it('pirates open by naming the cargo they came for', () => {
    const g = newGame({ commanderName: 'Test', seed: 96 })
    g.ship.cargo.robots = 5 // by far the most valuable thing aboard
    const enc = spawnPirates(g, new Rng(4))
    expect(enc.demand).toBe('cargo')
    const demand = enc.messages.find((m) => m.key.startsWith('encounter.pirate.demand'))
    expect(demand).toBeDefined()
    expect(demand?.params?.good).toBe('robots')
  })

  it('pirates facing an empty hold threaten the ship instead', () => {
    const g = newGame({ commanderName: 'Test', seed: 97 })
    const enc = spawnPirates(g, new Rng(4))
    expect(enc.messages.some((m) => m.key === 'encounter.pirate.demandEmpty')).toBe(true)
  })

  it('cargo raises pirate interest and valuable cargo raises their threat', () => {
    const poor = newGame({ commanderName: 'Test', seed: 98 })
    const rich = newGame({ commanderName: 'Test', seed: 98 })
    rich.ship.cargo.gems = 20

    expect(pirateCargoValue(rich)).toBeGreaterThan(pirateCargoValue(poor))
    expect(pirateCargoChance(rich)).toBeGreaterThan(pirateCargoChance(poor))

    const weak = spawnPirates(poor, new Rng(17))
    const strong = spawnPirates(rich, new Rng(17))
    expect(strong.opponent.shipType).not.toBe(weak.opponent.shipType)
  })
})

describe('engagement range', () => {
  it('every ship in a group has its own range, nearest one engaged first', () => {
    const g = newGame({ commanderName: 'Test', seed: 610 })
    // Enough rolls to land at least one multi-ship ambush.
    const packs = Array.from({ length: 60 }, (_, i) => spawnPirates(g, new Rng(i + 1))).filter(
      (e) => e.fleetSize > 1
    )
    expect(packs.length).toBeGreaterThan(0)
    for (const enc of packs) {
      const all = [enc.opponent, ...enc.reserves]
      for (const o of all) {
        expect(o.distance).toBeGreaterThanOrEqual(POINT_BLANK_RANGE)
        expect(o.distance).toBeLessThanOrEqual(MAX_ENGAGEMENT_RANGE)
      }
      // The one that got close enough to hail you is the one you are fighting.
      expect(enc.opponent.distance).toBe(Math.min(...all.map((o) => o.distance)))
    }
  })

  it('range costs accuracy, and costs it to both sides alike', () => {
    const g = newGame({ commanderName: 'Test', seed: 611 })
    const near = testEncounter('pirate', { distance: POINT_BLANK_RANGE, weaponPower: 10 })
    const far = testEncounter('pirate', { distance: MAX_ENGAGEMENT_RANGE, weaponPower: 10 })

    expect(playerHitChance(g, far)).toBeLessThan(playerHitChance(g, near))
    expect(opponentHitChance(g, far)).toBeLessThan(opponentHitChance(g, near))
  })

  it('the helm closes and opens the range, and cannot pass either stop', () => {
    const g = newGame({ commanderName: 'Test', seed: 612 })
    const enc = testEncounter('pirate', { distance: 20, weaponPower: 0 })
    const rng = new Rng(7)

    resolveRound(g, enc, 'closeIn', rng)
    expect(enc.opponent.distance).toBe(20 - RANGE_MANOEUVRE_STEP)

    resolveRound(g, enc, 'openRange', rng)
    expect(enc.opponent.distance).toBe(20)

    for (let i = 0; i < 20; i++) resolveRound(g, enc, 'closeIn', rng)
    expect(enc.opponent.distance).toBe(POINT_BLANK_RANGE)
    expect(enc.messages.some((m) => m.key === 'encounter.range.atPointBlank')).toBe(true)

    for (let i = 0; i < 20; i++) resolveRound(g, enc, 'openRange', rng)
    expect(enc.opponent.distance).toBe(MAX_ENGAGEMENT_RANGE)
    expect(enc.messages.some((m) => m.key === 'encounter.range.atMax')).toBe(true)
  })
})

describe('picking a target out of a group', () => {
  it('swaps the chosen ship into the fight and keeps the damage already done', () => {
    const enc = testEncounter('pirate', { shipType: 'gnat', hull: 40, weaponPower: 0 })
    enc.fleetSize = 3
    enc.reserves = [
      { ...enc.opponent, shipType: 'ant', hull: 55, distance: 30 },
      { ...enc.opponent, shipType: 'bumblebee', hull: 70, distance: 12 }
    ]

    expect(setTarget(enc, 1)).toBe(true)
    expect(enc.opponent.shipType).toBe('bumblebee')
    // The one that was engaged goes back to the group, damage and all.
    expect(enc.reserves[1].shipType).toBe('gnat')
    expect(enc.reserves[1].hull).toBe(40)
    expect(enc.messages.some((m) => m.key === 'encounter.targetSwitched')).toBe(true)
  })

  it('refuses an index with no ship at it, and a fight already over', () => {
    const g = newGame({ commanderName: 'Test', seed: 621 })
    const enc = testEncounter('pirate', { weaponPower: 0 })
    expect(setTarget(enc, 0)).toBe(false)

    enc.reserves = [{ ...enc.opponent, shipType: 'ant' }]
    enc.status = 'oppDestroyed'
    expect(setTarget(enc, 0)).toBe(false)
    expect(g.ship.hull).toBeGreaterThan(0)
  })

  it('records what went down, not just how many', () => {
    const g = newGame({ commanderName: 'Test', seed: 622 })
    g.skills.fighter = 13
    const enc = testEncounter('pirate', { shipType: 'gnat', hull: 1, weaponPower: 0, pilot: 0 })
    enc.fleetSize = 2
    enc.reserves = [{ ...enc.opponent, shipType: 'ant', hull: 1 }]

    const rng = new Rng(31)
    for (let i = 0; i < 40 && enc.status === 'ongoing'; i++) resolveRound(g, enc, 'attack', rng)

    expect(enc.downed.length).toBe(enc.defeated)
    expect(enc.downed).toContain('gnat')
  })
})

describe('actions per round come from the crew', () => {
  it('a lone commander gets one action; a second hand buys the helm one', () => {
    const g = newGame({ commanderName: 'Test', seed: 630 })
    expect(crewCount(g)).toBe(1)
    expect(battleStations(g)).toMatchObject({ shots: 1, helm: false, actions: 1 })

    g.ship.type = 'gnat' // two berths
    g.ship.crew = ['nox'] // a gunner
    expect(battleStations(g)).toMatchObject({ shots: 1, helm: true, actions: 2 })
  })

  it('a second gunner only pays off with a second gun to work', () => {
    const g = newGame({ commanderName: 'Test', seed: 631 })
    g.ship.type = 'grasshopper'
    g.ship.crew = ['nox', 'dex'] // pilot at the helm, two hands left over
    g.ship.weapons = ['pulse']
    expect(battleStations(g)).toMatchObject({ shots: 1, actions: 2 })

    g.ship.weapons = ['pulse', 'pulse']
    expect(battleStations(g)).toMatchObject({ shots: 2, helm: true, actions: 3 })
  })

  it('the opponent waits until the whole budget is spent', () => {
    const g = newGame({ commanderName: 'Test', seed: 632 })
    g.ship.type = 'gnat'
    g.ship.crew = ['nox']
    const hullBefore = g.ship.hull
    const enc = testEncounter('pirate', { weaponPower: 40, fighter: 13, pilot: 0, hull: 9000 })
    enc.actionsLeft = 2
    enc.actionsPerRound = 2
    const rng = new Rng(33)

    // First action of the exchange: they have not had their turn yet.
    resolveRound(g, enc, 'closeIn', rng)
    expect(enc.actionsLeft).toBe(1)
    expect(g.ship.hull).toBe(hullBefore)

    // Second spends the budget, so the reply lands and the watch stands to again.
    resolveRound(g, enc, 'attack', rng)
    expect(g.ship.hull).toBeLessThan(hullBefore)
    expect(enc.actionsLeft).toBe(battleStations(g).actions)
  })

  it('ending the turn early hands the round over with actions unspent', () => {
    const g = newGame({ commanderName: 'Test', seed: 633 })
    const hullBefore = g.ship.hull
    const enc = testEncounter('pirate', { weaponPower: 40, fighter: 13, pilot: 0, hull: 9000 })
    enc.actionsLeft = 3
    enc.actionsPerRound = 3

    resolveRound(g, enc, 'endTurn', new Rng(34))
    expect(g.ship.hull).toBeLessThan(hullBefore)
  })
})

describe('standing and hired hunters', () => {
  it('smuggling builds a criminal name; aid and bounties build a defender one', () => {
    expect(QUEST_KARMA.smuggle).toBeLessThan(0)
    expect(QUEST_KARMA.relief).toBeGreaterThan(0)
    expect(QUEST_KARMA.bounty).toBeGreaterThan(0)

    const g = newGame({ commanderName: 'Test', seed: 100 })
    expect(standing(g)).toBe('citizen')
    applyKarma(g, QUEST_KARMA.smuggle * 2)
    expect(notoriety(g)).toBe(6)
    expect(standing(g)).toBe('criminal')
    applyKarma(g, 16)
    expect(notoriety(g)).toBe(0)
    expect(standing(g)).toBe('champion')
  })

  it('logs a line whenever the player crosses into a new standing tier', () => {
    const g = newGame({ commanderName: 'Test', seed: 101 })
    applyKarma(g, -6)
    const entry = g.log.find((l) => l.key === 'log.standingChanged')
    expect(entry?.params?.standing).toBe('standing.criminal')
  })

  it('handing in a smuggling run marks the record', () => {
    const g = newGame({ commanderName: 'Test', seed: 102 })
    const quest: Quest = {
      id: 'smug1',
      type: 'smuggle',
      giverSystem: g.currentSystem,
      targetSystem: (g.currentSystem + 1) % g.systems.length,
      reward: 1000,
      status: 'offered',
      good: 'narcotics',
      amount: 2
    }
    acceptQuest(g, quest)
    g.currentSystem = quest.targetSystem
    g.ship.cargo.narcotics = 2
    expect(turnInQuest(g, quest.id)).not.toBeNull()
    expect(g.record.policeRecord).toBe(QUEST_KARMA.smuggle)
    expect(notoriety(g)).toBeGreaterThan(0)
  })

  it('an unpaid loan puts hunters on a spotless record', () => {
    const g = newGame({ commanderName: 'Test', seed: 103 })
    expect(hunterChance(g)).toBe(0)
    g.debt = BANK_BOUNTY_DEBT
    expect(wantedByBank(g)).toBe(true)
    expect(hunterChance(g)).toBeGreaterThan(0)
  })

  it('a notorious captain draws hunters on the way out', () => {
    const g = newGame({ commanderName: 'Test', seed: 104 })
    g.record.policeRecord = -12
    let hunters = 0
    for (let i = 0; i < 400; i++) {
      if (rollEncounter(g, new Rng(i + 1))?.kind === 'bountyHunter') hunters++
    }
    expect(hunters).toBeGreaterThan(0)
  })

  it('a big fine buys the record clean and calls the law off', () => {
    const g = newGame({ commanderName: 'Test', seed: 105 })
    expect(payFine(g).ok).toBe(false) // nothing to clear yet

    g.record.policeRecord = -6
    const cost = fineToClear(g)
    expect(cost).toBeGreaterThan(0)

    g.credits = cost - 1
    expect(payFine(g).ok).toBe(false) // cannot afford it

    g.credits = cost
    expect(payFine(g).ok).toBe(true)
    expect(g.credits).toBe(0)
    expect(g.record.policeRecord).toBe(0)
    expect(hunterChance(g)).toBe(0)
    expect(g.log.some((entry) => entry.key === 'log.standingChanged')).toBe(true)
  })

  it('a deeper record costs more to clear and more days to serve', () => {
    const light = newGame({ commanderName: 'Test', seed: 106 })
    const heavy = newGame({ commanderName: 'Test', seed: 106 })
    light.record.policeRecord = -3
    heavy.record.policeRecord = -12
    expect(fineToClear(heavy)).toBeGreaterThan(fineToClear(light))
    expect(sentenceDays(heavy)).toBeGreaterThan(sentenceDays(light))
  })

  it('serving a sentence burns days and interest but clears the record', () => {
    const g = newGame({ commanderName: 'Test', seed: 107 })
    g.record.policeRecord = -5
    g.credits = 20000
    g.debt = 1000
    const dayBefore = g.day
    const expectedDays = sentenceDays(g)
    const served = serveSentence(g)

    expect(served.days).toBe(expectedDays)
    expect(g.day).toBe(dayBefore + served.days)
    expect(g.credits).toBeLessThan(20000) // interest was paid behind bars
    expect(g.record.policeRecord).toBe(0)
    expect(g.log.some((entry) => entry.key === 'log.standingChanged')).toBe(true)
  })

  it('a sentence served over a bank debt leaves a defender their name', () => {
    const g = newGame({ commanderName: 'Test', seed: 108 })
    // Hunters chase an unpaid loan whatever the record says, so a decorated
    // captain can end up in a cell without ever breaking a law.
    g.record.policeRecord = 8
    g.debt = BANK_BOUNTY_DEBT
    g.credits = 20000
    expect(standing(g)).toBe('defender')

    const served = serveSentence(g)

    expect(served.days).toBe(sentenceDays(g)) // no notoriety to lengthen it
    expect(g.record.policeRecord).toBe(8)
    expect(standing(g)).toBe('defender')
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

  it('refuses a zero-amount sell with a sell error, not a buy one', () => {
    const g = newGame({ commanderName: 'Test', seed: 64 })
    g.ship.cargo.furs = 2
    const enc = testEncounter('trader')
    enc.trade = { sells: {}, buys: { furs: 200 } }
    const res = tradeSell(g, enc, 'furs', 0)
    expect(res.ok).toBe(false)
    expect(res.error).toBe('error.nothingToSell')
  })
})

describe('firing on a trader is piracy', () => {
  it('will not let the player run from a hauler nobody is fighting', () => {
    const g = newGame({ commanderName: 'Test', seed: 65 })
    const enc = testEncounter('trader')
    expect(isPeacefulTrader(enc)).toBe(true)

    resolveRound(g, enc, 'flee', new Rng(1))

    // Refused outright: no round burned, no parting shot, still a meeting.
    expect(enc.status).toBe('ongoing')
    expect(enc.round).toBe(0)
    expect(enc.messages).toEqual([])
  })

  it('the first shot puts a warrant out and opens the escape route', () => {
    const g = newGame({ commanderName: 'Test', seed: 66 })
    expect(wantedByLaw(g)).toBe(false)
    const enc = testEncounter('trader')

    resolveRound(g, enc, 'attack', new Rng(2))

    expect(enc.provoked).toBe(true)
    expect(isPeacefulTrader(enc)).toBe(false)
    expect(g.record.policeRecord).toBe(-PIRACY_KARMA)
    expect(wantedByLaw(g)).toBe(true)
    expect(hunterChance(g)).toBeGreaterThan(0)
    expect(enc.messages.some((m) => m.key === 'encounter.trader.distress')).toBe(true)

    // Now there is a fight to run from — and no strolling away from it.
    resolveRound(g, enc, 'ignore', new Rng(3))
    expect(enc.status).toBe('ongoing')
    resolveRound(g, enc, 'flee', new Rng(3))
    expect(['ongoing', 'playerFled']).toContain(enc.status)
    expect(enc.round).toBeGreaterThan(1)
  })

  it('charges the crime once, however many volleys follow', () => {
    const g = newGame({ commanderName: 'Test', seed: 67 })
    const enc = testEncounter('trader', { hull: 100000 }) // outlives the barrage
    const rng = new Rng(4)
    for (let i = 0; i < 5; i++) resolveRound(g, enc, 'attack', rng)

    expect(g.record.policeRecord).toBe(-PIRACY_KARMA)
    expect(enc.messages.filter((m) => m.key === 'encounter.trader.distress').length).toBe(1)
  })

  it('a defender who turns pirate is wanted like anyone else', () => {
    const g = newGame({ commanderName: 'Test', seed: 68 })
    g.record.policeRecord = 8
    expect(standing(g)).toBe('defender')
    const enc = testEncounter('trader')

    resolveRound(g, enc, 'attack', new Rng(5))

    // A spotless name is no shield here: the drop always lands past the warrant.
    expect(wantedByLaw(g)).toBe(true)
    expect(g.record.policeRecord).toBe(-WANTED_THRESHOLD)
  })

  it('a provoked hauler keeps firing between manoeuvres', () => {
    const g = newGame({ commanderName: 'Test', seed: 69 })
    g.ship.hull = 5000 // survive long enough to be shot at repeatedly
    const enc = testEncounter('trader', { hull: 100000, weaponPower: 40, fighter: 20 })
    const rng = new Rng(6)
    resolveRound(g, enc, 'attack', rng)
    const hullAfterFirstExchange = g.ship.hull

    // Nothing but helm work from here: an unprovoked trader would hold fire, but
    // this one has been shot at and is in the fight until it ends.
    for (let i = 0; i < 6 && enc.status === 'ongoing'; i++) {
      resolveRound(g, enc, i % 2 === 0 ? 'openRange' : 'closeIn', rng)
    }
    expect(g.ship.hull).toBeLessThan(hullAfterFirstExchange)
  })

  it('leaves a trader alone until fired on', () => {
    const g = newGame({ commanderName: 'Test', seed: 70 })
    const enc = testEncounter('trader', { weaponPower: 40, fighter: 20 })
    const hullBefore = g.ship.hull

    resolveRound(g, enc, 'closeIn', new Rng(7))
    resolveRound(g, enc, 'openRange', new Rng(8))

    expect(g.ship.hull).toBe(hullBefore)
    expect(g.record.policeRecord).toBe(0)

    resolveRound(g, enc, 'ignore', new Rng(9))
    expect(enc.status).toBe('ignored')
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

describe('daily tick', () => {
  it('advanceDay charges loan interest and crew wages', () => {
    const g = newGame({ commanderName: 'Test', seed: 86 })
    g.credits = 10000
    g.debt = 1000
    const dayBefore = g.day
    advanceDay(g)
    expect(g.day).toBe(dayBefore + 1)
    // 10% interest is paid from credits when available, leaving debt unchanged.
    expect(g.debt).toBe(1000)
    expect(g.credits).toBe(9900)
  })

  it('advanceDay adds unpaid interest to debt when credits are insufficient', () => {
    const g = newGame({ commanderName: 'Test', seed: 86 })
    g.credits = 0
    g.debt = 1000
    advanceDay(g)
    // Unpaid 100 cr interest compounds onto debt.
    expect(g.debt).toBe(1100)
    expect(g.credits).toBe(0)

    // Partial credits test
    g.credits = 40
    g.debt = 1000
    advanceDay(g)
    // 40 cr paid from credits, remaining 60 cr added to debt.
    expect(g.credits).toBe(0)
    expect(g.debt).toBe(1060)
  })
})

describe('mining', () => {
  it('extracts a unit of cargo and advances a day', () => {
    const g = newGame({ commanderName: 'Test', seed: 82 })
    g.systems[g.currentSystem].mineSite = { kind: 'asteroidField', resource: 'ore', richness: 10 }
    const dayBefore = g.day
    const oreBefore = g.ship.cargo.ore
    const res = mineOnce(g, new Rng(1))
    expect(res.ok).toBe(true)
    expect(g.day).toBe(dayBefore + 1)
    expect(g.ship.cargo.ore).toBe(oreBefore + 1)
  })

  it('scoops fuel at a gas giant when the tank has room', () => {
    const g = newGame({ commanderName: 'Test', seed: 82 })
    g.systems[g.currentSystem].mineSite = { kind: 'gasGiant', resource: 'fuel', richness: 10 }
    g.ship.fuel = 0
    const res = mineOnce(g, new Rng(1))
    expect(res.ok).toBe(true)
    expect(g.ship.fuel).toBe(1)
  })

  it('cannot mine where there is no site', () => {
    const g = newGame({ commanderName: 'Test', seed: 83 })
    g.systems[g.currentSystem].mineSite = null
    expect(mineOnce(g, new Rng(1)).ok).toBe(false)
  })

  it('logs the amount actually extracted, not a fixed one', () => {
    // An industrial hull pulls INDUSTRIAL_MINING_YIELD units a day; the log
    // line the UI quotes must carry that figure rather than a hard-coded 1.
    const g = newGame({ commanderName: 'Test', seed: 83 })
    g.ship.type = 'ant' // industrial
    g.systems[g.currentSystem].mineSite = { kind: 'iceField', resource: 'water', richness: 5 }
    const res = mineOnce(g, new Rng(1))
    expect(res.ok).toBe(true)
    const entry = g.log.find((l) => l.key === 'log.mined')
    expect(entry?.params?.amount).toBe(INDUSTRIAL_MINING_YIELD)
  })
})

describe('ship class perks', () => {
  it('explorer hulls get extra warp range', () => {
    const g = newGame({ commanderName: 'Test', seed: 84 })
    g.ship.type = 'dragonfly' // explorer
    expect(maxFuel(g.ship)).toBe(SHIP_TYPES.dragonfly.fuelTanks + EXPLORER_RANGE_BONUS)
    g.ship.type = 'flea' // trade: no bonus
    expect(maxFuel(g.ship)).toBe(SHIP_TYPES.flea.fuelTanks)
  })

  it('military hulls amplify weapon damage', () => {
    const g = newGame({ commanderName: 'Test', seed: 84 })
    g.ship.weapons = ['pulse', 'pulse']
    g.ship.type = 'gnat' // civilian: raw power
    const raw = weaponPower(g.ship)
    g.ship.type = 'ladybird' // military: boosted
    expect(weaponPower(g.ship)).toBeGreaterThan(raw)
  })

  it('industrial hulls mine several units per day', () => {
    const g = newGame({ commanderName: 'Test', seed: 84 })
    g.ship.type = 'ant' // industrial
    g.systems[g.currentSystem].mineSite = { kind: 'iceField', resource: 'water', richness: 5 }
    const before = g.ship.cargo.water
    const res = mineOnce(g, new Rng(1))
    expect(res.ok).toBe(true)
    expect(g.ship.cargo.water).toBe(before + INDUSTRIAL_MINING_YIELD)
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
    // A jump costs a day — plus whatever a singularity stole on the way, if the
    // leg happened to find one.
    expect(g.day).toBe(dayBefore + 1 + (res.blackHole?.daysLost ?? 0))
    expect(g.ship.fuel).toBeLessThan(fuelBefore)
    expect(g.currentSystem).toBe(target)
  })

  it('a leg can turn up several meetings, and always reports a list', () => {
    const g = newGame({ commanderName: 'Test', seed: 500 })
    const target = nearestTo(g, g.currentSystem)
    g.ship.fuel = 999
    const res = warp(g, target)
    expect(res.ok).toBe(true)
    expect(Array.isArray(res.encounters)).toBe(true)

    // Over many jumps in pirate country, more than one meeting does happen.
    let most = 0
    for (let seed = 1; seed < 120 && most < 2; seed++) {
      const run = newGame({ commanderName: 'Test', seed })
      run.ship.fuel = 999
      run.record.policeRecord = -12 // wanted: hunters are drawn in too
      const to = nearestTo(run, run.currentSystem)
      most = Math.max(most, warp(run, to).encounters?.length ?? 0)
    }
    expect(most).toBeGreaterThanOrEqual(2)
  })

  it('longer hauls get more chances to run into somebody', () => {
    expect(encounterRolls(0)).toBe(1) // a wormhole hop is one roll
    expect(encounterRolls(2)).toBe(1)
    expect(encounterRolls(12)).toBeGreaterThan(encounterRolls(2))
    // However far you go, the leg is capped so it never becomes a gauntlet.
    expect(encounterRolls(999)).toBe(3)
  })

  it('events and offers only happen on a leg where nobody turned up', () => {
    for (let seed = 1; seed < 60; seed++) {
      const g = newGame({ commanderName: 'Test', seed })
      g.ship.fuel = 999
      const res = warp(g, nearestTo(g, g.currentSystem))
      if (res.encounters?.length) {
        expect(res.event).toBeNull()
        expect(res.questOffer).toBeNull()
      }
    }
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

// --- Regression tests for reviewed defects ----------------------------------
describe('selling below a good\'s production tech', () => {
  /** A planet that can use a good but is too primitive to make it. */
  function consumerWorld(techLevel: TechLevel): ReturnType<typeof generateGalaxy>[number] {
    const sys = generateGalaxy(4242)[0]
    sys.techLevel = techLevel
    sys.politics = 'anarchy' // forbids nothing, so only tech gates the sale
    sys.specialResource = 'none'
    sys.status = 'uneventful'
    return sys
  }

  it('pays for goods it can use but not produce', () => {
    // Narcotics are made from tech 5 up and usable from tech 0: hauling them
    // down the tech ladder is the trade. This returned 0 before the fix, so
    // contraband could only be sold where it was also produced.
    const sys = consumerWorld(2)
    refreshMarket(sys, new Rng(7))
    expect(sys.buyPrice.narcotics).toBe(0)
    expect(sys.sellPrice.narcotics).toBeGreaterThan(0)
  })

  it('still refuses goods the planet is too primitive to use', () => {
    // Robots need tech 4 to use; tech 3 must not buy them at any price.
    const sys = consumerWorld(3)
    refreshMarket(sys, new Rng(7))
    expect(sys.sellPrice.robots).toBe(0)
  })

  it('still refuses goods the government bans', () => {
    const sys = consumerWorld(2)
    sys.politics = 'theocracy' // bans firearms and narcotics
    refreshMarket(sys, new Rng(7))
    expect(sys.sellPrice.narcotics).toBe(0)
  })

  it('leaves the produced-here case alone', () => {
    const sys = consumerWorld(6)
    refreshMarket(sys, new Rng(7))
    expect(sys.buyPrice.narcotics).toBeGreaterThan(0)
    expect(sys.sellPrice.narcotics).toBeGreaterThan(0)
  })
})

describe('local sourcing follows cargo out of the hold', () => {
  it('selling locally-bought goods does not strand hauled-in cargo', () => {
    const g = newGame({ commanderName: 'T', seed: 99 })
    const sys = g.systems[g.currentSystem]
    sys.buyPrice.water = 10
    sys.sellPrice.water = 8
    sys.qty.water = 100
    g.credits = 10000
    // Four units flown in, so all four may settle a contract here. (The Flea
    // holds ten bays, so this leaves room to buy more.)
    g.ship.cargo.water = 4
    expect(deliverableUnits(g, 'water')).toBe(4)

    buyGood(g, 'water', 3) // three bought here — those three may not
    expect(g.ship.cargo.water).toBe(7)
    expect(deliverableUnits(g, 'water')).toBe(4)

    // Selling the three back must not eat into the hauled-in four.
    sellGood(g, 'water', 3)
    expect(g.ship.cargo.water).toBe(4)
    expect(deliverableUnits(g, 'water')).toBe(4)
  })

  it('dumping locally-bought goods behaves the same way', () => {
    const g = newGame({ commanderName: 'T', seed: 99 })
    const sys = g.systems[g.currentSystem]
    sys.buyPrice.water = 10
    sys.qty.water = 100
    g.credits = 10000
    g.ship.cargo.water = 4
    buyGood(g, 'water', 3)
    dumpGood(g, 'water', 3)
    expect(deliverableUnits(g, 'water')).toBe(4)
  })
})

describe('contraband seizure at an inspection', () => {
  it('clears the price paid along with the cargo', () => {
    const g = newGame({ commanderName: 'T', seed: 5 })
    g.ship.cargo.narcotics = 4
    g.buyingPrice.narcotics = 900
    noteLocalSourcing(g, 'narcotics', 4)

    const enc = testEncounter('police')
    resolveRound(g, enc, 'submit', new Rng(3))

    expect(g.ship.cargo.narcotics).toBe(0)
    // Left stale, the market screen kept quoting a cost for goods long gone.
    expect(g.buyingPrice.narcotics).toBe(0)
    expect(g.sourcedHere?.narcotics ?? 0).toBe(0)
  })
})

describe('quoted market price', () => {
  it('matches what buying actually costs', () => {
    const g = newGame({ commanderName: 'T', seed: 11 })
    const sys = g.systems[g.currentSystem]
    sys.buyPrice.water = 100
    sys.qty.water = 50
    g.credits = 100000
    // A trained trader pays under the shelf price; the screen must quote that.
    g.skills.trader = 10

    const quoted = marketBuyPrice(g, 'water')
    expect(quoted).toBeLessThan(sys.buyPrice.water)

    const before = g.credits
    buyGood(g, 'water', 3)
    expect(before - g.credits).toBe(quoted * 3)
  })
})

describe('determinism and per-encounter dice', () => {
  it('gives each encounter its own seed', () => {
    // Two fights on one leg used to share (seed, day, round) and so rolled an
    // identical sequence round for round.
    const g = newGame({ commanderName: 'T', seed: 77 })
    const rng = new Rng(4242)
    const a = spawnPirates(g, rng)
    const b = spawnPirates(g, rng)
    expect(a.seed).not.toBe(b.seed)
  })

  it('replays a seeded game identically', () => {
    // Quest ids came off the wall clock, so the same seed produced different
    // ids on every run.
    const run = (): string[] => {
      const g = newGame({ commanderName: 'T', seed: 2024 })
      return generateQuestBoard(g, new Rng(9)).map((q) => q.id)
    }
    expect(run()).toEqual(run())
  })

  it('never reuses a quest id across boards', () => {
    const g = newGame({ commanderName: 'T', seed: 5 })
    const ids = [
      ...generateQuestBoard(g, new Rng(1)).map((q) => q.id),
      ...generateQuestBoard(g, new Rng(2)).map((q) => q.id),
      ...generateQuestBoard(g, new Rng(3)).map((q) => q.id)
    ]
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('board postings the ship cannot take', () => {
  function boardWith(g: ReturnType<typeof newGame>, quest: Quest): void {
    g.systems[g.currentSystem].questBoard = [quest]
  }

  it('refuses freight that would never fit the hold', () => {
    const g = newGame({ commanderName: 'T', seed: 3 })
    // The Flea holds ten bays; a bulk contract is simply beyond it.
    const bulk: Quest = {
      id: 'bulk',
      type: 'fetch',
      giverSystem: g.currentSystem,
      targetSystem: g.currentSystem,
      reward: 50000,
      status: 'offered',
      good: 'ore',
      amount: 70
    }
    boardWith(g, bulk)
    expect(boardQuestProblem(g, bulk)).toBe('error.holdTooSmall')
    const res = acceptBoardQuest(g, 'bulk')
    expect(res.ok).toBe(false)
    expect(res.error).toBe('error.holdTooSmall')
    expect(activeQuests(g)).toHaveLength(0)
  })

  it('still takes a contract the hold can carry', () => {
    const g = newGame({ commanderName: 'T', seed: 3 })
    const small: Quest = {
      id: 'small',
      type: 'fetch',
      giverSystem: g.currentSystem,
      targetSystem: g.currentSystem,
      reward: 900,
      status: 'offered',
      good: 'ore',
      amount: 6
    }
    boardWith(g, small)
    expect(boardQuestProblem(g, small)).toBeNull()
    expect(acceptBoardQuest(g, 'small').ok).toBe(true)
    expect(activeQuests(g)).toHaveLength(1)
  })
})

describe('cargo burnt in an electrical fire', () => {
  it('comes off the local-sourcing ledger too', () => {
    const g = newGame({ commanderName: 'T', seed: 405 })
    g.ship.type = 'atlas' // seven hands needed, flying with one
    g.skills = { pilot: 1, fighter: 1, trader: 1, engineer: 1, electrician: 1 }
    // Every unit aboard was mined right here, so the ledger starts equal to the
    // hold and must stay that way however much of it burns.
    g.ship.cargo.ore = 40
    noteLocalSourcing(g, 'ore', 40)

    const rng = new Rng(5)
    let fire: ReturnType<typeof rollCrewIncident> = null
    for (let i = 0; i < 500 && !fire; i++) {
      g.ship.hull = 400 // keep her flyable so incidents keep rolling
      const incident = rollCrewIncident(g, rng)
      if (incident?.role === 'electrician') fire = incident
    }

    expect(fire).not.toBeNull()
    expect(g.ship.cargo.ore).toBeLessThan(40) // something did burn
    // Left unreleased, the ledger kept holding back goods that no longer exist.
    expect(g.sourcedHere?.ore).toBe(g.ship.cargo.ore)
    expect(deliverableUnits(g, 'ore')).toBe(0)
  })
})

describe('a planet awaiting a delivery has none to sell', () => {
  /** Accept a relief contract for `good`, due at the current system. */
  function contractDueHere(g: ReturnType<typeof newGame>, good: GoodId): Quest {
    const q: Quest = {
      id: `due-${good}`,
      type: 'relief',
      giverSystem: (g.currentSystem + 1) % g.systems.length,
      targetSystem: g.currentSystem,
      reward: 1000,
      status: 'offered',
      good,
      amount: 5
    }
    acceptQuest(g, q)
    return q
  }

  function stockedGame(): ReturnType<typeof newGame> {
    const g = newGame({ commanderName: 'Test', seed: 310 })
    const sys = g.systems[g.currentSystem]
    sys.buyPrice.water = 10
    sys.qty.water = 50
    sys.buyPrice.food = 20
    sys.qty.food = 50
    g.credits = 10000
    return g
  }

  it('takes the contracted good off the shelf', () => {
    const g = stockedGame()
    expect(marketBuyPrice(g, 'water')).toBeGreaterThan(0)

    contractDueHere(g, 'water')

    expect(isContractEmbargoed(g, 'water')).toBe(true)
    expect(marketBuyPrice(g, 'water')).toBe(0)
    const res = buyGood(g, 'water', 5)
    expect(res.ok).toBe(false)
    // Its own reason, not a bare "not sold" — the player needs to know why.
    expect(res.error).toBe('error.contractEmbargo')
    expect(g.ship.cargo.water).toBe(0)
  })

  it('leaves every other commodity alone', () => {
    const g = stockedGame()
    contractDueHere(g, 'water')
    expect(isContractEmbargoed(g, 'food')).toBe(false)
    expect(buyGood(g, 'food', 3).ok).toBe(true)
    expect(g.ship.cargo.food).toBe(3)
  })

  it('does not touch a planet that is not the destination', () => {
    const g = stockedGame()
    const q = contractDueHere(g, 'water')
    q.targetSystem = (g.currentSystem + 1) % g.systems.length
    expect(isContractEmbargoed(g, 'water')).toBe(false)
    expect(buyGood(g, 'water', 2).ok).toBe(true)
  })

  it('lifts once the contract is settled', () => {
    const g = stockedGame()
    const q = contractDueHere(g, 'water')
    g.ship.cargo.water = 5 // hauled in
    expect(turnInQuest(g, q.id)).not.toBeNull()
    expect(isContractEmbargoed(g, 'water')).toBe(false)
    expect(marketBuyPrice(g, 'water')).toBeGreaterThan(0)
  })
})

describe('star systems have insides', () => {
  it('gives every system a star and somewhere to dock', () => {
    const systems = generateGalaxy(4242)
    for (const sys of systems) {
      const bodies = systemBodies(sys)
      expect(bodies.length).toBeGreaterThanOrEqual(2)
      expect(bodies.length).toBeLessThanOrEqual(MAX_SYSTEM_BODIES)
      // Index 0 is always the settled world — that is where a ship makes port.
      expect(bodies[0].kind).toBe('planet')
      expect(bodies.filter((b) => b.kind === 'planet').length).toBe(1)
      expect(sys.starClass).toBeTruthy()
      // Ids match position, so `currentBody` can index straight in.
      bodies.forEach((b, i) => expect(b.id).toBe(i))
    }
  })

  it('puts uninhabited worlds and the odd station in among the planets', () => {
    const systems = generateGalaxy(77)
    const barren = systems.flatMap((s) => systemBodies(s).filter((b) => b.kind === 'barren'))
    const stations = systems.flatMap((s) => systemBodies(s).filter((b) => b.kind === 'station'))
    expect(barren.length).toBeGreaterThan(systems.length) // more dead rocks than systems
    expect(stations.length).toBeGreaterThan(5)
    // No system gets two stations — they are meant to be worth crossing to.
    for (const sys of systems) {
      expect(systemBodies(sys).filter((b) => b.kind === 'station').length).toBeLessThanOrEqual(1)
    }
    // Every station advertises which of the three trades it plies.
    for (const st of stations) expect(STATION_KINDS).toContain(st.station)
  })

  it('grows bodies for a save written before systems had any', () => {
    const g = newGame({ commanderName: 'Test', seed: 8 })
    for (const sys of g.systems) delete sys.bodies
    ensureBodies(g.seed, g.systems)
    for (const sys of g.systems) expect(systemBodies(sys).length).toBeGreaterThanOrEqual(2)
    // Deterministic: the same save always grows the same worlds.
    const again = newGame({ commanderName: 'Test', seed: 8 })
    for (const sys of again.systems) delete sys.bodies
    ensureBodies(again.seed, again.systems)
    expect(g.systems.map((s) => s.bodies?.map((b) => [b.kind, b.orbit]))).toEqual(
      again.systems.map((s) => s.bodies?.map((b) => [b.kind, b.orbit]))
    )
  })
})

describe('crossing a system on impulse', () => {
  /** A game parked at a system with somewhere else to fly to. */
  const withBodies = (seed = 21): ReturnType<typeof newGame> => {
    const g = newGame({ commanderName: 'Test', seed })
    // Guarantee a second body so the test never depends on generation luck.
    const sys = g.systems[g.currentSystem]
    sys.bodies = [
      { id: 0, kind: 'planet', orbit: 1, angle: 0, mineSite: null },
      { id: 1, kind: 'barren', orbit: 4, angle: 0.3, terrain: 'asteroidBelt', mineSite: { kind: 'asteroidField', resource: 'ore', richness: 10 } },
      { id: 2, kind: 'station', orbit: 6, angle: 0.7, station: 'engineering', mineSite: null }
    ]
    g.currentBody = 0
    return g
  }

  it('costs days rather than fuel, and moves the ship', () => {
    const g = withBodies()
    const dayBefore = g.day
    const fuelBefore = g.ship.fuel
    const res = travelToBody(g, 1, new Rng(5))
    expect(res.ok).toBe(true)
    expect(res.days).toBeGreaterThanOrEqual(1)
    expect(g.currentBody).toBe(1)
    // Impulse burns no tank fuel — otherwise a dry ship could strand itself on
    // a dead rock with no way back to the only place selling any.
    expect(g.ship.fuel).toBe(fuelBefore)
    expect(g.day).toBeGreaterThanOrEqual(dayBefore + res.days!)
  })

  it('refuses a course to where the ship already is', () => {
    const g = withBodies()
    expect(travelToBody(g, 0, new Rng(1)).ok).toBe(false)
    expect(bodyTravelProblem(g, 0)).toBe('error.alreadyHere')
    expect(bodyTravelProblem(g, 99)).toBe('error.invalidTarget')
  })

  it('does not launder locally-bought cargo into hauled-in cargo', () => {
    const g = withBodies()
    // Buy at the planet, fly out to the belt and back: the goods were still
    // bought here, so they must not settle a contract due here.
    const sys = g.systems[g.currentSystem]
    sys.buyPrice.water = 10
    sys.qty.water = 50
    g.credits = 10000
    expect(buyGood(g, 'water', 5).ok).toBe(true)
    expect(deliverableUnits(g, 'water')).toBe(0)
    travelToBody(g, 1, new Rng(2))
    travelToBody(g, 0, new Rng(3))
    expect(deliverableUnits(g, 'water')).toBe(0)
  })

  it('takes the port with it: no market, bank or hall away from the planet', () => {
    const g = withBodies()
    g.currentBody = 1
    expect(atCapital(g)).toBe(false)
    expect(hasShipyard(g)).toBe(false)
    expect(buyGood(g, 'water', 1).error).toBe('error.noMarketHere')
    expect(sellGood(g, 'water', 1).error).toBe('error.noMarketHere')
    expect(getLoan(g, 100).error).toBe('error.noBankHere')
    expect(refuel(g, 1).error).toBe('error.noShipyardHere')
    expect(hireMercenary(g, MERCENARY_IDS[0]).error).toBe('error.noHiringHallHere')
  })

  it('mines the site of the body the ship is actually at', () => {
    const g = withBodies()
    g.systems[g.currentSystem].mineSite = null // nothing at the planet itself
    expect(currentMineSite(g)).toBeNull()
    expect(mineOnce(g, new Rng(1)).ok).toBe(false)
    g.currentBody = 1 // out at the belt
    expect(currentMineSite(g)?.resource).toBe('ore')
    expect(mineOnce(g, new Rng(1)).ok).toBe(true)
  })

  it('counts resources mined at another body as hauled to the capital', () => {
    const g = withBodies()
    const quest: Quest = {
      id: 'body-mining-relief',
      type: 'relief',
      giverSystem: 1,
      targetSystem: g.currentSystem,
      reward: 500,
      status: 'offered',
      good: 'ore',
      amount: 1
    }
    acceptQuest(g, quest)
    g.systems[g.currentSystem].mineSite = null
    g.currentBody = 1

    expect(mineOnce(g, new Rng(1)).ok).toBe(true)
    expect(g.ship.cargo.ore).toBe(1)
    expect(canTurnIn(g, quest)).toBe(false)

    travelToBody(g, 0, new Rng(2))
    expect(deliverableUnits(g, 'ore')).toBe(1)
    expect(canTurnIn(g, quest)).toBe(true)
    expect(turnInQuest(g, quest.id)?.id).toBe(quest.id)
  })
})

describe('orbital stations', () => {
  const atStation = (kind: 'science' | 'military' | 'engineering'): ReturnType<typeof newGame> => {
    const g = newGame({ commanderName: 'Test', seed: 33 })
    g.systems[g.currentSystem].bodies = [
      { id: 0, kind: 'planet', orbit: 1, angle: 0, mineSite: null },
      { id: 1, kind: 'station', orbit: 3, angle: 0.4, station: kind, mineSite: null }
    ]
    g.currentBody = 1
    g.credits = 2_000_000
    return g
  }

  it('sells gear no planetary yard stocks, and no ordinary gear at all', () => {
    const g = atStation('military')
    expect(currentStation(g)).toBe('military')
    expect(weaponsForSale(g)).toContain('singularity')
    expect(weaponsForSale(g)).not.toContain('pulse')
    // A planet never stocks the station-built kit, however advanced it is.
    const planet = newGame({ commanderName: 'Test', seed: 33 })
    planet.systems[planet.currentSystem].techLevel = 7
    expect(weaponsForSale(planet)).toContain('fusion')
    expect(weaponsForSale(planet)).not.toContain('singularity')
    expect(shieldsForSale(planet)).not.toContain('barrier')
  })

  it('station ordnance is a clear step above anything a planet builds', () => {
    const bestPlanetGun = Math.max(
      ...WEAPON_IDS.filter((id) => !WEAPONS[id].stationOnly).map((id) => WEAPONS[id].power)
    )
    expect(WEAPONS.singularity.power).toBeGreaterThan(bestPlanetGun * 2)
    const bestPlanetShield = Math.max(
      ...SHIELD_IDS.filter((id) => !SHIELDS[id].stationOnly).map((id) => SHIELDS[id].power)
    )
    expect(SHIELDS.barrier.power).toBeGreaterThan(bestPlanetShield * 2)
  })

  it('refuses to sell what this yard does not build', () => {
    const g = atStation('engineering')
    expect(buyWeapon(g, 'pulse').error).toBe('error.notStockedHere')
    expect(buyShield(g, 'barrier').error).toBe('error.notStockedHere')
    expect(buyGadget(g, 'nanoHold').ok).toBe(true)
  })

  it('sells no hulls — that is what the planet below is for', () => {
    const g = atStation('science')
    expect(shipsForSale(g)).toEqual([])
    expect(buyShip(g, 'gnat').error).toBe('error.noShipyardHere')
  })

  it('fabrication yards reinforce hulls past a planetary dry dock, and cheaper', () => {
    const g = atStation('engineering')
    // A hull whose repair bill is big enough for a discount to show (the Flea's
    // is one credit a point, and nothing goes below that).
    g.ship.type = 'goliath'
    expect(maxHullUpgradesHere(g)).toBeGreaterThan(MAX_HULL_UPGRADES)
    expect(repairPricePerUnit(g)).toBeLessThan(SHIP_TYPES[g.ship.type].repairCostPerUnit)
    for (let i = 0; i < MAX_HULL_UPGRADES + 1; i++) {
      expect(buyHullUpgrade(g).ok).toBe(true)
    }
    expect(g.ship.hullUpgrades).toBe(MAX_HULL_UPGRADES + 1)
  })

  it('a nanofolded hold is worth far more than a bolt-on bay', () => {
    const g = atStation('engineering')
    const before = totalCargoBays(g.ship)
    expect(buyGadget(g, 'nanoHold').ok).toBe(true)
    expect(totalCargoBays(g.ship) - before).toBe(EXTRA_CARGO_BAYS_ADVANCED)
    expect(EXTRA_CARGO_BAYS_ADVANCED).toBeGreaterThan(EXTRA_CARGO_BAYS)
  })
})

describe('planetary news', () => {
  it('a world in crisis leads with the crisis', () => {
    const g = newGame({ commanderName: 'Test', seed: 3 })
    const sys = g.systems[g.currentSystem]
    sys.status = 'drought'
    sys.politics = 'dictatorship'
    sys.economyType = 'agricultural'
    const items = generateNews(sys, new Rng(9))
    expect(items.length).toBeGreaterThanOrEqual(NEWS_MIN)
    expect(items.length).toBeLessThanOrEqual(NEWS_MAX + 1)
    // The drought is the story of the day, whatever else is running.
    expect(items[0].id.startsWith('drought')).toBe(true)
    // Every story resolves to real dictionary entries, in both locales.
    for (const item of items) {
      expect(item.headlineKey).toBe(`news.${item.id}.headline`)
      expect(t(item.headlineKey)).not.toBe(item.headlineKey)
      expect(t(item.bodyKey)).not.toBe(item.bodyKey)
    }
  })

  it('never runs the same story twice in one bulletin', () => {
    const g = newGame({ commanderName: 'Test', seed: 4 })
    for (let seed = 1; seed < 40; seed++) {
      const items = generateNews(g.systems[seed % g.systems.length], new Rng(seed))
      expect(new Set(items.map((i) => i.id)).size).toBe(items.length)
    }
  })

  it('is themed on the planet, not picked at random from the whole pool', () => {
    const g = newGame({ commanderName: 'Test', seed: 5 })
    const sys = g.systems[g.currentSystem]
    sys.status = 'uneventful'
    sys.politics = 'anarchy'
    sys.specialResource = 'none'
    sys.economyType = 'mining'
    const ids = new Set<string>()
    for (let seed = 1; seed < 60; seed++) {
      for (const item of generateNews(sys, new Rng(seed))) ids.add(item.id)
    }
    // Anarchy and a mining economy show up; a theocracy's fast never can.
    expect(ids.has('piracyRife')).toBe(true)
    expect(ids.has('oreStrike')).toBe(true)
    expect(ids.has('templeFast')).toBe(false)
    expect(ids.has('resortSeason')).toBe(false)
  })

  it('is refreshed on arrival', () => {
    const g = newGame({ commanderName: 'Test', seed: 6 })
    const target = g.systems.find((s) => s.id !== g.currentSystem)!.id
    g.ship.fuel = 999
    warp(g, target)
    expect(systemNews(g.systems[target]).length).toBeGreaterThan(0)
  })
})

describe('wormholes', () => {
  it('the galaxy has both surveyed pairs and unmapped holes', () => {
    const systems = generateGalaxy(1234)
    const paired = systems.filter((s) => s.wormholeTo !== null)
    expect(paired.length).toBe(WORMHOLE_PAIRS * 2)
    // Both ends agree with each other.
    for (const s of paired) expect(systems[s.wormholeTo!].wormholeTo).toBe(s.id)
    const unstable = systems.filter((s) => s.unstableWormhole)
    expect(unstable.length).toBe(UNSTABLE_WORMHOLES)
    // An unmapped hole never shares a sky with a surveyed one.
    for (const s of unstable) expect(s.wormholeTo).toBeNull()
  })

  it('an unmapped wormhole drops you somewhere else, free of charge', () => {
    const g = newGame({ commanderName: 'Test', seed: 90 })
    const from = g.currentSystem
    g.systems[from].unstableWormhole = true
    g.ship.fuel = 4
    const creditsBefore = g.credits
    const res = enterUnstableWormhole(g)
    expect(res.ok).toBe(true)
    expect(g.currentSystem).not.toBe(from)
    expect(res.arrivedAt).toBe(g.currentSystem)
    // No tax, no fuel: it is a hole in the floor, not a road.
    expect(g.credits).toBe(creditsBefore)
    expect(g.ship.fuel).toBe(4)
    // And it puts you down at the far system's capital, properly docked.
    expect(g.currentBody).toBe(0)
    expect(g.systems[g.currentSystem].visited).toBe(true)
  })

  it('throws you anywhere on the chart, not just next door', () => {
    const destinations = new Set<number>()
    for (let seed = 1; seed < 40; seed++) {
      const g = newGame({ commanderName: 'Test', seed })
      g.systems[g.currentSystem].unstableWormhole = true
      const res = enterUnstableWormhole(g)
      if (res.ok) destinations.add(g.currentSystem)
    }
    // Wildly different landing spots across runs — it is not a fixed link.
    expect(destinations.size).toBeGreaterThan(15)
  })

  it('refuses when there is no hole to fall into', () => {
    const g = newGame({ commanderName: 'Test', seed: 91 })
    g.systems[g.currentSystem].unstableWormhole = false
    expect(enterUnstableWormhole(g).error).toBe('error.noWormholeHere')
  })
})

describe('black holes', () => {
  it('a better pilot in a sound hull has better odds of pulling clear', () => {
    const weak = newGame({ commanderName: 'Test', seed: 12 })
    weak.skills.pilot = 1
    weak.ship.hull = 1
    const strong = newGame({ commanderName: 'Test', seed: 12 })
    strong.skills.pilot = 10
    expect(blackHoleEscapeChance(strong)).toBeGreaterThan(blackHoleEscapeChance(weak))
    // Never a certainty, and never hopeless.
    expect(blackHoleEscapeChance(strong)).toBeLessThan(1)
    expect(blackHoleEscapeChance(weak)).toBeGreaterThan(0)
  })

  it('a longer haul is more likely to find one, up to a ceiling', () => {
    expect(blackHoleChance(30)).toBeGreaterThan(blackHoleChance(2))
    expect(blackHoleChance(100000)).toBeLessThanOrEqual(BLACK_HOLE_CHANCE_MAX)
  })

  it('turns up over a run of jumps, and can be fatal', () => {
    let met = 0
    let killed = 0
    for (let seed = 1; seed < 400 && killed === 0; seed++) {
      const g = newGame({ commanderName: 'Test', seed })
      g.ship.fuel = 999
      g.skills.pilot = 1 // a poor helmsman: the well keeps some of them
      const target = g.systems.find((s) => s.id !== g.currentSystem)!.id
      const res = warp(g, target)
      if (!res.blackHole) continue
      met++
      expect(res.blackHole.daysLost).toBeGreaterThan(0)
      if (!res.blackHole.survived) {
        killed++
        // Nothing left of the ship for the caller to salvage.
        expect(g.ship.hull).toBe(0)
      }
    }
    expect(met).toBeGreaterThan(0)
    expect(killed).toBe(1)
  })

  it('reads back as an event the UI can show either way', () => {
    const survived = blackHoleEvent({ survived: true, damage: 12, daysLost: 2, escapeChance: 0.5 })
    expect(survived.bodyKey).toBe('event.blackHole.bodySurvived')
    expect(survived.params?.chance).toBe(50)
    const lost = blackHoleEvent({ survived: false, damage: 40, daysLost: 3, escapeChance: 0.2 })
    expect(lost.bodyKey).toBe('event.blackHole.bodyLost')
  })
})
