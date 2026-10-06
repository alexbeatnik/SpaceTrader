import type {
  GameState,
  GoodId,
  Ship,
  ShipTypeId,
  SolarSystem,
  Skills,
  WeaponId,
  ShieldId,
  GadgetId
} from './types'
import { Rng, randomSeed } from './rng'
import { generateGalaxy, distance } from './galaxy'
import { refreshMarket, MAX_TRADER_DISCOUNT } from './market'
import { SHIP_TYPES, SHIP_TYPE_IDS } from '../data/ships'
import { GOOD_IDS } from '../data/goods'
import {
  WEAPONS,
  SHIELDS,
  GADGETS,
  WEAPON_IDS,
  SHIELD_IDS,
  GADGET_IDS,
  EXTRA_CARGO_BAYS,
  EXTRA_CARGO_BAYS_ADVANCED,
  EXTRA_FUEL_TANKS,
  EXTRA_FUEL_TANKS_ADVANCED
} from '../data/equipment'
import { MERCENARIES } from '../data/mercenaries'
import { ROBOTS } from '../data/robots'
import { economyOf } from '../data/economies'
import { PLANET_MAX_HULL_UPGRADES, STATIONS } from '../data/stations'
import {
  atCapital,
  currentStation,
  hasShipyard,
  maxHullUpgradesHere,
  repairCostMulHere
} from './location'
import {
  assignRoles,
  crewHands,
  crewRepairPerDay,
  rollCrewIncident,
  shipRobots,
  ROBOT_FUEL_PER_DAY,
  type CrewIncident
} from './crew'
import {
  emptyGoods,
  isContractEmbargoed,
  noteLocalSourcing,
  releaseLocalSourcing
} from './sourcing'

// The local-sourcing ledger lives in its own module (`crew.ts` needs it too and
// cannot import this one), but stays part of this module's public surface.
export {
  emptyGoods,
  noteLocalSourcing,
  clearLocalSourcing,
  releaseLocalSourcing,
  deliverableUnits
} from './sourcing'

// Likewise the "where in the system are we docked" helpers: they answer only to
// the types and the station catalogue, so this module can gate on them.
export {
  systemBodies,
  bodyMineSite,
  currentBody,
  currentBodyIndex,
  currentMineSite,
  currentStation,
  atCapital,
  hasSpaceport,
  hasShipyard,
  maxHullUpgradesHere,
  repairCostMulHere,
  bodyTransitDays,
  transitDaysTo
} from './location'

export const GAME_VERSION = 1
export const STARTING_CREDITS = 1000
export const MAX_SKILL = 10
/** Extra max-hull points granted per reinforced-hull upgrade. */
export const HULL_UPGRADE_AMOUNT = 25
/**
 * Reinforced-hull upgrades a planetary shipyard will install. Orbital yards go
 * further — ask `maxHullUpgradesHere` for the limit that actually applies.
 */
export const MAX_HULL_UPGRADES = PLANET_MAX_HULL_UPGRADES
/** One-off price of an escape pod. */
export const ESCAPE_POD_PRICE = 2000
/** Extra warp range (parsecs) explorer-class hulls squeeze from their drives. */
export const EXPLORER_RANGE_BONUS = 3
/** Weapon damage multiplier on military-class hulls (tuned fire control). */
export const MILITARY_WEAPON_BONUS = 1.15
/** Units extracted per mining day by industrial-class hulls (others get 1). */
export const INDUSTRIAL_MINING_YIELD = 2

// --- Cargo & ship helpers ----------------------------------------------------
export function totalCargoBays(ship: Ship): number {
  const base = SHIP_TYPES[ship.type].cargoBays
  const extra = ship.gadgets.filter((g) => g === 'cargoBays').length * EXTRA_CARGO_BAYS
  // A station-built nanoHold folds far more space into the same slot.
  const advanced = ship.gadgets.filter((g) => g === 'nanoHold').length * EXTRA_CARGO_BAYS_ADVANCED
  return base + extra + advanced
}

/** Bays lost by removing one hold-expanding gadget. */
function gadgetBays(id: GadgetId): number {
  if (id === 'cargoBays') return EXTRA_CARGO_BAYS
  if (id === 'nanoHold') return EXTRA_CARGO_BAYS_ADVANCED
  return 0
}

export function usedCargoBays(ship: Ship): number {
  return GOOD_IDS.reduce((sum, g) => sum + ship.cargo[g], 0)
}

export function freeCargoBays(ship: Ship): number {
  return totalCargoBays(ship) - usedCargoBays(ship)
}

// --- Escort duty requirements ------------------------------------------------
/** Weapons a hull must have mounted to be signed on as a convoy escort. */
export const ESCORT_MIN_WEAPONS = 2
/** Shields a hull must have mounted to be signed on as a convoy escort. */
export const ESCORT_MIN_SHIELDS = 1

/**
 * Why the current ship cannot take escort work, or null if it can. Escorts fly
 * gun cover, so a convoy only signs on a military hull with real teeth. Lives
 * here rather than in `escort.ts` so the quest layer can gate on it too.
 */
