import type { GameState, Quest, GoodId } from './types'
import { Rng } from './rng'
import { currentSystem, pushLog } from './game'
import { systemDistance } from './travel'

// Pool of wanted-pirate names for bounty quests (proper nouns, locale-stable).
export const BOUNTY_NAMES = [
  'Redjack', 'Vex', 'Ktar', 'Morrigan', 'Slade', 'Cutter', 'Vos', 'Draska'
]

export const MAX_ACTIVE_QUESTS = 3

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
  if (roll < 0.34) {
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

  // Bounty: hunt a wanted pirate roaming toward a target system.
  if (roll < 0.6) {
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

/**
 * On arrival at a system, complete any delivery/relief quests whose conditions
 * are met. Returns the quests that completed (for UI feedback).
 */
export function checkQuestArrival(state: GameState): Quest[] {
  const completed: Quest[] = []
  for (const q of activeQuests(state)) {
    if (q.targetSystem !== state.currentSystem) continue

    if (q.type === 'delivery') {
      finishQuest(state, q)
      completed.push(q)
    } else if (q.type === 'relief' && q.good && q.amount) {
      if (state.ship.cargo[q.good] >= q.amount) {
        state.ship.cargo[q.good] -= q.amount
        if (state.ship.cargo[q.good] === 0) state.buyingPrice[q.good] = 0
        finishQuest(state, q)
        completed.push(q)
      }
    }
    // bounty quests complete via combat, not arrival.
  }
  return completed
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
    bounty: q.bountyName ?? ''
  }
}
