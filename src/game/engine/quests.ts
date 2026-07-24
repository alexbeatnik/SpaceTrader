import type { GameState, Quest, GoodId } from './types'
import { Rng } from './rng'
import {
  currentSystem,
  pushLog,
  freeQuarters,
  freeCargoBays,
  totalCargoBays,
  deliverableUnits,
  noteLocalSourcing,
  escortShipProblem,
  type ActionResult
} from './game'
import { questSupply } from './sourcing'
import { systemDistance } from './travel'
import { standardPrice } from './market'
import { applyKarma, QUEST_KARMA } from './reputation'
import { TRADE_GOODS } from '../data/goods'

// Pool of wanted-pirate names for bounty quests (proper nouns, locale-stable).
export const BOUNTY_NAMES = [
  'Redjack', 'Vex', 'Ktar', 'Morrigan', 'Slade', 'Cutter', 'Vos', 'Draska'
]

// VIP passengers for transport quests (proper nouns, locale-stable).
export const PASSENGER_NAMES = [
  'Dr. Okonkwo', 'Envoy Sarn', 'Lady Perrin', 'Prof. Adler',
  'Consul Vane', 'Captain Reyes', 'Ambassador Ito', 'Magnate Hollis'
]

// Legal commodities a supply contract may ask you to source.
const FETCH_GOODS: GoodId[] = ['ore', 'food', 'machines', 'medicine', 'robots', 'furs']

export const MAX_ACTIVE_QUESTS = 5

export function activeQuests(state: GameState): Quest[] {
  return state.quests.filter((q) => q.status === 'active')
}

export function hasActiveBounty(state: GameState): Quest | undefined {
  return state.quests.find((q) => q.status === 'active' && q.type === 'bounty')
}

/**
 * Quest ids come from a counter carried in the save, not the wall clock: a
 * seeded game has to replay identically, and `Date.now()` made every run (and
 * every test) produce different ids. The counter is monotonic across saves, so
 * an id is never reused — and being far shorter than the old timestamp form, it
 * can never collide with ids already written into an existing save either.
 */
function nextQuestId(state: GameState): string {
  const seq = (state.flags.questSeq ?? 0) + 1
  state.flags.questSeq = seq
  return `q${seq}`
}

/**
 * Reward for a cargo-backed quest. Anchored to what the goods cost to acquire
 * (the same price the giver charges for supplies), times a healthy margin, so a
 * contract is always more profitable than plain trading — plus travel pay.
 */
function cargoReward(state: GameState, good: GoodId, amount: number, dist: number, rng: Rng): number {
  const unit = questSupplyUnitPrice(state, good)
  const margin = 2.1 + rng.next() * 0.8 // 2.1–2.9× the cost of the goods
  return Math.round(amount * unit * margin) + dist * 30 + rng.int(400, 1200)
}

/**
 * Roll for a special-assignment offer at the current system. Returns an
 * `offered` quest to present to the player, or null.
 */