export function escortShipProblem(state: GameState): string | null {
  if (SHIP_TYPES[state.ship.type].shipClass !== 'military') return 'error.escortNeedsMilitary'
  if (state.ship.weapons.length < ESCORT_MIN_WEAPONS) return 'error.escortNeedsWeapons'
  if (state.ship.shields.length < ESCORT_MIN_SHIELDS) return 'error.escortNeedsShield'
  return null
}

/** Whether the current ship qualifies for escort work. */
export function canEscort(state: GameState): boolean {
  return escortShipProblem(state) === null
}

export function shipValue(ship: Ship): number {
  const type = SHIP_TYPES[ship.type]
  let value = Math.round(type.price * 0.75)
  for (const w of ship.weapons) value += Math.round(WEAPONS[w].price * 0.75)
  for (const s of ship.shields) value += Math.round(SHIELDS[s].price * 0.75)
  for (const g of ship.gadgets) value += Math.round(GADGETS[g].price * 0.75)
  value += (ship.hullUpgrades ?? 0) * 1000 // partial resale of hull reinforcement
  return value
}

/**
 * What the ship can actually do right now. The four shipboard skills come from
 * whoever is standing that station (see `crew.ts`) — an unmanned post is worked
 * at a penalty — while trading is negotiated by the best talker aboard.
 */
export function effectiveSkills(state: GameState): Skills {
  const posts = assignRoles(state)
  let trader = state.skills.trader
  for (const hand of crewHands(state)) trader = Math.max(trader, hand.skills.trader)
  return {
    pilot: posts.pilot.strength,
    fighter: posts.gunner.strength,
    engineer: posts.mechanic.strength,
    electrician: posts.electrician.strength,
    trader
  }
}

/** Maximum fuel capacity including compactor gadgets and the explorer perk. */
export function maxFuel(ship: Ship): number {
  const type = SHIP_TYPES[ship.type]
  const extra = ship.gadgets.filter((g) => g === 'fuelCompactor').length * EXTRA_FUEL_TANKS
  const advanced =
    ship.gadgets.filter((g) => g === 'quantumCompactor').length * EXTRA_FUEL_TANKS_ADVANCED
  const classBonus = type.shipClass === 'explorer' ? EXPLORER_RANGE_BONUS : 0
  return type.fuelTanks + extra + advanced + classBonus
}

/**
 * Whether a ship with `range` parsecs of tank could ever get out of the system
 * it is docked in: another star within a full tank, or a wormhole of either
 * kind to fall into.
 *
 * The chart is not evenly settled. About one system in ten sits further from
 * its nearest neighbour than the shortest-legged hulls can fly, and a couple
 * per galaxy are out of reach of everything — which is fine, until something
 * leaves the player in one aboard a ship that cannot make the crossing back.
 * Every way of changing a ship's range, or of arriving without choosing where,
 * asks this first.
 */
export function canLeaveSystem(state: GameState, range: number, systemId = state.currentSystem): boolean {
  const here = state.systems[systemId]
  if (!here) return false
  if (here.wormholeTo !== null || here.unstableWormhole) return true
  // Rounded exactly as `systemDistance` rounds it, which is what a jump costs.
  return state.systems.some((s) => s.id !== here.id && Math.round(distance(here, s)) <= range)
}

/** Parsecs a fresh hull of this type flies on a full tank, perks included. */
export function hullRange(type: ShipTypeId): number {
  const hull = SHIP_TYPES[type]
  return hull.fuelTanks + (hull.shipClass === 'explorer' ? EXPLORER_RANGE_BONUS : 0)
}

/**
 * Why the yard here should not sell this hull, or null if it may. Exported so
 * the shipyard can grey the row out with the reason, rather than take the
 * player's money for a ship that will never leave the lot.
 */
export function shipPurchaseProblem(state: GameState, target: ShipTypeId): string | null {
  if (!canLeaveSystem(state, hullRange(target))) return 'error.rangeTooShort'
  // Nor one with fewer cabins than there are passengers already aboard.
  if (SHIP_TYPES[target].crewQuarters - 1 < passengersAboard(state)) {
    return 'error.passengersNeedBerths'
  }
  return null
}

/**
 * Fuel price per parsec at the current system: the ship's base cost scaled by
 * the local economy (e.g. cheap on refinery worlds, dear on resort worlds).
 */
export function fuelPricePerParsec(state: GameState): number {
  const base = SHIP_TYPES[state.ship.type].fuelCostPerParsec
  const mul = economyOf(currentSystem(state).economyType).fuelCostMul
  return Math.max(1, Math.round(base * mul))
}

/** Total daily wages owed to hired crew. Robots draw fuel instead of pay. */
export function crewWages(state: GameState): number {
  return state.ship.crew.reduce((sum, id) => sum + (MERCENARIES[id]?.wage ?? 0), 0)
}

/** Free berths, counting the commander's own and any robots aboard. */
export function freeQuarters(ship: Ship): number {
  return SHIP_TYPES[ship.type].crewQuarters - 1 - ship.crew.length - (ship.robots?.length ?? 0)
}

/** VIPs aboard under an active passenger contract. Each one has a cabin. */
export function passengersAboard(state: GameState): number {
  return state.quests.filter((q) => q.status === 'active' && q.type === 'passenger').length
}

