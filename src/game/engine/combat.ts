import type { GameState, GoodId, ShipTypeId, WeaponId, ShieldId } from './types'
import { Rng } from './rng'
import { SHIP_TYPES, sizeRank } from '../data/ships'
import { WEAPONS, SHIELDS } from '../data/equipment'
import { GOOD_IDS, TRADE_GOODS } from '../data/goods'
import { POLITICS } from '../data/politics'
import {
  effectiveSkills,
  weaponPower,
  freeCargoBays,
  usedCargoBays,
  totalCargoBays,
  maxHull,
  pushLog,
  releaseLocalSourcing,
  type ActionResult
} from './game'
import { battleStations } from './crew'
import { completeBounty } from './quests'
import {
  applyKarma,
  hunterChance,
  hunterEmployer,
  notoriety,
  serveSentence,
  standing,
  wantedByBank
} from './reputation'

export type EncounterKind = 'trader' | 'pirate' | 'police' | 'bountyHunter' | 'alien'

export type EncounterStatus =
  | 'ongoing'
  | 'playerFled'
  | 'oppFled'
  | 'oppDestroyed'
  | 'playerDestroyed'
  | 'oppSurrendered'
  | 'playerSurrendered'
  | 'playerArrested'
  | 'inspected'
  | 'ignored'
  | 'bribed'

/** Damage multiplier when a shot lands as a critical strike. */
export const CRIT_MULTIPLIER = 2
/** Accuracy a shooter gains against a ship pinned in a tractor beam. */
export const TRACTOR_ACCURACY_BONUS = 0.15

/**
 * Engagement range, in kilometres.
 *
 * Every ship in a group closes on its own line, so a pack arrives spread out
 * rather than in a rank: the nearest is the easy shot and the stragglers are the
 * safe ones, which is what makes picking a target a decision instead of a
 * formality. Range costs accuracy — nothing inside `POINT_BLANK_RANGE`, up to
 * `RANGE_ACCURACY_PENALTY` at the far end — and it costs it *symmetrically*: a
 * shot you can barely make is one they can barely make back.
 */
export const POINT_BLANK_RANGE = 6
export const MAX_ENGAGEMENT_RANGE = 40
export const RANGE_ACCURACY_PENALTY = 0.3
/** How far one helm manoeuvre moves the engaged pair, in km. */
export const RANGE_MANOEUVRE_STEP = 7

export interface Opponent {
  kind: EncounterKind
  shipType: ShipTypeId
  hull: number
  maxHull: number
  shieldPoints: number
  maxShield: number
  weaponPower: number
  pilot: number
  fighter: number
  cargo: Record<GoodId, number>
  fleeing: boolean
  /**
   * How far off this ship is, in km — rolled when the group is built, and closed
   * a little every round it and the player trade fire.
   */
  distance: number
}

/** A trader's willingness to deal: what it sells to, and buys from, the player. */
export interface TradeOffer {
  /** Goods the trader offers for sale, with a unit price and remaining stock. */
  sells: Partial<Record<GoodId, { price: number; qty: number }>>
  /** Goods the trader will buy from the player, with the unit price it pays. */
  buys: Partial<Record<GoodId, number>>
}

/** A combat-log line: an i18n key plus its interpolation params. */
export interface EncounterMessage {
  key: string
  params?: Record<string, string | number>
}

export interface Encounter {
  kind: EncounterKind
  /** The ship currently engaged. */
  opponent: Opponent
  /** Other ships in the group waiting to engage after the current one. */
  reserves: Opponent[]
  /** Total ships in the encounter (1 = a lone ship). */
  fleetSize: number
  /** How many ships have been destroyed / dealt with so far. */
  defeated: number
  /**
   * The hulls already out of the fight, in the order they went down. `defeated`
   * counts them; this remembers *what* they were, so the group can be drawn as
   * the ships it is made of rather than as a tally.
   */
  downed: ShipTypeId[]
  status: EncounterStatus
  /**
   * Actions the player has left before the other side gets its turn, and the
   * budget they are drawn from. Both come from `battleStations` — the crew is
   * what buys a ship the room to close *and* shoot in one exchange.
   */
  actionsLeft: number
  actionsPerRound: number
  /**
   * Counts every action resolved, not every exchange: the store seeds each
   * roll off `seed ^ round`, so it has to move for a second volley in the same
   * turn to roll different dice from the first.
   */
  round: number
  /**
   * Seed for this encounter's dice, drawn from the galaxy's own rng when the
   * encounter is built. Rounds are resolved with `seed ^ round`, so two fights
   * on one leg no longer roll an identical sequence just because they share a
   * day and a round number. Not persisted — an encounter never outlives a save.
   */
  seed: number
  bribeCost: number
  /** Set while a tractor beam pins the player's ship — no escape until broken. */
  tractorLocked?: boolean
  /** A demand on the table: hand over the cargo, or stand down for arrest. */
  demand?: 'cargo' | 'arrest'
  /** Bounty hunters only: who is paying for the player's head. */
  hiredBy?: 'law' | 'bank'
  /** Set when this pirate is a bounty target from an active quest. */
  bountyQuestId?: string
  bountyName?: string
  /** Trader-only: random goods/prices the player can trade with. */
  trade?: TradeOffer
  /** Rounds log keyed for i18n. */
  messages: EncounterMessage[]
}

