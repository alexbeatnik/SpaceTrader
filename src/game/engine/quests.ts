import type { GameState, Quest, GoodId } from './types'
import { Rng } from './rng'
import { currentSystem, pushLog, freeQuarters, freeCargoBays, type ActionResult } from './game'
import { systemDistance } from './travel'
import { standardPrice } from './market'
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

let questCounter = 0
function nextQuestId(): string {
  return `q${Date.now().toString(36)}${(questCounter++).toString(36)}`
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
      const reward = amount * (good === 'medicine' ? 900 : 300) + rng.int(500, 1500)
      return {
        id: nextQuestId(),
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
    const reward = amount * 700 + systemDistance(here, target) * 40 + rng.int(500, 2000)
    return {
      id: nextQuestId(),
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
      id: nextQuestId(),
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
      id: nextQuestId(),
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
    const reward = amount * 250 + rng.int(400, 1200)
    return {
      id: nextQuestId(),
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
    id: nextQuestId(),
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

  const t = rng.next()
  const amount = t < 0.55 ? rng.int(2, 8) : t < 0.85 ? rng.int(12, 40) : rng.int(60, 200)
  const roll = rng.next()

  if (roll < 0.24) {
    // Fetch: source a commodity elsewhere and bring it back here.
    const good = rng.pick(FETCH_GOODS)
    const reward = amount * rng.int(120, 260) + rng.int(300, 1200)
    return { id: nextQuestId(), type: 'fetch', giverSystem: here.id, targetSystem: here.id, reward, status: 'offered', good, amount }
  }
  if (roll < 0.42) {
    // Smuggle contraband to a distant buyer.
    const target = rng.pick(others)
    const good: GoodId = rng.chance(0.5) ? 'firearms' : 'narcotics'
    const reward = amount * rng.int(500, 900) + systemDistance(here, target) * 40 + rng.int(600, 2200)
    return { id: nextQuestId(), type: 'smuggle', giverSystem: here.id, targetSystem: target.id, reward, status: 'offered', good, amount }
  }
  if (roll < 0.6) {
    // Relief to a system in crisis (or any system if none is in crisis).
    const crisis =
      others.find((s) => s.status === 'plague' || s.status === 'drought' || s.status === 'cropFailure') ??
      rng.pick(others)
    const good: GoodId = crisis.status === 'plague' ? 'medicine' : crisis.status === 'drought' ? 'water' : 'food'
    const reward = amount * (good === 'medicine' ? 400 : 180) + rng.int(500, 1600)
    return { id: nextQuestId(), type: 'relief', giverSystem: here.id, targetSystem: crisis.id, reward, status: 'offered', good, amount }
  }
  if (roll < 0.74 && freeQuarters(state.ship) > 0) {
    // Passenger transport (needs a spare berth).
    const target = rng.pick(others)
    const dist = systemDistance(here, target)
    return { id: nextQuestId(), type: 'passenger', giverSystem: here.id, targetSystem: target.id, reward: 500 + dist * 70 + rng.int(0, 900), status: 'offered', passengerName: rng.pick(PASSENGER_NAMES) }
  }
  if (roll < 0.88) {
    // Bounty hunt for a wanted pirate.
    const target = rng.pick(others)
    return { id: nextQuestId(), type: 'bounty', giverSystem: here.id, targetSystem: target.id, reward: rng.int(2000, 6000), status: 'offered', bountyName: rng.pick(BOUNTY_NAMES) }
  }
  // Courier delivery.
  const target = rng.pick(others)
  const dist = systemDistance(here, target)
  return { id: nextQuestId(), type: 'delivery', giverSystem: here.id, targetSystem: target.id, reward: 400 + dist * 60 + rng.int(0, 800), status: 'offered' }
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

/** Accept a posting from the current planet's job board. */
export function acceptBoardQuest(state: GameState, questId: string): ActionResult {
  const sys = currentSystem(state)
  const board = sys.questBoard ?? []
  const idx = board.findIndex((q) => q.id === questId)
  if (idx < 0) return { ok: false, error: 'error.questGone' }
  if (activeQuests(state).length >= MAX_ACTIVE_QUESTS) return { ok: false, error: 'error.tooManyQuests' }
  const q = board[idx]
  if (q.type === 'passenger' && freeQuarters(state.ship) <= 0) return { ok: false, error: 'error.noQuarters' }
  board.splice(idx, 1)
  acceptQuest(state, q)
  return { ok: true, info: { key: 'quest.accepted', params: questParams(state, q) } }
}

// --- Quest supplies ----------------------------------------------------------
/** The goods a cargo-backed quest requires the player to carry, or null. */
export function questSupply(quest: Quest): { good: GoodId; amount: number } | null {
  if (
    (quest.type === 'relief' || quest.type === 'smuggle' || quest.type === 'fetch') &&
    quest.good &&
    quest.amount
  ) {
    return { good: quest.good, amount: quest.amount }
  }
  return null
}

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
  return { ok: true, info: { key: 'info.bought', params: { qty, good: need.good, cost } } }
}

/**
 * Whether an active quest can be handed in right here, right now. Turn-in is
 * manual: the player presses "hand in" at the destination. Bounty quests are
 * excluded (they resolve through combat).
 */
export function canTurnIn(state: GameState, quest: Quest): boolean {
  if (quest.status !== 'active') return false
  if (quest.type === 'bounty') return false
  if (quest.targetSystem !== state.currentSystem) return false
  // A delivery is never handed in at the system that issued it.
  if (quest.type === 'delivery' && state.currentSystem === quest.giverSystem) return false
  // Cargo-backed contracts need their goods in the hold.
  const need = questSupply(quest)
  if (need && state.ship.cargo[need.good] < need.amount) return false
  return true
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