/**
 * Berths nobody is in: `freeQuarters`, less the cabins passengers are using.
 *
 * A passenger contract was only ever *checked* against a spare berth, never
 * given one: with a single bunk free a ship could sign five VIPs, then hire a
 * mercenary into the same bunk. Everything that fills a berth — a hand, a
 * robot, another passenger — asks this, so a cabin promised stays promised.
 * Can read negative on a save from before the rule; nothing new fits until
 * somebody disembarks.
 */
export function freeBerths(state: GameState): number {
  return freeQuarters(state.ship) - passengersAboard(state)
}

export function maxHull(ship: Ship): number {
  return SHIP_TYPES[ship.type].hullStrength + (ship.hullUpgrades ?? 0) * HULL_UPGRADE_AMOUNT
}

/** Price of the next reinforced-hull upgrade (escalates with each one). */
export function hullUpgradePrice(ship: Ship): number {
  return 2500 * ((ship.hullUpgrades ?? 0) + 1)
}

export function totalShieldPower(ship: Ship): number {
  return ship.shields.reduce((sum, s) => sum + SHIELDS[s].power, 0)
}

export function currentShieldCharge(ship: Ship): number {
  return ship.shieldPoints.reduce((sum, p) => sum + p, 0)
}

export function weaponPower(ship: Ship): number {
  const raw = ship.weapons.reduce((sum, w) => sum + WEAPONS[w].power, 0)
  const mul = SHIP_TYPES[ship.type].shipClass === 'military' ? MILITARY_WEAPON_BONUS : 1
  return Math.round(raw * mul)
}

// --- New game ----------------------------------------------------------------
export interface NewGameOptions {
  commanderName: string
  skills?: Skills
  seed?: number
}

export function newGame(opts: NewGameOptions): GameState {
  const seed = opts.seed ?? randomSeed()
  const rng = new Rng(seed)
  const systems = generateGalaxy(seed)

  // Assign initial markets.
  for (const sys of systems) refreshMarket(sys, rng)

  // Start the player in a mid-tech, relatively safe system that has at least one
  // neighbour within the starting ship's range (so they are never stranded).
  const startRange = SHIP_TYPES.flea.fuelTanks
  const hasNeighbour = (s: SolarSystem): boolean =>
    systems.some((o) => o.id !== s.id && distance(s, o) <= startRange)
  const startId =
    systems.find((s) => s.techLevel >= 4 && s.techLevel <= 6 && hasNeighbour(s))?.id ??
    systems.find((s) => hasNeighbour(s))?.id ??
    systems.find((s) => s.techLevel >= 4 && s.techLevel <= 6)?.id ??
    0

  // The Flea is the only hull certified for single-handed flight, so that is
  // where a commander with no crew and no credits necessarily starts.
  const ship: Ship = {
    type: 'flea',
    hull: SHIP_TYPES.flea.hullStrength,
    hullUpgrades: 0,
    fuel: SHIP_TYPES.flea.fuelTanks,
    cargo: emptyGoods(),
    weapons: ['pulse'],
    shields: [],
    shieldPoints: [],
    gadgets: [],
    crew: [],
    robots: [],
    escapePod: false
  }

  const skills: Skills = opts.skills ?? {
    pilot: 5,
    fighter: 5,
    trader: 5,
    engineer: 5,
    electrician: 5
  }

  const state: GameState = {
    seed,
    day: 1,
    credits: STARTING_CREDITS,
    debt: 0,
    commanderName: opts.commanderName || 'Jameson',
    skills,
    ship,
    record: { policeRecord: 0, reputation: 0 },
    currentSystem: startId,
    // Every journey starts on the capital planet's landing field.
    currentBody: 0,
    systems,
    insurance: false,
    noClaim: 0,
    autoRefuel: false,
    buyingPrice: emptyGoods(),
    sourcedHere: emptyGoods(),
    log: [],
    flags: {},
    quests: [],
    version: GAME_VERSION
  }

  systems[startId].visited = true
  pushLog(state, 'log.gameStart', { system: systems[startId].nameId })
  return state
}

export function currentSystem(state: GameState): SolarSystem {
  return state.systems[state.currentSystem]
}

// --- Logging -----------------------------------------------------------------
export function pushLog(state: GameState, key: string, params?: Record<string, string | number>): void {
  state.log.unshift({ day: state.day, key, params })
  if (state.log.length > 100) state.log.pop()
}

// --- Market actions ----------------------------------------------------------
export interface ActionResult {
  ok: boolean
  error?: string
  info?: { key: string; params?: Record<string, string | number> }
}

/** Fraction knocked off a listed price by the best negotiator aboard (0–0.1). */
export function traderDiscount(state: GameState): number {
  return Math.min(MAX_TRADER_DISCOUNT, effectiveSkills(state).trader * 0.01)
}

/**
 * What a unit of `good` actually costs here, after the Trader-skill discount —
 * the figure the market screen must quote, or it bills the player one price and
 * charges another.
 */
export function marketBuyPrice(state: GameState, good: GoodId): number {
  const listed = currentSystem(state).buyPrice[good]
  if (listed <= 0) return 0
  // A planet awaiting this commodity under contract has none to spare.
  if (isContractEmbargoed(state, good)) return 0
  return Math.max(1, Math.round(listed * (1 - traderDiscount(state))))
}