export type CombatAction =
  | 'attack'
  | 'closeIn'
  | 'openRange'
  | 'endTurn'
  | 'flee'
  | 'submit' // police inspection
  | 'bribe'
  | 'surrender'
  | 'ignore'
  | 'plunder'

// --- Encounter generation ----------------------------------------------------
/**
 * Roll for an encounter during a warp. Returns null for an uneventful leg.
 */
export function rollEncounter(state: GameState, rng: Rng): Encounter | null {
  const dest = state.systems[state.currentSystem]
  const gov = POLITICS[dest.politics]

  // A rare, roaming alien raider can appear anywhere in deep space.
  if (rng.chance(0.015)) return makeEncounter('alien', state, rng)

  // Hired hunters come for the notorious and for bank debtors alike.
  const pHunter = hunterChance(state)
  if (pHunter > 0 && rng.chance(pHunter)) {
    return makeEncounter('bountyHunter', state, rng, hunterEmployer(state, rng))
  }

  // Base probabilities derived from government strengths.
  const pPirate = pirateEncounterChance(state, gov.strengthPirates * 0.03)
  const pPolice = gov.strengthPolice * 0.025
  const pTrader = gov.strengthTraders * 0.02
  const roll = rng.next()

  if (roll < pPirate) return makeEncounter('pirate', state, rng)
  if (roll < pPirate + pPolice) return makeEncounter('police', state, rng)
  if (roll < pPirate + pPolice + pTrader) return makeEncounter('trader', state, rng)
  return null
}

/**
 * Threat level (0..5) an opponent scales to. Grows with the player's wealth and
 * combat reputation; for the police it also grows with how wanted the player is.
 */
function threatLevel(kind: EncounterKind, state: GameState): number {
  // Aliens are always a top-tier threat regardless of the player's standing.
  if (kind === 'alien') return 5
  let worth = state.credits + Math.max(0, state.record.reputation) * 120
  if (kind === 'police') worth += notoriety(state) * 6000
  // Bounty hunters come better-equipped the bigger the payday on your head:
  // the law pays by notoriety, the bank by the size of the unpaid loan.
  if (kind === 'bountyHunter') {
    worth += notoriety(state) * 9000 + (wantedByBank(state) ? state.debt : 0)
  }
  if (kind === 'pirate') worth += pirateCargoValue(state)
  if (worth > 150000) return 5
  if (worth > 80000) return 4
  if (worth > 40000) return 3
  if (worth > 15000) return 2
  if (worth > 5000) return 1
  return 0
}

/** Base-price value of the cargo currently visible to a would-be pirate. */
export function pirateCargoValue(state: GameState): number {
  return GOOD_IDS.reduce((total, good) => total + state.ship.cargo[good] * TRADE_GOODS[good].basePrice, 0)
}

/** Extra pirate chance caused by cargo, capped to keep encounters non-certain. */
export function pirateCargoChance(state: GameState): number {
  const quantityRisk = Math.min(0.12, (usedCargoBays(state.ship) / totalCargoBays(state.ship)) * 0.12)
  const valueRisk = Math.min(0.28, (pirateCargoValue(state) / 50000) * 0.28)
  return quantityRisk + valueRisk
}

/** Add cargo risk to an encounter's base pirate probability. */
export function pirateEncounterChance(state: GameState, baseChance: number): number {
  return Math.min(0.95, Math.max(0, baseChance) + pirateCargoChance(state))
}

function shipForThreat(threat: number): ShipTypeId {
  return (['gnat', 'firefly', 'mantis', 'hornet', 'scorpion', 'widow'] as ShipTypeId[])[threat]
}

/** Build a single opponent ship of the given kind and threat level. */
function makeOpponent(kind: EncounterKind, rng: Rng, threat: number): Opponent {
  const shipType =
    kind === 'trader'
      ? rng.pick(['flea', 'gnat', 'locust', 'firefly', 'beetle', 'centipede'] as ShipTypeId[])
      : kind === 'alien'
        ? rng.pick(['scorpion', 'widow'] as ShipTypeId[])
        : kind === 'bountyHunter'
          ? rng.pick(['mantis', 'hornet', 'scorpion'] as ShipTypeId[])
          : shipForThreat(threat)
  const type = SHIP_TYPES[shipType]

  // Higher-threat opponents field better shields and weapons.
  const shieldTier: ShieldId = threat >= 4 ? 'reflective' : 'energy'
  const oppShields = type.shieldSlots > 0 ? SHIELDS[shieldTier].power * Math.min(type.shieldSlots, 2) : 0
  const weaponTier: WeaponId =
    kind === 'alien' ? 'fusion' : threat >= 4 ? 'military' : threat >= 2 ? 'beam' : 'pulse'
  const oppWeapon =
    type.weaponSlots > 0 ? WEAPONS[weaponTier].power * Math.min(type.weaponSlots, 2) : 0

  // Loot carried (stolen goods / wares), dropped when the ship is destroyed.
  const cargo = {} as Record<GoodId, number>
  for (const g of GOOD_IDS) cargo[g] = 0
  const lootCount =
    kind === 'trader'
      ? rng.int(2, Math.min(10, type.cargoBays))
      : kind === 'pirate'
        ? rng.int(1, 6)
        : kind === 'alien'
          ? rng.int(0, 3)
          : 0 // police & bounty hunters carry nothing worth taking
  for (let i = 0; i < lootCount; i++) cargo[rng.pick(GOOD_IDS)]++

  // Aliens and bounty hunters are hardened: extra hull and sharper crews.
  const hullMul = kind === 'alien' ? 1.5 : kind === 'bountyHunter' ? 1.2 : 1
  const baseHull = Math.round(type.hullStrength * hullMul)
  const skillBonus = kind === 'alien' ? 4 : kind === 'bountyHunter' ? 2 : 0

  return {
    kind,
    shipType,
    hull: baseHull,
    maxHull: baseHull,
    shieldPoints: oppShields,
    maxShield: oppShields,
    weaponPower:
      kind === 'police' || kind === 'bountyHunter'
        ? Math.max(oppWeapon, WEAPONS.pulse.power)
        : oppWeapon,
    pilot: Math.min(13, rng.int(3, 8) + threat + skillBonus),
    fighter: Math.min(13, rng.int(3, 8) + threat + skillBonus),
    cargo,
    fleeing: false,
    distance: rng.int(POINT_BLANK_RANGE, MAX_ENGAGEMENT_RANGE)
  }
}