export function generateQuestOffer(state: GameState, rng: Rng): Quest | null {
  if (activeQuests(state).length >= MAX_ACTIVE_QUESTS) return null

  const here = currentSystem(state)
  const others = state.systems.filter((s) => s.id !== here.id)
  if (others.length === 0) return null

  const roll = rng.next()

  // Relief: prefer a system currently suffering a matching crisis.
  if (roll < 0.2) {
    const crisis = others.find(
      (s) => s.status === 'plague' || s.status === 'cropFailure' || s.status === 'drought'
    )
    if (crisis) {
      const good: GoodId =
        crisis.status === 'plague' ? 'medicine' : crisis.status === 'drought' ? 'water' : 'food'
      const amount = rng.int(3, 8)
      const reward = cargoReward(state, good, amount, systemDistance(here, crisis), rng)
      return {
        id: nextQuestId(state),
        type: 'relief',
        giverSystem: here.id,
        targetSystem: crisis.id,
        reward,
        status: 'offered',
        good,
        amount
      }
    }
  }

  // Smuggle: run contraband to a distant buyer for a fat, risky payoff.
  if (roll < 0.38) {
    const target = rng.pick(others)
    const good: GoodId = rng.chance(0.5) ? 'firearms' : 'narcotics'
    const amount = rng.int(2, 6)
    // Smuggling is high-risk: extra margin on top of the standard cargo reward.
    const reward = Math.round(cargoReward(state, good, amount, systemDistance(here, target), rng) * 1.2)
    return {
      id: nextQuestId(state),
      type: 'smuggle',
      giverSystem: here.id,
      targetSystem: target.id,
      reward,
      status: 'offered',
      good,
      amount
    }
  }

  // Passenger: ferry a VIP — only if a spare berth is available aboard.
  if (roll < 0.55 && freeQuarters(state.ship) > 0) {
    const target = rng.pick(others)
    const dist = systemDistance(here, target)
    return {
      id: nextQuestId(state),
      type: 'passenger',
      giverSystem: here.id,
      targetSystem: target.id,
      reward: 500 + dist * 70 + rng.int(0, 900),
      status: 'offered',
      passengerName: rng.pick(PASSENGER_NAMES)
    }
  }

  // Bounty: hunt a wanted pirate roaming toward a target system.
  if (roll < 0.7) {
    const target = rng.pick(others)
    return {
      id: nextQuestId(state),
      type: 'bounty',
      giverSystem: here.id,
      targetSystem: target.id,
      reward: rng.int(2000, 6000),
      status: 'offered',
      bountyName: rng.pick(BOUNTY_NAMES)
    }
  }

  // Fetch: source a commodity elsewhere and bring it back to this system.
  if (roll < 0.85) {
    const good = rng.pick(FETCH_GOODS)
    const amount = rng.int(3, 8)
    const reward = cargoReward(state, good, amount, 0, rng)
    return {
      id: nextQuestId(state),
      type: 'fetch',
      giverSystem: here.id,
      targetSystem: here.id,
      reward,
      status: 'offered',
      good,
      amount
    }
  }

  // Delivery: courier a package to a target system.
  const target = rng.pick(others)
  const dist = systemDistance(here, target)
  return {
    id: nextQuestId(state),
    type: 'delivery',
    giverSystem: here.id,
    targetSystem: target.id,
    reward: 400 + dist * 60 + rng.int(0, 800),
    status: 'offered'
  }
}

export function acceptQuest(state: GameState, quest: Quest): void {
  quest.status = 'active'
  state.quests.push(quest)
  pushLog(state, 'quest.accepted', questParams(state, quest))
}

// --- Job board ---------------------------------------------------------------
/**
 * Build one posting for a planet's job board. Sizes range from small runs (a
 * couple of units) to bulk contracts (hundreds) meant for large freighters.
 */