/**
 * A count the player typed, as the whole number of units it can stand for.
 * Cargo, fuel and credits are all integers, and nothing in the engine may trust
 * a caller to have rounded: the bank's amount field passed its text straight
 * through, so a loan of 100.5 left half a credit on the books for good.
 */
export function wholeAmount(amount: number): number {
  return Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0
}

export function buyGood(state: GameState, good: GoodId, amount: number): ActionResult {
  amount = wholeAmount(amount)
  if (!atCapital(state)) return fail('error.noMarketHere')
  const sys = currentSystem(state)
  const price = sys.buyPrice[good]
  if (price <= 0 || sys.qty[good] <= 0) return fail('error.notSold')
  // Refused with its own reason rather than a bare "not sold": the player has a
  // contract open for exactly this, and needs to know why the shelf is bare.
  if (isContractEmbargoed(state, good)) return fail('error.contractEmbargo')

  const unit = marketBuyPrice(state, good)

  const maxByCredits = Math.floor(state.credits / unit)
  const maxByCargo = freeCargoBays(state.ship)
  const maxByStock = sys.qty[good]
  const qty = Math.min(amount, maxByCredits, maxByCargo, maxByStock)
  if (qty <= 0) return fail('error.cannotBuy')

  const cost = qty * unit
  // Weighted-average purchase price for profit tracking.
  const prevQty = state.ship.cargo[good]
  const prevCost = state.buyingPrice[good] * prevQty
  state.ship.cargo[good] += qty
  state.buyingPrice[good] =
    state.ship.cargo[good] > 0
      ? Math.round((prevCost + cost) / state.ship.cargo[good])
      : 0
  state.credits -= cost
  sys.qty[good] -= qty
  noteLocalSourcing(state, good, qty)

  return okInfo('info.bought', { qty, good, cost })
}

export function sellGood(state: GameState, good: GoodId, amount: number): ActionResult {
  amount = wholeAmount(amount)
  if (amount <= 0) return fail('error.nothingToSell')
  if (!atCapital(state)) return fail('error.noMarketHere')
  const sys = currentSystem(state)
  const have = state.ship.cargo[good]
  if (have <= 0) return fail('error.nothingToSell')
  if (sys.sellPrice[good] <= 0) return fail('error.notWanted')

  const qty = Math.min(amount, have)
  const unit = sys.sellPrice[good]
  const revenue = qty * unit

  state.ship.cargo[good] -= qty
  state.credits += revenue
  releaseLocalSourcing(state, good, qty)
  if (state.ship.cargo[good] === 0) state.buyingPrice[good] = 0

  return okInfo('info.sold', { qty, good, revenue })
}

/** Dump cargo into space (may incur a fine if noticed). */
export function dumpGood(state: GameState, good: GoodId, amount: number): ActionResult {
  amount = wholeAmount(amount)
  if (amount <= 0) return fail('error.nothingToDump')
  const have = state.ship.cargo[good]
  if (have <= 0) return fail('error.nothingToDump')
  const qty = Math.min(amount, have)
  state.ship.cargo[good] -= qty
  releaseLocalSourcing(state, good, qty)
  if (state.ship.cargo[good] === 0) state.buyingPrice[good] = 0
  return okInfo('info.dumped', { qty, good })
}

// --- Shipyard actions --------------------------------------------------------
export function refuel(state: GameState, parsecs: number): ActionResult {
  if (!hasShipyard(state)) return fail('error.noShipyardHere')
  const unit = fuelPricePerParsec(state)
  const needed = Math.min(wholeAmount(parsecs), maxFuel(state.ship) - state.ship.fuel)
  if (needed <= 0) return fail('error.tankFull')
  const affordable = Math.floor(state.credits / unit)
  const buy = Math.min(needed, affordable)
  if (buy <= 0) return fail('error.noCreditsFuel')
  state.ship.fuel += buy
  state.credits -= buy * unit
  return okInfo('info.refuelled', { parsecs: buy, cost: buy * unit })
}

export function refuelFull(state: GameState): ActionResult {
  return refuel(state, maxFuel(state.ship))
}

/** What the port charges, over its pump price, for fuel advanced on account. */
export const EMERGENCY_FUEL_MARKUP = 2

/** Fuel a port will advance a ship that cannot pay for it. */
export interface EmergencyFuelOffer {
  /** Parsecs put in the tank: exactly enough to reach the nearest star. */
  parsecs: number
  /** What it costs, markup included. */
  cost: number
}

/**
 * What the yard here would advance a stranded ship, or null when the ship is
 * not stranded.
 *
 * Stranded means: docked somewhere that sells fuel, with a tank that will not
 * reach even the nearest star, and without the credits to buy the difference.
 * There was no way out of that — no fuel without money, no money without a
 * jump, and no loan once the bank's limit was reached — and no game over
 * either: the voyage simply stopped, and two careers in five ended there.
 *
 * So the port authority, which would rather not have a derelict on its pad,
 * puts in just enough to clear the system and adds the bill to the commander's
 * account. It is deliberately a bad deal and a small one: double the pump
 * price, the nearest star and not a parsec further.
 */