/** The most valuable commodity in the hold — what a pirate eyes up first. */
function richestCargo(state: GameState): GoodId | null {
  let best: GoodId | null = null
  let bestValue = 0
  for (const g of GOOD_IDS) {
    const value = state.ship.cargo[g] * TRADE_GOODS[g].basePrice
    if (value > bestValue) {
      bestValue = value
      best = g
    }
  }
  return best
}

/**
 * The opening demand a hostile makes before the shooting starts. Pirates want
 * the cargo and will let you fly on without it; hunters want you in a cell.
 */
function openingDemand(
  kind: EncounterKind,
  state: GameState,
  hiredBy: 'law' | 'bank' | undefined
): { key: string; params?: Record<string, string | number> } | null {
  if (kind === 'pirate') {
    const prize = richestCargo(state)
    if (!prize) return { key: 'encounter.pirate.demandEmpty' }
    // A hold that is more than half full is worth a friendlier offer.
    const laden = usedCargoBays(state.ship) * 2 >= totalCargoBays(state.ship)
    return {
      key: laden ? 'encounter.pirate.demandRich' : 'encounter.pirate.demandCargo',
      params: { good: prize }
    }
  }
  if (kind === 'bountyHunter') {
    return hiredBy === 'bank'
      ? { key: 'encounter.bountyHunter.demandBank', params: { debt: state.debt } }
      : {
          key: 'encounter.bountyHunter.demandLaw',
          params: { standing: `standing.${standing(state)}` }
        }
  }
  return null
}

function makeEncounter(
  kind: EncounterKind,
  state: GameState,
  rng: Rng,
  hiredBy?: 'law' | 'bank'
): Encounter {
  const threat = threatLevel(kind, state)

  // Some encounters arrive as a group: a pirate ambush or a trader caravan.
  let fleetSize = 1
  if (kind === 'pirate' && rng.chance(0.2 + threat * 0.05)) {
    fleetSize = rng.int(2, Math.min(5, 2 + threat))
  }
  else if (kind === 'trader' && rng.chance(0.3)) fleetSize = rng.int(2, 4)

  // Nearest ship first: the one that got close enough to hail you is the one you
  // are engaged with, and `engageNext` then walks the group outwards.
  const group: Opponent[] = []
  for (let i = 0; i < fleetSize; i++) group.push(makeOpponent(kind, rng, threat))
  group.sort((a, b) => a.distance - b.distance)
  const opponent = group[0]
  const reserves = group.slice(1)

  // A lone trader will deal; a caravan just passes (loot only if attacked).
  let trade: TradeOffer | undefined
  if (kind === 'trader' && fleetSize === 1) {
    trade = makeTradeOffer(rng)
    // The hold mirrors what's on offer (keeps plunder consistent with trade).
    for (const g of GOOD_IDS) {
      const s = trade.sells[g]
      if (s) opponent.cargo[g] = s.qty
    }
  }

  // Both police and bounty hunters can be bought off where officials are corruptible.
  const canBribe = kind === 'police' || kind === 'bountyHunter'
  const bribeCost =
    canBribe && POLITICS[state.systems[state.currentSystem].politics].bribeLevel > 0
      ? rng.int(100, 100 + Math.round(state.credits * 0.05))
      : 0

  const appear: { key: string; params?: Record<string, string | number> } =
    fleetSize > 1
      ? kind === 'pirate'
        ? { key: 'encounter.pirate.ambush', params: { count: fleetSize } }
        : { key: 'encounter.trader.caravan', params: { count: fleetSize } }
      : {
          key:
            kind === 'bountyHunter' && hiredBy === 'bank'
              ? 'encounter.bountyHunter.appearBank'
              : `encounter.${kind}.appear`,
          params: { ship: opponent.shipType }
        }

  // Pirates and hunters open with terms before they open fire.
  const messages = [appear]
  const demandLine = openingDemand(kind, state, hiredBy)
  if (demandLine) messages.push(demandLine)

  return {
    kind,
    opponent,
    reserves,
    fleetSize,
    defeated: 0,
    downed: [],
    status: 'ongoing',
    actionsLeft: battleStations(state).actions,
    actionsPerRound: battleStations(state).actions,
    round: 0,
    seed: rng.int(0, 0x7fffffff),
    bribeCost,
    demand: kind === 'pirate' ? 'cargo' : kind === 'bountyHunter' ? 'arrest' : undefined,
    hiredBy: kind === 'bountyHunter' ? (hiredBy ?? 'law') : undefined,
    trade,
    messages
  }
}

