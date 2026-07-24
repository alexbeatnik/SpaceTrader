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
import { refreshMarket } from './market'
import { SHIP_TYPES } from '../data/ships'
import { GOOD_IDS } from '../data/goods'
import {
  WEAPONS,
  SHIELDS,
  GADGETS,
  EXTRA_CARGO_BAYS,
  EXTRA_FUEL_TANKS
} from '../data/equipment'
import { MERCENARIES } from '../data/mercenaries'
import { ROBOTS } from '../data/robots'
import { economyOf } from '../data/economies'
import {
  assignRoles,
  crewHands,
  crewRepairPerDay,
  rollCrewIncident,
  shipRobots,
  ROBOT_FUEL_PER_DAY,
  type CrewIncident
} from './crew'
import { emptyGoods, noteLocalSourcing, releaseLocalSourcing } from './sourcing'

// The local-sourcing ledger lives in its own module (`crew.ts` needs it too and
// cannot import this one), but stays part of this module's public surface.
export {
  noteLocalSourcing,
  clearLocalSourcing,
  releaseLocalSourcing,
  deliverableUnits
} from './sourcing'

export const GAME_VERSION = 1
export const STARTING_CREDITS = 1000
export const MAX_SKILL = 10
/** Extra max-hull points granted per reinforced-hull upgrade. */
export const HULL_UPGRADE_AMOUNT = 25
/** Maximum reinforced-hull upgrades a ship may carry. */
export const MAX_HULL_UPGRADES = 5
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
  return base + extra
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

/** Maximum fuel capacity including fuelCompactor gadgets and the explorer perk. */
export function maxFuel(ship: Ship): number {
  const type = SHIP_TYPES[ship.type]
  const extra = ship.gadgets.filter((g) => g === 'fuelCompactor').length * EXTRA_FUEL_TANKS
  const classBonus = type.shipClass === 'explorer' ? EXPLORER_RANGE_BONUS : 0
  return type.fuelTanks + extra + classBonus
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
  return Math.min(0.1, effectiveSkills(state).trader * 0.01)
}

/**
 * What a unit of `good` actually costs here, after the Trader-skill discount —
 * the figure the market screen must quote, or it bills the player one price and
 * charges another.
 */
export function marketBuyPrice(state: GameState, good: GoodId): number {
  const listed = currentSystem(state).buyPrice[good]
  if (listed <= 0) return 0
  return Math.max(1, Math.round(listed * (1 - traderDiscount(state))))
}