export function emergencyFuelOffer(state: GameState): EmergencyFuelOffer | null {
  if (!hasShipyard(state)) return null
  const here = currentSystem(state)
  let nearest = Infinity
  for (const s of state.systems) {
    if (s.id !== here.id) nearest = Math.min(nearest, Math.round(distance(here, s)))
  }
  // Nothing within a full tank: fuel is not what is missing (see `canLeaveSystem`).
  if (nearest > maxFuel(state.ship)) return null
  const parsecs = nearest - state.ship.fuel
  if (parsecs <= 0) return null
  const pump = parsecs * fuelPricePerParsec(state)
  if (state.credits >= pump) return null
  return { parsecs, cost: pump * EMERGENCY_FUEL_MARKUP }
}

/**
 * Take the port's advance: fuel now, the bill on account. Whatever is in the
 * purse goes towards it first and the rest becomes debt — past the bank's loan
 * limit if need be, since the alternative is a ship that never moves again.
 */
export function takeEmergencyFuel(state: GameState): ActionResult {
  const offer = emergencyFuelOffer(state)
  if (!offer) return fail('error.notStranded')
  const paid = Math.min(state.credits, offer.cost)
  state.credits -= paid
  state.debt += offer.cost - paid
  state.ship.fuel += offer.parsecs
  pushLog(state, 'log.emergencyFuel', { parsecs: offer.parsecs, cost: offer.cost })
  return okInfo('info.emergencyFuel', { parsecs: offer.parsecs, cost: offer.cost })
}

/** What one point of hull costs to patch where the ship is docked. */
export function repairPricePerUnit(state: GameState): number {
  const base = SHIP_TYPES[state.ship.type].repairCostPerUnit
  return Math.max(1, Math.round(base * repairCostMulHere(state)))
}

export function repair(state: GameState, units: number): ActionResult {
  if (!hasShipyard(state)) return fail('error.noShipyardHere')
  const unit = repairPricePerUnit(state)
  const needed = Math.min(wholeAmount(units), maxHull(state.ship) - state.ship.hull)
  if (needed <= 0) return fail('error.hullFull')
  const affordable = Math.floor(state.credits / unit)
  const fix = Math.min(needed, affordable)
  if (fix <= 0) return fail('error.noCreditsRepair')
  state.ship.hull += fix
  state.credits -= fix * unit
  return okInfo('info.repaired', { units: fix, cost: fix * unit })
}

export function repairFull(state: GameState): ActionResult {
  return repair(state, maxHull(state.ship))
}

/**
 * Install a reinforced-hull upgrade: raises max hull and current hull. How many
 * a ship may carry depends on the yard — a station's dry dock will keep going
 * well past the point a planetary one runs out of gantry.
 */
export function buyHullUpgrade(state: GameState): ActionResult {
  if (!hasShipyard(state)) return fail('error.noShipyardHere')
  const ship = state.ship
  const current = ship.hullUpgrades ?? 0
  if (current >= maxHullUpgradesHere(state)) return fail('error.maxHullUpgrades')
  const price = hullUpgradePrice(ship)
  if (state.credits < price) return fail('error.notEnoughCredits')
  state.credits -= price
  ship.hullUpgrades = current + 1
  ship.hull += HULL_UPGRADE_AMOUNT
  return okInfo('info.hullUpgraded', { amount: HULL_UPGRADE_AMOUNT, cost: price })
}

// --- Equipment catalogue -----------------------------------------------------
/**
 * What the yard where the ship is docked will actually sell.
 *
 * A planetary shipyard stocks whatever its world's tech level can build. A
 * station stocks its own speciality instead: gear no planet has the orbital
 * fabricators for, and none of the ordinary stuff — that is what the planet
 * below is for.
 */
export function weaponsForSale(state: GameState): WeaponId[] {
  const station = currentStation(state)
  if (station) return STATIONS[station].weapons
  if (!atCapital(state)) return []
  const tech = currentSystem(state).techLevel
  return WEAPON_IDS.filter((id) => !WEAPONS[id].stationOnly && WEAPONS[id].minTechLevel <= tech)
}

export function shieldsForSale(state: GameState): ShieldId[] {
  const station = currentStation(state)
  if (station) return STATIONS[station].shields
  if (!atCapital(state)) return []
  const tech = currentSystem(state).techLevel
  return SHIELD_IDS.filter((id) => !SHIELDS[id].stationOnly && SHIELDS[id].minTechLevel <= tech)
}

export function gadgetsForSale(state: GameState): GadgetId[] {
  const station = currentStation(state)
  if (station) return STATIONS[station].gadgets
  if (!atCapital(state)) return []
  const tech = currentSystem(state).techLevel
  return GADGET_IDS.filter((id) => !GADGETS[id].stationOnly && GADGETS[id].minTechLevel <= tech)
}

// --- Equipment purchases -----------------------------------------------------
function traderPrice(state: GameState, base: number): number {
  return Math.round(base * (1 - traderDiscount(state)))
}

export function buyWeapon(state: GameState, id: WeaponId): ActionResult {
  if (!hasShipyard(state)) return fail('error.noShipyardHere')
  if (!weaponsForSale(state).includes(id)) return fail('error.notStockedHere')
  const type = SHIP_TYPES[state.ship.type]
  if (state.ship.weapons.length >= type.weaponSlots) return fail('error.noWeaponSlot')
  const price = traderPrice(state, WEAPONS[id].price)
  if (state.credits < price) return fail('error.notEnoughCredits')
  state.credits -= price
  state.ship.weapons.push(id)
  return okInfo('info.equipmentBought')
}