function makeBoardQuest(state: GameState, rng: Rng): Quest | null {
  const here = currentSystem(state)
  const others = state.systems.filter((s) => s.id !== here.id)
  if (others.length === 0) return null

  // Sizes: small runs up to bulk contracts a large freighter can just carry.
  const t = rng.next()
  const amount = t < 0.55 ? rng.int(2, 8) : t < 0.85 ? rng.int(12, 35) : rng.int(40, 70)
  const roll = rng.next()

  if (roll < 0.24) {
    // Fetch: source a commodity elsewhere and bring it back here.
    const good = rng.pick(FETCH_GOODS)
    const reward = cargoReward(state, good, amount, 0, rng)
    return { id: nextQuestId(state), type: 'fetch', giverSystem: here.id, targetSystem: here.id, reward, status: 'offered', good, amount }
  }
  if (roll < 0.42) {
    // Smuggle contraband to a distant buyer.
    const target = rng.pick(others)
    const good: GoodId = rng.chance(0.5) ? 'firearms' : 'narcotics'
    const reward = Math.round(cargoReward(state, good, amount, systemDistance(here, target), rng) * 1.2)
    return { id: nextQuestId(state), type: 'smuggle', giverSystem: here.id, targetSystem: target.id, reward, status: 'offered', good, amount }
  }
  if (roll < 0.6) {
    // Relief to a system in crisis (or any system if none is in crisis).
    const crisis =
      others.find((s) => s.status === 'plague' || s.status === 'drought' || s.status === 'cropFailure') ??
      rng.pick(others)
    const good: GoodId = crisis.status === 'plague' ? 'medicine' : crisis.status === 'drought' ? 'water' : 'food'
    const reward = cargoReward(state, good, amount, systemDistance(here, crisis), rng)
    return { id: nextQuestId(state), type: 'relief', giverSystem: here.id, targetSystem: crisis.id, reward, status: 'offered', good, amount }
  }
  if (roll < 0.74 && freeQuarters(state.ship) > 0) {
    // Passenger transport (needs a spare berth).
    const target = rng.pick(others)
    const dist = systemDistance(here, target)
    return { id: nextQuestId(state), type: 'passenger', giverSystem: here.id, targetSystem: target.id, reward: 500 + dist * 70 + rng.int(0, 900), status: 'offered', passengerName: rng.pick(PASSENGER_NAMES) }
  }
  if (roll < 0.82) {
    // Bounty hunt for a wanted pirate.
    const target = rng.pick(others)
    return { id: nextQuestId(state), type: 'bounty', giverSystem: here.id, targetSystem: target.id, reward: rng.int(2000, 6000), status: 'offered', bountyName: rng.pick(BOUNTY_NAMES) }
  }
  if (roll < 0.94) {
    // Convoy escort: gun cover on a long haul, for military hulls only.
    const target = rng.pick(others)
    const dist = systemDistance(here, target)
    return { id: nextQuestId(state), type: 'escort', giverSystem: here.id, targetSystem: target.id, reward: 1500 + dist * 120 + rng.int(0, 1500), status: 'offered' }
  }
  // Courier delivery.
  const target = rng.pick(others)
  const dist = systemDistance(here, target)
  return { id: nextQuestId(state), type: 'delivery', giverSystem: here.id, targetSystem: target.id, reward: 400 + dist * 60 + rng.int(0, 800), status: 'offered' }
}

/** Generate a fresh set of postings for the current planet's job board. */
export function generateQuestBoard(state: GameState, rng: Rng): Quest[] {
  const board: Quest[] = []
  const n = rng.int(3, 6)
  for (let i = 0; i < n; i++) {
    const q = makeBoardQuest(state, rng)
    if (q) board.push(q)
  }
  return board
}

/**
 * Why a posting cannot be taken on, or null if it can. Gathers the physical
 * impossibilities in one place so the job board can grey a card out with the
 * reason rather than letting the player accept a job and only then discover the
 * ship cannot do it: a berth for a passenger, a gunship for a convoy, and a
 * hold big enough for the freight — a 70-unit bulk contract is not going
 * anywhere in a Flea's ten bays.
 */
export function boardQuestProblem(state: GameState, quest: Quest): string | null {
  if (quest.type === 'passenger' && freeQuarters(state.ship) <= 0) return 'error.noQuarters'
  // The convoy signs on gunships only — no point taking the job otherwise.
  if (quest.type === 'escort') return escortShipProblem(state)
  const need = questSupply(quest)
  // Judged on the whole hold, not what is free: the player can always sell down
  // before loading, but no amount of tidying makes a small hull a big one.
  if (need && need.amount > totalCargoBays(state.ship)) return 'error.holdTooSmall'
  return null
}

/** Accept a posting from the current planet's job board. */
export function acceptBoardQuest(state: GameState, questId: string): ActionResult {
  const sys = currentSystem(state)
  const board = sys.questBoard ?? []
  const idx = board.findIndex((q) => q.id === questId)
  if (idx < 0) return { ok: false, error: 'error.questGone' }
  if (activeQuests(state).length >= MAX_ACTIVE_QUESTS) return { ok: false, error: 'error.tooManyQuests' }
  const q = board[idx]
  const problem = boardQuestProblem(state, q)
  if (problem) return { ok: false, error: problem }
  board.splice(idx, 1)
  acceptQuest(state, q)
  return { ok: true, info: { key: 'quest.accepted', params: questParams(state, q) } }
}