export function buyGood(state: GameState, good: GoodId, amount: number): ActionResult {
  const sys = currentSystem(state)
  const price = sys.buyPrice[good]
  if (price <= 0 || sys.qty[good] <= 0) return fail('error.notSold')

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
  const unit = fuelPricePerParsec(state)
  const needed = Math.min(parsecs, maxFuel(state.ship) - state.ship.fuel)
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

export function repair(state: GameState, units: number): ActionResult {
  const type = SHIP_TYPES[state.ship.type]
  const needed = Math.min(units, maxHull(state.ship) - state.ship.hull)
  if (needed <= 0) return fail('error.hullFull')
  const affordable = Math.floor(state.credits / type.repairCostPerUnit)
  const fix = Math.min(needed, affordable)
  if (fix <= 0) return fail('error.noCreditsRepair')
  state.ship.hull += fix
  state.credits -= fix * type.repairCostPerUnit
  return okInfo('info.repaired', { units: fix, cost: fix * type.repairCostPerUnit })
}

export function repairFull(state: GameState): ActionResult {
  return repair(state, maxHull(state.ship))
}

/** Install a reinforced-hull upgrade: raises max hull and current hull. */
export function buyHullUpgrade(state: GameState): ActionResult {
  const ship = state.ship
  const current = ship.hullUpgrades ?? 0
  if (current >= MAX_HULL_UPGRADES) return fail('error.maxHullUpgrades')
  const price = hullUpgradePrice(ship)
  if (state.credits < price) return fail('error.notEnoughCredits')
  state.credits -= price
  ship.hullUpgrades = current + 1
  ship.hull += HULL_UPGRADE_AMOUNT
  return okInfo('info.hullUpgraded', { amount: HULL_UPGRADE_AMOUNT, cost: price })
}

// --- Equipment purchases -----------------------------------------------------
function traderPrice(state: GameState, base: number): number {
  return Math.round(base * (1 - traderDiscount(state)))
}

export function buyWeapon(state: GameState, id: WeaponId): ActionResult {
  const type = SHIP_TYPES[state.ship.type]
  if (state.ship.weapons.length >= type.weaponSlots) return fail('error.noWeaponSlot')
  const price = traderPrice(state, WEAPONS[id].price)
  if (state.credits < price) return fail('error.notEnoughCredits')
  state.credits -= price
  state.ship.weapons.push(id)
  return okInfo('info.equipmentBought')
}

export function buyShield(state: GameState, id: ShieldId): ActionResult {
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
  const type = SHIP_TYPES[state.ship.type]
  if (state.ship.gadgets.length >= type.gadgetSlots) return fail('error.noGadgetSlot')
  if (id !== 'cargoBays' && state.ship.gadgets.includes(id)) return fail('error.alreadyOwned')
  const price = traderPrice(state, GADGETS[id].price)
  if (state.credits < price) return fail('error.notEnoughCredits')
  state.credits -= price
  state.ship.gadgets.push(id)
  return okInfo('info.equipmentBought')
}

export function buyEscapePod(state: GameState): ActionResult {
  if (state.ship.escapePod) return fail('error.alreadyOwned')
  if (state.credits < ESCAPE_POD_PRICE) return fail('error.notEnoughCredits')
  state.credits -= ESCAPE_POD_PRICE
  state.ship.escapePod = true
  return okInfo('info.escapePodBought')
}

/** Buy a new ship, trading in the old hull + equipment (cargo must be empty). */
export function buyShip(state: GameState, target: ShipTypeId): ActionResult {
  if (target === state.ship.type) return fail('error.sameShip')
  if (usedCargoBays(state.ship) > 0) return fail('error.cargoNotEmpty')

  const price = traderPrice(state, SHIP_TYPES[target].price)
  const tradeIn = shipValue(state.ship)
  const net = price - tradeIn
  if (state.credits < net) return fail('error.notEnoughCredits')

  const keepPod = state.ship.escapePod
  // The crew comes across with you, as far as the new hull has berths for
  // them — being dumped back to a solo watch on a bigger ship would be absurd.
  const berths = SHIP_TYPES[target].crewQuarters - 1
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
  const id = state.ship.weapons[index]
  if (!id) return fail('error.nothingToRemove')
  state.ship.weapons.splice(index, 1)
  state.credits += Math.round(WEAPONS[id].price * 0.75)
  return okInfo('info.equipmentSold')
}

export function sellShield(state: GameState, index: number): ActionResult {
  const id = state.ship.shields[index]
  if (!id) return fail('error.nothingToRemove')
  state.ship.shields.splice(index, 1)
  state.ship.shieldPoints.splice(index, 1)
  state.credits += Math.round(SHIELDS[id].price * 0.75)
  return okInfo('info.equipmentSold')
}

export function sellGadget(state: GameState, index: number): ActionResult {
  const id = state.ship.gadgets[index]
  if (!id) return fail('error.nothingToRemove')
  // Removing extra cargo bays is refused if the hold would overflow.
  if (id === 'cargoBays' && usedCargoBays(state.ship) > totalCargoBays(state.ship) - EXTRA_CARGO_BAYS) {
    return fail('error.cargoNotEmpty')
  }
  state.ship.gadgets.splice(index, 1)
  state.credits += Math.round(GADGETS[id].price * 0.75)
  return okInfo('info.equipmentSold')
}

// --- Crew / mercenaries ------------------------------------------------------
export function hireMercenary(state: GameState, id: string): ActionResult {
  const sys = currentSystem(state)
  const roster = sys.mercenaryIds ?? []
  if (!roster.includes(id) || !MERCENARIES[id]) return fail('error.mercNotHere')
  if (freeQuarters(state.ship) <= 0) return fail('error.noQuarters')
  if (state.ship.crew.includes(id)) return fail('error.alreadyHired')
  state.ship.crew.push(id)
  sys.mercenaryIds = roster.filter((m) => m !== id)
  return okInfo('info.mercHired', { name: id })
}

export function fireMercenary(state: GameState, id: string): ActionResult {
  const idx = state.ship.crew.indexOf(id)
  if (idx < 0) return fail('error.notInCrew')
  state.ship.crew.splice(idx, 1)
  // A dismissed hand goes back into the local hiring hall.
  const sys = currentSystem(state)
  sys.mercenaryIds = [...(sys.mercenaryIds ?? []), id]
  return okInfo('info.mercFired', { name: id })
}

// --- Robots ------------------------------------------------------------------
/** Robot models a shipyard at the current system will sell. */
export function robotsForSale(state: GameState): string[] {
  const tech = currentSystem(state).techLevel
  return Object.keys(ROBOTS).filter((id) => ROBOTS[id].minTechLevel <= tech)
}

/** Buy an android crew member. No wages, but it draws fuel every day. */
export function buyRobot(state: GameState, id: string): ActionResult {
  const robot = ROBOTS[id]
  if (!robot) return fail('error.robotNotHere')
  if (!robotsForSale(state).includes(id)) return fail('error.robotNotHere')
  if (freeQuarters(state.ship) <= 0) return fail('error.noQuarters')
  const price = traderPrice(state, robot.price)
  if (state.credits < price) return fail('error.notEnoughCredits')
  state.credits -= price
  state.ship.robots = [...(state.ship.robots ?? []), id]
  return okInfo('info.robotBought', { robot: id, cost: price })
}

/** Sell a robot back at the usual 75% of list. */
export function sellRobot(state: GameState, index: number): ActionResult {
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
  const available = maxLoan(state) - state.debt
  const take = Math.min(amount, available)
  if (take <= 0) return fail('error.noLoanAvailable')
  state.debt += take
  state.credits += take
  return okInfo('info.loanTaken', { amount: take })
}

export function payDebt(state: GameState, amount: number): ActionResult {
  const pay = Math.min(amount, state.debt, state.credits)
  if (pay <= 0) return fail('error.nothingToPay')
  state.debt -= pay
  state.credits -= pay
  return okInfo('info.debtPaid', { amount: pay })
}

export function buyInsurance(state: GameState): ActionResult {
  if (!state.ship.escapePod) return fail('error.needEscapePod')
  if (state.insurance) return fail('error.alreadyInsured')
  state.insurance = true
  state.noClaim = 0
  return okInfo('info.insuranceBought')
}

export function cancelInsurance(state: GameState): ActionResult {
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

// --- Result helpers ----------------------------------------------------------
function fail(error: string): ActionResult {
  return { ok: false, error }
}
function okInfo(key: string, params?: Record<string, string | number>): ActionResult {
  return { ok: true, info: { key, params } }
}