export function buyShield(state: GameState, id: ShieldId): ActionResult {
  if (!hasShipyard(state)) return fail('error.noShipyardHere')
  if (!shieldsForSale(state).includes(id)) return fail('error.notStockedHere')
  const type = SHIP_TYPES[state.ship.type]
  if (state.ship.shields.length >= type.shieldSlots) return fail('error.noShieldSlot')
  const price = traderPrice(state, SHIELDS[id].price)
  if (state.credits < price) return fail('error.notEnoughCredits')
  state.credits -= price
  state.ship.shields.push(id)
  state.ship.shieldPoints.push(SHIELDS[id].power)
  return okInfo('info.equipmentBought')
}

export function buyGadget(state: GameState, id: GadgetId): ActionResult {
  if (!hasShipyard(state)) return fail('error.noShipyardHere')
  if (!gadgetsForSale(state).includes(id)) return fail('error.notStockedHere')
  const type = SHIP_TYPES[state.ship.type]
  if (state.ship.gadgets.length >= type.gadgetSlots) return fail('error.noGadgetSlot')
  // Hold expanders stack; everything else is one to a ship.
  if (gadgetBays(id) === 0 && state.ship.gadgets.includes(id)) return fail('error.alreadyOwned')
  const price = traderPrice(state, GADGETS[id].price)
  if (state.credits < price) return fail('error.notEnoughCredits')
  state.credits -= price
  state.ship.gadgets.push(id)
  return okInfo('info.equipmentBought')
}

export function buyEscapePod(state: GameState): ActionResult {
  if (!hasShipyard(state)) return fail('error.noShipyardHere')
  if (state.ship.escapePod) return fail('error.alreadyOwned')
  if (state.credits < ESCAPE_POD_PRICE) return fail('error.notEnoughCredits')
  state.credits -= ESCAPE_POD_PRICE
  state.ship.escapePod = true
  return okInfo('info.escapePodBought')
}

/** Hulls the yard where the ship is docked has on the lot. */
export function shipsForSale(state: GameState): ShipTypeId[] {
  // Stations service ships and build modules; they do not sell hulls.
  if (!atCapital(state)) return []
  const tech = currentSystem(state).techLevel
  return SHIP_TYPE_IDS.filter((id) => SHIP_TYPES[id].minTechLevel <= tech)
}

/** Buy a new ship, trading in the old hull + equipment (cargo must be empty). */
export function buyShip(state: GameState, target: ShipTypeId): ActionResult {
  if (!atCapital(state)) return fail('error.noShipyardHere')
  if (!SHIP_TYPES[target] || !shipsForSale(state).includes(target)) return fail('error.notSold')
  if (target === state.ship.type) return fail('error.sameShip')
  if (usedCargoBays(state.ship) > 0) return fail('error.cargoNotEmpty')
  // A hull that cannot reach the nearest star from this yard is a purchase
  // with no way out: the trade-in is gone, and the new ship sits here forever.
  const problem = shipPurchaseProblem(state, target)
  if (problem) return fail(problem)

  const price = traderPrice(state, SHIP_TYPES[target].price)
  const tradeIn = shipValue(state.ship)
  const net = price - tradeIn
  if (state.credits < net) return fail('error.notEnoughCredits')

  const keepPod = state.ship.escapePod
  // The crew comes across with you, as far as the new hull has berths for
  // them — being dumped back to a solo watch on a bigger ship would be absurd.
  // Passengers keep their cabins, so the crew gets what is left after them.
  const berths = SHIP_TYPES[target].crewQuarters - 1 - passengersAboard(state)
  const crew = state.ship.crew.slice(0, berths)
  const robots = (state.ship.robots ?? []).slice(0, Math.max(0, berths - crew.length))
  const leftBehind =
    state.ship.crew.length - crew.length + (state.ship.robots?.length ?? 0) - robots.length

  state.credits -= net
  state.ship = {
    type: target,
    hull: SHIP_TYPES[target].hullStrength,
    hullUpgrades: 0,
    fuel: SHIP_TYPES[target].fuelTanks,
    cargo: emptyGoods(),
    weapons: [],
    shields: [],
    shieldPoints: [],
    gadgets: [],
    crew,
    robots,
    escapePod: keepPod
  }
  if (leftBehind > 0) pushLog(state, 'log.crewLeftBehind', { count: leftBehind })
  return okInfo('info.shipBought', { ship: target })
}

// --- Equipment removal (sell back at 75%) ------------------------------------
export function sellWeapon(state: GameState, index: number): ActionResult {
  if (!hasShipyard(state)) return fail('error.noShipyardHere')
  const id = state.ship.weapons[index]
  if (!id) return fail('error.nothingToRemove')
  state.ship.weapons.splice(index, 1)
  state.credits += Math.round(WEAPONS[id].price * 0.75)
  return okInfo('info.equipmentSold')
}

export function sellShield(state: GameState, index: number): ActionResult {
  if (!hasShipyard(state)) return fail('error.noShipyardHere')
  const id = state.ship.shields[index]
  if (!id) return fail('error.nothingToRemove')
  state.ship.shields.splice(index, 1)
  state.ship.shieldPoints.splice(index, 1)
  state.credits += Math.round(SHIELDS[id].price * 0.75)
  return okInfo('info.equipmentSold')
}