// --- Quest supplies ----------------------------------------------------------
// `questSupply` lives in `sourcing.ts` alongside the rest of the contract-cargo
// rules, so `game.ts` can enforce the delivery embargo without importing this
// module (which imports it, and would make a cycle). Re-exported here because
// this is where callers look for it.
export { questSupply, isContractEmbargoed } from './sourcing'

/** Fair per-unit price the quest-giver charges to supply a required good. */
export function questSupplyUnitPrice(state: GameState, good: GoodId): number {
  const std = standardPrice(TRADE_GOODS[good], currentSystem(state))
  return std > 0 ? std : TRADE_GOODS[good].basePrice
}

/** Units still needed to fulfil a quest, given what is already in the hold. */
export function questSupplyMissing(state: GameState, quest: Quest): number {
  const need = questSupply(quest)
  if (!need) return 0
  return Math.max(0, need.amount - state.ship.cargo[need.good])
}

/**
 * Buy the goods a quest requires directly from the giver, on the spot. Buys the
 * missing amount, bounded by credits and free cargo space.
 */
export function buyQuestSupplies(state: GameState, quest: Quest): ActionResult {
  const need = questSupply(quest)
  if (!need) return { ok: false, error: 'error.cannotBuy' }
  const missing = questSupplyMissing(state, quest)
  if (missing <= 0) return { ok: false, error: 'error.cannotBuy' }

  const unit = questSupplyUnitPrice(state, need.good)
  const qty = Math.min(missing, Math.floor(state.credits / unit), freeCargoBays(state.ship))
  if (qty <= 0) return { ok: false, error: 'error.cannotBuy' }

  const cost = qty * unit
  // Weighted-average purchase price for profit tracking (as in the market).
  const prevQty = state.ship.cargo[need.good]
  const prevCost = state.buyingPrice[need.good] * prevQty
  state.ship.cargo[need.good] += qty
  state.buyingPrice[need.good] =
    state.ship.cargo[need.good] > 0
      ? Math.round((prevCost + cost) / state.ship.cargo[need.good])
      : 0
  state.credits -= cost
  // Bought on this planet — the same restriction as any other local purchase.
  noteLocalSourcing(state, need.good, qty)
  return { ok: true, info: { key: 'info.bought', params: { qty, good: need.good, cost } } }
}

/**
 * Whether an active quest can be handed in right here, right now. Turn-in is
 * manual: the player presses "hand in" at the destination. Bounty quests are
 * excluded (they resolve through combat).
 */
export function canTurnIn(state: GameState, quest: Quest): boolean {
  if (quest.status !== 'active') return false
  // Bounties resolve in combat and escorts on the convoy run itself.
  if (quest.type === 'bounty' || quest.type === 'escort') return false
  if (quest.targetSystem !== state.currentSystem) return false
  // A delivery is never handed in at the system that issued it.
  if (quest.type === 'delivery' && state.currentSystem === quest.giverSystem) return false
  // Cargo-backed contracts need their goods hauled in: buying them from the
  // market of the very planet awaiting the delivery does not count.
  const need = questSupply(quest)
  if (need && deliverableUnits(state, need.good) < need.amount) return false
  return true
}

/** What the player's active contracts want of one commodity. */
export interface QuestDemand {
  /** Total units all active contracts call for. */
  required: number
  /** Units already in the hold (across the whole requirement). */
  have: number
  /** Units still to buy. */
  missing: number
  /** Systems the contracts wanting this good are bound for. */
  targets: number[]
}

/**
 * Commodity requirements across all active cargo contracts, keyed by good —
 * what the market screen shows so the player knows what to stock up on.
 */