/** Hand the player a fresh budget of actions for the coming exchange. */
function startTurn(state: GameState, enc: Encounter): void {
  const stations = battleStations(state)
  enc.actionsPerRound = stations.actions
  enc.actionsLeft = stations.actions
}

/** Promote the next reserve ship to active; returns false if the group is spent. */
function engageNext(state: GameState, enc: Encounter): boolean {
  const next = enc.reserves.shift()
  if (!next) return false
  enc.opponent = next
  enc.status = 'ongoing'
  // A new ship in front of the guns is a new exchange, so the watch resets.
  startTurn(state, enc)
  enc.messages.push({ key: 'encounter.fleetNext', params: { remaining: enc.reserves.length + 1 } })
  return true
}

/**
 * Re-point the guns at another ship in the group: `index` is a position in
 * `reserves`, which trades places with whatever is engaged now.
 *
 * Aiming is free — it is who the guns point at, not a manoeuvre — and nobody
 * leaves the fight, so a ship left half-wrecked and picked up again later is
 * still half-wrecked. Returns false when there is nothing at that index.
 */
export function setTarget(enc: Encounter, index: number): boolean {
  if (enc.status !== 'ongoing') return false
  const chosen = enc.reserves[index]
  if (!chosen) return false
  enc.reserves[index] = enc.opponent
  enc.opponent = chosen
  enc.messages.push({ key: 'encounter.targetSwitched', params: { ship: chosen.shipType } })
  return true
}

/** Spill a destroyed ship's cargo into the player's free bays. */
function dropLoot(
  state: GameState,
  opp: Opponent,
  rng: Rng,
  msg: (k: string, p?: Record<string, string | number>) => void
): void {
  let taken = 0
  for (const g of GOOD_IDS) {
    while (opp.cargo[g] > 0 && freeCargoBays(state.ship) > 0) {
      opp.cargo[g]--
      state.ship.cargo[g]++
      taken++
    }
  }
  if (taken > 0) {
    msg('encounter.lootDropped', { qty: taken })
  } else if (rng.chance(0.4) && freeCargoBays(state.ship) > 0) {
    const g = pickLoot(opp, rng)
    if (g) {
      state.ship.cargo[g]++
      msg('encounter.salvage', { good: g })
    }
  }
}