export function sellGadget(state: GameState, index: number): ActionResult {
  if (!hasShipyard(state)) return fail('error.noShipyardHere')
  const id = state.ship.gadgets[index]
  if (!id) return fail('error.nothingToRemove')
  // Removing hold space is refused if what is aboard would no longer fit.
  const bays = gadgetBays(id)
  if (bays > 0 && usedCargoBays(state.ship) > totalCargoBays(state.ship) - bays) {
    return fail('error.cargoNotEmpty')
  }
  // Nor is a tank extension unbolted in a system only the extension can leave.
  const without = state.ship.gadgets.filter((_, i) => i !== index)
  const rangeAfter = maxFuel({ ...state.ship, gadgets: without })
  if (rangeAfter < maxFuel(state.ship) && !canLeaveSystem(state, rangeAfter)) {
    return fail('error.rangeTooShort')
  }
  state.ship.gadgets.splice(index, 1)
  // Fuel the smaller tank cannot hold is vented with the module that held it.
  state.ship.fuel = Math.min(state.ship.fuel, maxFuel(state.ship))
  state.credits += Math.round(GADGETS[id].price * 0.75)
  return okInfo('info.equipmentSold')
}

// --- Crew / mercenaries ------------------------------------------------------
export function hireMercenary(state: GameState, id: string): ActionResult {
  if (!atCapital(state)) return fail('error.noHiringHallHere')
  const sys = currentSystem(state)
  const roster = sys.mercenaryIds ?? []
  if (!roster.includes(id) || !MERCENARIES[id]) return fail('error.mercNotHere')
  if (freeBerths(state) <= 0) return fail('error.noQuarters')
  if (state.ship.crew.includes(id)) return fail('error.alreadyHired')
  state.ship.crew.push(id)
  sys.mercenaryIds = roster.filter((m) => m !== id)
  return okInfo('info.mercHired', { name: id })
}

export function fireMercenary(state: GameState, id: string): ActionResult {
  // Nobody is put off the ship anywhere they cannot find another berth.
  if (!atCapital(state)) return fail('error.noHiringHallHere')
  const idx = state.ship.crew.indexOf(id)
  if (idx < 0) return fail('error.notInCrew')
  state.ship.crew.splice(idx, 1)
  // A dismissed hand goes back into the local hiring hall.
  const sys = currentSystem(state)
  sys.mercenaryIds = [...(sys.mercenaryIds ?? []), id]
  return okInfo('info.mercFired', { name: id })
}

// --- Robots ------------------------------------------------------------------
/**
 * Robot models on sale where the ship is docked. Science stations build the
 * whole range regardless of what the local worlds can manage; a planet is
 * limited to what its own tech level runs to.
 */
export function robotsForSale(state: GameState): string[] {
  const station = currentStation(state)
  if (station === 'science') return Object.keys(ROBOTS)
  if (!atCapital(state)) return []
  const tech = currentSystem(state).techLevel
  return Object.keys(ROBOTS).filter((id) => ROBOTS[id].minTechLevel <= tech)
}

/** Buy an android crew member. No wages, but it draws fuel every day. */
export function buyRobot(state: GameState, id: string): ActionResult {
  const robot = ROBOTS[id]
  if (!robot) return fail('error.robotNotHere')
  if (!robotsForSale(state).includes(id)) return fail('error.robotNotHere')
  if (freeBerths(state) <= 0) return fail('error.noQuarters')
  const price = traderPrice(state, robot.price)
  if (state.credits < price) return fail('error.notEnoughCredits')
  state.credits -= price
  state.ship.robots = [...(state.ship.robots ?? []), id]
  return okInfo('info.robotBought', { robot: id, cost: price })
}

/** Sell a robot back at the usual 75% of list. */
export function sellRobot(state: GameState, index: number): ActionResult {
  if (!hasShipyard(state)) return fail('error.noShipyardHere')
  const robots = state.ship.robots ?? []
  const id = robots[index]
  if (!id || !ROBOTS[id]) return fail('error.nothingToRemove')
  state.ship.robots = robots.filter((_, i) => i !== index)
  state.credits += Math.round(ROBOTS[id].price * 0.75)
  return okInfo('info.robotSold', { robot: id })
}

// --- Bank --------------------------------------------------------------------
export function maxLoan(state: GameState): number {
  // Cleaner records unlock larger loans; capped for balance.
  const base = 500 + Math.max(0, state.record.policeRecord) * 100
  return Math.min(25000, base + Math.floor(shipValue(state.ship) / 10))
}

export function getLoan(state: GameState, amount: number): ActionResult {
  if (!atCapital(state)) return fail('error.noBankHere')
  const available = maxLoan(state) - state.debt
  const take = Math.min(wholeAmount(amount), available)
  if (take <= 0) return fail('error.noLoanAvailable')
  state.debt += take
  state.credits += take
  return okInfo('info.loanTaken', { amount: take })
}