export function questDemand(state: GameState): Partial<Record<GoodId, QuestDemand>> {
  const demand: Partial<Record<GoodId, QuestDemand>> = {}
  for (const q of activeQuests(state)) {
    const need = questSupply(q)
    if (!need) continue
    const entry = demand[need.good] ?? { required: 0, have: 0, missing: 0, targets: [] }
    entry.required += need.amount
    if (!entry.targets.includes(q.targetSystem)) entry.targets.push(q.targetSystem)
    demand[need.good] = entry
  }
  // Fill in holdings once per good, so two contracts don't double-count cargo.
  for (const good of Object.keys(demand) as GoodId[]) {
    const entry = demand[good]!
    entry.have = Math.min(state.ship.cargo[good], entry.required)
    entry.missing = Math.max(0, entry.required - state.ship.cargo[good])
  }
  return demand
}

/**
 * Units still to be sourced *elsewhere* before a contract can be settled here.
 * Differs from `questSupplyMissing` in that goods bought on this planet do not
 * count towards the requirement.
 */
export function questDeliverableMissing(state: GameState, quest: Quest): number {
  const need = questSupply(quest)
  if (!need) return 0
  return Math.max(0, need.amount - deliverableUnits(state, need.good))
}

/** Active quests that are ready to be handed in at the current system. */
export function questsReadyToTurnIn(state: GameState): Quest[] {
  return activeQuests(state).filter((q) => canTurnIn(state, q))
}

/**
 * Hand in a quest at the current system. Consumes any required goods, pays the
 * reward, and returns the completed quest (or null if it cannot be turned in).
 */
export function turnInQuest(state: GameState, questId: string): Quest | null {
  const q = state.quests.find((x) => x.id === questId && x.status === 'active')
  if (!q || !canTurnIn(state, q)) return null
  const need = questSupply(q)
  if (need) {
    state.ship.cargo[need.good] -= need.amount
    if (state.ship.cargo[need.good] === 0) state.buyingPrice[need.good] = 0
  }
  finishQuest(state, q)
  return q
}

/**
 * Abandon an active quest: it leaves the journal without a reward. Any goods
 * already bought for it stay in the hold (they can be sold or used elsewhere).
 */
export function abandonQuest(state: GameState, questId: string): ActionResult {
  const idx = state.quests.findIndex((q) => q.id === questId && q.status === 'active')
  if (idx < 0) return { ok: false, error: 'error.questGone' }
  const [q] = state.quests.splice(idx, 1)
  pushLog(state, 'quest.abandoned', questParams(state, q))
  return { ok: true, info: { key: 'quest.abandoned', params: questParams(state, q) } }
}

/**
 * Mark an escort contract complete (called when the convoy makes port). Danger
 * pay for attackers destroyed is settled on top of the contract fee.
 */
export function completeEscort(state: GameState, questId: string, dangerPay: number): Quest | null {
  const q = state.quests.find(
    (x) => x.id === questId && x.status === 'active' && x.type === 'escort'
  )
  if (!q) return null
  state.record.reputation += 2
  if (dangerPay > 0) {
    state.credits += dangerPay
    pushLog(state, 'escort.dangerPay', { amount: dangerPay })
  }
  finishQuest(state, q)
  return q
}

/** Mark a bounty quest complete (called from combat when the target dies). */
export function completeBounty(state: GameState, questId: string): Quest | null {
  const q = state.quests.find((x) => x.id === questId && x.status === 'active')
  if (!q) return null
  state.record.reputation += 5
  finishQuest(state, q)
  return q
}

function finishQuest(state: GameState, q: Quest): void {
  q.status = 'completed'
  state.credits += q.reward
  // Contracts shape how the galaxy sees you: aid runs and pirate hunting build
  // a defender's name, contraband runs a criminal one.
  applyKarma(state, QUEST_KARMA[q.type])
  pushLog(state, 'quest.completed', questParams(state, q))
}

export function questParams(state: GameState, q: Quest): Record<string, string | number> {
  return {
    reward: q.reward,
    system: state.systems[q.targetSystem]?.nameId ?? '',
    good: q.good ?? '',
    amount: q.amount ?? 0,
    bounty: q.bountyName ?? '',
    passenger: q.passengerName ?? ''
  }
}