/** Fisher–Yates shuffle using the seeded RNG (does not mutate the input). */
function shuffled<T>(arr: readonly T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Random selection of wares (with prices) a met trader will deal in. */
function makeTradeOffer(rng: Rng): TradeOffer {
  const sells: TradeOffer['sells'] = {}
  const buys: TradeOffer['buys'] = {}

  // Wares on offer: 3–6 goods, priced 0.6–1.15× their base (bargains happen).
  for (const g of shuffled(GOOD_IDS, rng).slice(0, rng.int(3, 6))) {
    const base = TRADE_GOODS[g].basePrice
    sells[g] = {
      price: Math.max(1, Math.round(base * (0.6 + rng.next() * 0.55))),
      qty: rng.int(1, 8)
    }
  }
  // Wishlist to buy from the player: 2–4 goods, paying 0.75–1.25× base.
  for (const g of shuffled(GOOD_IDS, rng).slice(0, rng.int(2, 4))) {
    const base = TRADE_GOODS[g].basePrice
    buys[g] = Math.max(1, Math.round(base * (0.75 + rng.next() * 0.5)))
  }
  return { sells, buys }
}

// --- In-encounter trading ----------------------------------------------------
/** Buy `good` from the met trader at its offered price. */
export function tradeBuy(
  state: GameState,
  enc: Encounter,
  good: GoodId,
  amount: number
): ActionResult {
  if (enc.kind !== 'trader' || enc.status !== 'ongoing' || !enc.trade) {
    return { ok: false, error: 'error.cannotBuy' }
  }
  const offer = enc.trade.sells[good]
  if (!offer || offer.qty <= 0) return { ok: false, error: 'error.notSold' }

  const unit = offer.price
  const qty = Math.min(
    amount,
    offer.qty,
    Math.floor(state.credits / unit),
    freeCargoBays(state.ship)
  )
  if (qty <= 0) return { ok: false, error: 'error.cannotBuy' }

  const cost = qty * unit
  // Weighted-average purchase price for profit tracking (as in the market).
  const prevQty = state.ship.cargo[good]
  const prevCost = state.buyingPrice[good] * prevQty
  state.ship.cargo[good] += qty
  state.buyingPrice[good] =
    state.ship.cargo[good] > 0 ? Math.round((prevCost + cost) / state.ship.cargo[good]) : 0
  state.credits -= cost
  offer.qty -= qty
  enc.opponent.cargo[good] = Math.max(0, enc.opponent.cargo[good] - qty)

  return { ok: true, info: { key: 'info.bought', params: { qty, good, cost } } }
}

/** Sell `good` to the met trader at the price it is willing to pay. */
export function tradeSell(
  state: GameState,
  enc: Encounter,
  good: GoodId,
  amount: number
): ActionResult {
  if (enc.kind !== 'trader' || enc.status !== 'ongoing' || !enc.trade) {
    return { ok: false, error: 'error.notWanted' }
  }
  const unit = enc.trade.buys[good]
  if (!unit || unit <= 0) return { ok: false, error: 'error.notWanted' }

  const have = state.ship.cargo[good]
  if (have <= 0) return { ok: false, error: 'error.nothingToSell' }
  if (amount <= 0) return { ok: false, error: 'error.nothingToSell' }

  const qty = Math.min(amount, have)
  const revenue = qty * unit
  state.ship.cargo[good] -= qty
  state.credits += revenue
  releaseLocalSourcing(state, good, qty)
  if (state.ship.cargo[good] === 0) state.buyingPrice[good] = 0
  enc.opponent.cargo[good] = (enc.opponent.cargo[good] ?? 0) + qty

  return { ok: true, info: { key: 'info.sold', params: { qty, good, revenue } } }
}

/** Spawn a pirate encounter (e.g. raiders that jump a mining operation). */
export function spawnPirates(state: GameState, rng: Rng): Encounter {
  return makeEncounter('pirate', state, rng)
}

/**
 * Spawn an encounter of a given kind, for flows that pick the opposition
 * themselves rather than rolling for it (convoy escort duty, scripted events).
 */
export function spawnEncounter(
  kind: EncounterKind,
  state: GameState,
  rng: Rng,
  hiredBy?: 'law' | 'bank'
): Encounter {
  return makeEncounter(kind, state, rng, hiredBy)
}

/** Build a tough pirate encounter for a bounty quest target. */
export function createBountyEncounter(
  state: GameState,
  questId: string,
  bountyName: string,
  rng: Rng
): Encounter {
  const enc = makeEncounter('pirate', state, rng)
  const type = SHIP_TYPES[enc.opponent.shipType]
  // Bounty targets are a single, notably tougher ship — not a rabble.
  enc.reserves = []
  enc.fleetSize = 1
  enc.opponent.hull = Math.round(type.hullStrength * 1.3)
  enc.opponent.maxHull = enc.opponent.hull
  enc.opponent.fighter = Math.min(12, enc.opponent.fighter + 2)
  enc.opponent.pilot = Math.min(12, enc.opponent.pilot + 2)
  enc.bountyQuestId = questId
  enc.bountyName = bountyName
  enc.messages = [{ key: 'encounter.bounty.appear', params: { bounty: bountyName } }]
  return enc
}

// --- Combat resolution -------------------------------------------------------
/** Accuracy lost to range: none at point blank, the full penalty at the far end. */
function rangePenalty(distance: number): number {
  const span = MAX_ENGAGEMENT_RANGE - POINT_BLANK_RANGE
  const over = Math.max(0, Math.min(span, distance - POINT_BLANK_RANGE))
  return (over / span) * RANGE_ACCURACY_PENALTY
}

function hitChance(
  attackerFighter: number,
  defenderPilot: number,
  distance = POINT_BLANK_RANGE
): number {
  // Logistic-ish curve based on the fighter/pilot differential, less whatever
  // the range between the two hulls costs.
  const diff = attackerFighter - defenderPilot
  return Math.min(0.95, Math.max(0.1, 0.55 + diff * 0.05 - rangePenalty(distance)))
}

/**
 * The odds the player's guns land on a given ship — the engaged one by default.
 *
 * Exported because the combat screen quotes it before the player commits, and
 * the number shown has to be the number the dice are rolled against: the same
 * function feeds both, so they cannot drift.
 */
export function playerHitChance(
  state: GameState,
  enc: Encounter,
  target: Opponent = enc.opponent
): number {
  return hitChance(effectiveSkills(state).fighter, target.pilot, target.distance)
}

/** The odds the engaged ship lands a shot on the player, tractor lock included. */
export function opponentHitChance(state: GameState, enc: Encounter): number {
  const opp = enc.opponent
  const raw = hitChance(opp.fighter, effectiveSkills(state).pilot, opp.distance)
  return Math.min(0.95, raw + (enc.tractorLocked ? TRACTOR_ACCURACY_BONUS : 0))
}

/** Chance a landed hit finds a weak point and doubles its damage. */
function critChance(attackerFighter: number, hasTargeting: boolean): number {
  return Math.min(0.4, 0.05 + attackerFighter * 0.015 + (hasTargeting ? 0.08 : 0))
}

/** What a single volley did, so the log can narrate shields and hull separately. */
interface DamageReport {
  /** Damage soaked by shields. */
  absorbed: number
  /** Damage that got through to the hull. */
  hullDamage: number
  /** True when this volley collapsed the last of the shields. */
  shieldsDown: boolean
}

function applyDamage(
  target: { hull: number; shieldPoints: number },
  amount: number
): DamageReport {
  if (amount <= 0) return { absorbed: 0, hullDamage: 0, shieldsDown: false }
  const hadShields = target.shieldPoints > 0
  const absorbed = Math.min(target.shieldPoints, amount)
  target.shieldPoints -= absorbed
  const hullDamage = amount - absorbed
  target.hull = Math.max(0, target.hull - hullDamage)
  return { absorbed, hullDamage, shieldsDown: hadShields && target.shieldPoints === 0 }
}

/**
 * Chance the group gets a tractor lock on the player. Only heavier hulls can
 * tow: a lone ship needs to dwarf its quarry, but a pack only needs an edge —
 * each extra hull adds another emitter to the net. A sharp pilot slips it.
 */
export function tractorChance(state: GameState, enc: Encounter): number {
  // Traders have no interest in towing anyone, and neither do the police.
  if (enc.kind === 'trader' || enc.kind === 'police') return 0
  const mine = sizeRank(state.ship.type)
  const ships = [enc.opponent, ...enc.reserves]
  const gap = Math.max(...ships.map((o) => sizeRank(o.shipType))) - mine
  if (gap <= 0) return 0
  if (ships.length < 2 && gap < 2) return 0
  const raw = gap * 0.12 + (ships.length - 1) * 0.06 - effectiveSkills(state).pilot * 0.01
  return Math.max(0, Math.min(0.5, raw))
}

/** Chance of shaking off a tractor lock: engineering first, piloting second. */
function breakLockChance(state: GameState, enc: Encounter): number {
  const skills = effectiveSkills(state)
  const gap = Math.max(0, sizeRank(enc.opponent.shipType) - sizeRank(state.ship.type))
  const raw = 0.15 + skills.engineer * 0.03 + skills.pilot * 0.02 - gap * 0.05
  return Math.max(0.05, Math.min(0.8, raw))
}

/**
 * Chance of breaking off the engagement. A small hull runs rings around a
 * heavy one; a laden freighter struggles to shake something nimble.
 */
export function fleeChance(state: GameState, enc: Encounter, pilot: number): number {
  const sizeEdge = (sizeRank(enc.opponent.shipType) - sizeRank(state.ship.type)) * 0.1
  const raw = hitChance(pilot, enc.opponent.fighter) + sizeEdge
  return Math.max(0.05, Math.min(0.95, raw))
}

export interface CombatContext {
  addMessage: (key: string, params?: Record<string, string | number>) => void
}

/**
 * Resolve one player action, and the other side's reply once the player's
 * actions for this exchange are spent. Mutates state and encounter in place.
 *
 * A round is no longer one action: `battleStations` decides how many the crew
 * can take — closing the range *and* firing, or firing twice at two different
 * ships — and only when the last one is spent (or the player calls `endTurn`)
 * does the opponent shoot back. Anything that ends the engagement outright —
 * fleeing, surrendering, a bribe, an inspection — ignores the budget and
 * resolves on the spot.
 */
export function resolveRound(
  state: GameState,
  enc: Encounter,
  action: CombatAction,
  rng: Rng
): void {
  if (enc.status !== 'ongoing') return
  enc.round++
  const skills = effectiveSkills(state)
  const opp = enc.opponent
  const playerWeapon = weaponPower(state.ship)

  const msg = (key: string, params?: Record<string, string | number>) =>
    enc.messages.push({ key, params })

  // --- Non-combat resolutions ---
  if (action === 'ignore') {
    enc.status = 'ignored'
    return
  }

  if (action === 'submit' && enc.kind === 'police') {
    const illegal = state.ship.cargo.firearms + state.ship.cargo.narcotics
    // A hidden compartment may conceal contraband from the inspection.
    if (illegal > 0 && state.ship.gadgets.includes('hiddenCompartment') && rng.chance(0.6)) {
      applyKarma(state, 1)
      msg('encounter.police.hidden')
      enc.status = 'inspected'
      return
    }
    if (illegal > 0) {
      // Seize it the same way a sentence does: the hold, the price paid for it
      // (or the profit column keeps quoting a cost for goods that are gone),
      // and its local-sourcing record all go together.
      for (const g of ['firearms', 'narcotics'] as const) {
        releaseLocalSourcing(state, g, state.ship.cargo[g])
        state.ship.cargo[g] = 0
        state.buyingPrice[g] = 0
      }
      const fine = 500 + illegal * 50
      state.credits = Math.max(0, state.credits - fine)
      applyKarma(state, -3)
      msg('encounter.police.impound', { fine })
      enc.status = 'inspected'
    } else {
      applyKarma(state, 1)
      msg('encounter.police.clean')
      enc.status = 'inspected'
    }
    return
  }

  if (action === 'bribe' && (enc.kind === 'police' || enc.kind === 'bountyHunter')) {
    if (enc.bribeCost <= 0) {
      msg('encounter.police.incorruptible')
      return
    }
    if (state.credits >= enc.bribeCost) {
      state.credits -= enc.bribeCost
      msg(`encounter.${enc.kind}.bribed`, { amount: enc.bribeCost })
      enc.status = 'bribed'
    } else {
      msg('error.notEnoughCredits')
    }
    return
  }

  if (action === 'surrender') {
    if (enc.kind === 'pirate') {
      // Pirates only ever wanted the cargo: they strip the hold (or extort a
      // ransom from an empty one) and let the ship go.
      let looted = 0
      for (const g of GOOD_IDS) {
        looted += state.ship.cargo[g]
        // Cargo off the ship is cargo off the local-sourcing ledger too, or the
        // hold would go on being credited with goods the pirates have taken.
        releaseLocalSourcing(state, g, state.ship.cargo[g])
        state.ship.cargo[g] = 0
        state.buyingPrice[g] = 0
      }
      if (looted === 0) {
        const extort = Math.min(state.credits, Math.round(state.credits * 0.5))
        state.credits -= extort
        msg('encounter.pirate.extort', { amount: extort })
      } else {
        msg('encounter.pirate.plundered', { qty: looted })
      }
      msg('encounter.pirate.released')
      enc.status = 'playerSurrendered'
    } else if (enc.kind === 'police') {
      const fine = Math.min(state.credits, 1000)
      state.credits -= fine
      applyKarma(state, -1)
      msg('encounter.police.arrested', { fine })
      enc.status = 'playerSurrendered'
    } else if (enc.kind === 'bountyHunter') {
      // Hunters have no use for cargo — they deliver you to a cell. Serving the
      // sentence costs days and a fine, but the record comes out clean.
      const sentence = serveSentence(state)
      msg('encounter.bountyHunter.arrested', { days: sentence.days, fine: sentence.fine })
      if (sentence.confiscated > 0) {
        msg('encounter.bountyHunter.confiscated', { qty: sentence.confiscated })
      }
      enc.status = 'playerArrested'
    }
    // Aliens do not take surrender.
    return
  }

  if (action === 'plunder' && enc.status === 'ongoing' && opp.hull <= 0) {
    return
  }

  // --- Fleeing ---
  if (action === 'flee') {
    // Heavier hulls hunting in a pack can pin a small ship in a tractor beam.
    if (!enc.tractorLocked && rng.chance(tractorChance(state, enc))) {
      enc.tractorLocked = true
      msg('encounter.tractor.locked')
    }

    if (enc.tractorLocked) {
      if (rng.chance(breakLockChance(state, enc))) {
        // Free again — and the run can still be made this round.
        enc.tractorLocked = false
        msg('encounter.tractor.broke')
      } else {
        // Held fast: the round is spent, and a pinned target is an easy shot.
        msg('encounter.tractor.held')
        if (opp.weaponPower > 0) {
          if (rng.chance(opponentHitChance(state, enc))) {
            dealDamageToPlayer(state, opp, rng, msg)
          } else {
            msg('encounter.oppMiss')
          }
        }
        checkPlayerDestroyed(state, enc, msg)
        if (enc.status === 'ongoing') startTurn(state, enc)
        return
      }
    }

    // Opponent gets a parting shot if it can attack.
    if (opp.weaponPower > 0 && !opp.fleeing) {
      if (rng.chance(opponentHitChance(state, enc))) {
        dealDamageToPlayer(state, opp, rng, msg)
      }
    }
    if (rng.chance(fleeChance(state, enc, skills.pilot))) {
      enc.status = 'playerFled'
      msg('encounter.fledSuccess')
    } else {
      msg('encounter.fledFail')
    }
    checkPlayerDestroyed(state, enc, msg)
    // A run that failed cost the whole turn: the ship was manoeuvring, not
    // fighting, so nobody got a shot off but the one taking the parting shot.
    if (enc.status === 'ongoing') startTurn(state, enc)
    return
  }

  // --- Manoeuvring ---
  // The helm changes the range. Closing buys accuracy for both sides; opening
  // costs it for both, which is how a wounded ship backs out of a knife fight.
  if (action === 'closeIn' || action === 'openRange') {
    const before = opp.distance
    opp.distance =
      action === 'closeIn'
        ? Math.max(POINT_BLANK_RANGE, opp.distance - RANGE_MANOEUVRE_STEP)
        : Math.min(MAX_ENGAGEMENT_RANGE, opp.distance + RANGE_MANOEUVRE_STEP)
    if (opp.distance === before) {
      msg(action === 'closeIn' ? 'encounter.range.atPointBlank' : 'encounter.range.atMax', {
        distance: opp.distance
      })
    } else {
      msg(action === 'closeIn' ? 'encounter.range.closed' : 'encounter.range.opened', {
        distance: opp.distance
      })
    }
  }

  // --- Attack ---
  if (action === 'attack') {
    if (playerWeapon <= 0) {
      msg('encounter.noWeapons')
    } else if (rng.chance(playerHitChance(state, enc))) {
      let dmg = playerWeapon + rng.int(0, Math.round(playerWeapon * 0.3))
      const fireControl =
        state.ship.gadgets.includes('targeting') || state.ship.gadgets.includes('battleComputer')
      const crit = rng.chance(critChance(skills.fighter, fireControl))
      if (crit) dmg = Math.round(dmg * CRIT_MULTIPLIER)
      const hit = applyDamage(opp, dmg)
      msg(crit ? 'encounter.playerCrit' : 'encounter.playerHit', { dmg })
      if (hit.shieldsDown) msg('encounter.oppShieldDown')
      else if (hit.hullDamage === 0 && hit.absorbed > 0) {
        msg('encounter.oppShieldsHeld', { absorbed: hit.absorbed })
      }
      if (opp.hull > 0 && opp.hull <= opp.maxHull * 0.25) msg('encounter.oppCrippled')
    } else {
      msg('encounter.playerMiss')
    }

    if (opp.hull <= 0) {
      state.record.reputation += 1
      if (enc.kind === 'pirate') applyKarma(state, 1)
      if (enc.kind === 'police') applyKarma(state, -5)
      if (enc.kind === 'bountyHunter') {
        state.record.reputation += 2
        // Gunning down a licensed hunter is itself a mark on the record.
        if (enc.hiredBy !== 'bank') applyKarma(state, -1)
      }
      if (enc.kind === 'alien') state.record.reputation += 3
      // Bounty target destroyed -> complete the quest and pay out.
      if (enc.bountyQuestId) {
        const q = completeBounty(state, enc.bountyQuestId)
        if (q) msg('encounter.bounty.done', { bounty: enc.bountyName ?? '', reward: q.reward })
      }
      // The wreck spills its cargo into your hold.
      dropLoot(state, opp, rng, msg)
      enc.defeated++
      enc.downed.push(opp.shipType)
      msg('encounter.oppDestroyed')
      // Another ship in the group steps up, if any remain.
      if (!engageNext(state, enc)) enc.status = 'oppDestroyed'
      return
    }

    // Opponent may surrender if badly hurt (traders & pirates only; hunters and
    // aliens fight to the end).
    if (
      (enc.kind === 'trader' || enc.kind === 'pirate') &&
      opp.hull < opp.maxHull * 0.3 &&
      rng.chance(0.3)
    ) {
      enc.status = 'oppSurrendered'
      msg('encounter.oppSurrendered')
      return
    }
  }

  // --- End of the player's phase ---
  // Every action but `endTurn` costs one; while any are left the other side is
  // still waiting, so the player can close the range and *then* fire, or put two
  // volleys into two different ships.
  if (action !== 'endTurn') {
    enc.actionsLeft = Math.max(0, enc.actionsLeft - 1)
    if (enc.actionsLeft > 0) return
  }

  // --- Opponent's turn (attacks back unless a trader who won't provoke) ---
  const oppWillFight =
    enc.kind === 'pirate' ||
    enc.kind === 'police' ||
    enc.kind === 'bountyHunter' ||
    enc.kind === 'alien' ||
    (enc.kind === 'trader' && action === 'attack')

  if (oppWillFight && opp.weaponPower > 0) {
    // A ship held in a tractor beam is a far easier target.
    if (rng.chance(opponentHitChance(state, enc))) {
      dealDamageToPlayer(state, opp, rng, msg)
    } else {
      msg('encounter.oppMiss')
    }
  }

  // A wounded quarry gets invited to give up rather than be blown apart.
  if (
    (enc.kind === 'pirate' || enc.kind === 'bountyHunter') &&
    state.ship.hull > 0 &&
    state.ship.hull <= maxHull(state.ship) * 0.35 &&
    rng.chance(0.4)
  ) {
    msg(`encounter.${enc.kind}.pressSurrender`)
  }

  checkPlayerDestroyed(state, enc, msg)
  // Their turn is over: the watch stands to again.
  if (enc.status === 'ongoing') startTurn(state, enc)
}

function dealDamageToPlayer(
  state: GameState,
  opp: Opponent,
  rng: Rng,
  msg: (k: string, p?: Record<string, string | number>) => void
): void {
  const power = opp.weaponPower
  let dmg = power + rng.int(0, Math.round(power * 0.3))
  const crit = rng.chance(critChance(opp.fighter, false))
  if (crit) dmg = Math.round(dmg * CRIT_MULTIPLIER)

  // Distribute across shields then hull.
  const hadShields = state.ship.shieldPoints.some((p) => p > 0)
  let remaining = dmg
  for (let i = 0; i < state.ship.shieldPoints.length && remaining > 0; i++) {
    const absorbed = Math.min(state.ship.shieldPoints[i], remaining)
    state.ship.shieldPoints[i] -= absorbed
    remaining -= absorbed
  }
  if (remaining > 0) state.ship.hull = Math.max(0, state.ship.hull - remaining)

  msg(crit ? 'encounter.oppCrit' : 'encounter.oppHit', { dmg })
  const shieldsDown = hadShields && state.ship.shieldPoints.every((p) => p <= 0)
  if (shieldsDown) msg('encounter.playerShieldDown')
  else if (remaining === 0 && dmg > 0) msg('encounter.playerShieldsHeld', { absorbed: dmg })
  if (state.ship.hull > 0 && state.ship.hull <= maxHull(state.ship) * 0.25) {
    msg('encounter.playerCrippled')
  }
}

function checkPlayerDestroyed(
  state: GameState,
  enc: Encounter,
  msg: (k: string, p?: Record<string, string | number>) => void
): void {
  if (state.ship.hull <= 0) {
    if (state.ship.escapePod) {
      msg('encounter.escapePod')
      enc.status = 'playerDestroyed'
    } else {
      msg('encounter.playerDestroyed')
      enc.status = 'playerDestroyed'
    }
  }
}

function pickLoot(opp: Opponent, rng: Rng): GoodId | null {
  const available = GOOD_IDS.filter((g) => opp.cargo[g] > 0)
  if (available.length === 0) return rng.chance(0.5) ? 'water' : null
  return rng.pick(available)
}

/** Plunder a surrendered/destroyed opponent's cargo into free bays. */
export function plunder(state: GameState, enc: Encounter): number {
  let taken = 0
  for (const g of GOOD_IDS) {
    while (enc.opponent.cargo[g] > 0 && freeCargoBays(state.ship) > 0) {
      enc.opponent.cargo[g]--
      state.ship.cargo[g]++
      taken++
    }
  }
  if (enc.kind === 'trader' && taken > 0) {
    applyKarma(state, -2)
    pushLog(state, 'log.plunderedTrader', { qty: taken })
  }
  enc.defeated++
  enc.downed.push(enc.opponent.shipType)
  // A surrendered ship dealt with — the next of the group engages, if any.
  if (!engageNext(state, enc)) enc.status = 'ignored'
  return taken
}