export function payDebt(state: GameState, amount: number): ActionResult {
  if (!atCapital(state)) return fail('error.noBankHere')
  const pay = Math.min(wholeAmount(amount), state.debt, state.credits)
  if (pay <= 0) return fail('error.nothingToPay')
  state.debt -= pay
  state.credits -= pay
  return okInfo('info.debtPaid', { amount: pay })
}

export function buyInsurance(state: GameState): ActionResult {
  if (!atCapital(state)) return fail('error.noBankHere')
  if (!state.ship.escapePod) return fail('error.needEscapePod')
  if (state.insurance) return fail('error.alreadyInsured')
  state.insurance = true
  state.noClaim = 0
  return okInfo('info.insuranceBought')
}

export function cancelInsurance(state: GameState): ActionResult {
  if (!atCapital(state)) return fail('error.noBankHere')
  if (!state.insurance) return fail('error.noInsurance')
  state.insurance = false
  return okInfo('info.insuranceCancelled')
}

// --- Daily tick --------------------------------------------------------------
function shipInsuranceValue(state: GameState): number {
  return SHIP_TYPES[state.ship.type].price
}

/**
 * Advance the calendar one day and apply daily upkeep: debt, wages, insurance,
 * robot power draw, and the crew's running repairs. Pass an `rng` for days
 * spent underway, where an undermanned station can turn into an incident;
 * leave it out for time that simply passes (a prison sentence).
 */
export function advanceDay(state: GameState, rng?: Rng): CrewIncident | null {
  state.day++

  // Daily loan interest (10%).
  if (state.debt > 0) {
    const interest = Math.ceil(state.debt * 0.1)
    if (state.credits >= interest) {
      state.credits -= interest
    } else {
      const unpaid = interest - state.credits
      state.credits = 0
      state.debt += unpaid
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

  // Robots draw on the tank. A dry tank leaves them dormant (see `crew.ts`),
  // which is the price of a crew that never asks to be paid.
  const robots = shipRobots(state).length
  if (robots > 0) {
    state.robotDrain = (state.robotDrain ?? 0) + robots * ROBOT_FUEL_PER_DAY
    while (state.robotDrain >= 1 && state.ship.fuel > 0) {
      state.ship.fuel--
      state.robotDrain--
    }
    if (state.ship.fuel <= 0) state.robotDrain = 0
  }

  // The engineering watch patches hull plate as a matter of routine.
  const patched = Math.min(crewRepairPerDay(state), maxHull(state.ship) - state.ship.hull)
  if (patched > 0) state.ship.hull += patched

  // A station nobody is really minding is where the day goes wrong.
  if (!rng) return null
  const incident = rollCrewIncident(state, rng)
  if (incident) pushLog(state, incident.bodyKey, incident.params)
  return incident
}

// --- Losing the ship ---------------------------------------------------------
/**
 * The ship is gone and the escape pod has fired: the commander comes out of it
 * in a bare Flea, the insurer pays out on the hull that was lost, and everything
 * that went down with it is written off. Returns false, changing nothing, when
 * there was no pod — that is the end of the run, and the caller's to announce.
 *
 * One function for every way to lose a ship (gunfire, a convoy run, a
 * singularity), so the three cannot settle it three different ways.
 */
export function abandonShip(state: GameState): boolean {
  if (!state.ship.escapePod) return false
  // Value the wreck *before* it is replaced: insurance must pay out on the ship
  // that was actually lost, not on the Flea handed over as a replacement.
  const payout = state.insurance ? shipValue(state.ship) : 0
  const flea = SHIP_TYPES.flea
  // The hold goes down with the ship, so the books that shadow it go too: the
  // price paid for the lost cargo, and its local-sourcing record. Every other
  // path that empties the hold (seizure, plunder, an electrical fire) clears
  // all three together, and a run lost short of port never reaches the arrival
  // that would have cleared the ledger.
  state.buyingPrice = emptyGoods()
  state.sourcedHere = emptyGoods()
  // A pod seats one. Anyone travelling under contract is taken off by the
  // rescue tender and the contract lapses unpaid — there is no cabin left to
  // carry them in, and no berth in the replacement to offer them.
  for (const q of state.quests.filter((x) => x.status === 'active' && x.type === 'passenger')) {
    pushLog(state, 'quest.passengerLost', { passenger: q.passengerName ?? '' })
  }
  state.quests = state.quests.filter((x) => !(x.status === 'active' && x.type === 'passenger'))
  state.ship = {
    type: 'flea',
    hull: flea.hullStrength,
    hullUpgrades: 0,
    fuel: flea.fuelTanks,
    cargo: emptyGoods(),
    weapons: [],
    shields: [],
    shieldPoints: [],
    gadgets: [],
    crew: [],
    robots: [],
    escapePod: false
  }
  // The policy covered the hull that was lost, and ends with the claim: the
  // replacement has no pod, and the bank insures nothing without one.
  if (state.insurance) {
    state.insurance = false
    state.noClaim = 0
    state.credits += payout
    pushLog(state, 'log.insurancePaid', { amount: payout })
  }
  pushLog(state, 'encounter.escapePod')
  return true
}

// --- Result helpers ----------------------------------------------------------
function fail(error: string): ActionResult {
  return { ok: false, error }
}
function okInfo(key: string, params?: Record<string, string | number>): ActionResult {
  return { ok: true, info: { key, params } }
}
