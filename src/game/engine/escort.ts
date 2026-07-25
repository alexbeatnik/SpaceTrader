import type { GameState, Quest } from './types'
import { Rng } from './rng'
import { SHIELDS } from '../data/equipment'
import { advanceDay, atCapital, pushLog, escortShipProblem } from './game'
import {
  spawnEncounter,
  resolveRound,
  plunder,
  type Encounter,
  type EncounterKind,
  type EncounterMessage
} from './combat'
import { completeEscort } from './quests'
import { systemDistance } from './travel'
import { settleArrival } from './warp'
import { notoriety } from './reputation'

/**
 * Convoy escort duty.
 *
 * The player flies gun cover for a merchant convoy: a long run the convoy
 * commander runs, not the player. Contacts along the way are resolved
 * automatically — command decides who gets shot at and who gets waved past —
 * so the whole contract resolves in one engine call and the UI simply replays
 * the resulting log leg by leg.
 */

/** Shortest and longest a convoy run can be, in legs (one day each). */
export const ESCORT_MIN_LEGS = 3
export const ESCORT_MAX_LEGS = 8
/** Credits paid per attacker destroyed on top of the contract fee. */
export const ESCORT_KILL_BONUS = 250

/** The convoy commander's standing order for a contact. */
export type EscortOrder = 'engage' | 'holdFire' | 'standDown'

/** One day of the run: an empty stretch, or a contact and how it went. */
export interface EscortLeg {
  /** 1-based leg number. */
  index: number
  kind?: EncounterKind
  order?: EscortOrder
  messages: EncounterMessage[]
  /** Hull lost on this leg. */
  damage: number
  /** Attackers destroyed on this leg. */
  kills: number
}

export interface EscortRun {
  questId: string
  targetSystem: number
  legs: EscortLeg[]
  kills: number
  damageTaken: number
  /** True when the player's ship did not survive the contract. */
  destroyed: boolean
  /** Contract fee, paid only on a completed run. */
  reward: number
  /** Extra pay for attackers destroyed. */
  dangerPay: number
}

export interface EscortResult {
  ok: boolean
  error?: string
  run?: EscortRun
}

/** How many legs (days) a run to the given system takes. */
export function escortLegs(state: GameState, quest: Quest): number {
  const from = state.systems[quest.giverSystem]
  const to = state.systems[quest.targetSystem]
  if (!from || !to) return ESCORT_MIN_LEGS
  const dist = systemDistance(from, to)
  return Math.max(ESCORT_MIN_LEGS, Math.min(ESCORT_MAX_LEGS, Math.round(dist / 3) + ESCORT_MIN_LEGS))
}

/** Who the convoy runs into on a given leg. */
function rollContact(state: GameState, rng: Rng): EncounterKind | null {
  // A laden convoy is a magnet: most contacts are raiders looking for cargo.
  if (!rng.chance(0.55)) return null
  const roll = rng.next()
  if (roll < 0.6) return 'pirate'
  if (roll < 0.7) return 'alien'
  if (roll < 0.82) return 'police'
  // Hunters only bother to intercept a convoy if the escort is worth money.
  if (roll < 0.92 && notoriety(state) > 0) return 'bountyHunter'
  return 'trader'
}

/** The order convoy command gives for a contact — the player has no say. */
function orderFor(kind: EncounterKind): EscortOrder {
  if (kind === 'pirate' || kind === 'alien' || kind === 'bountyHunter') return 'engage'
  if (kind === 'police') return 'standDown'
  return 'holdFire'
}

/**
 * Fight a contact out automatically. The escort never runs and never
 * surrenders: it holds station until one side stops shooting.
 */
function fightItOut(state: GameState, enc: Encounter, rng: Rng): void {
  let guard = 0
  while (guard++ < 200) {
    if (enc.status === 'ongoing') {
      resolveRound(state, enc, 'attack', rng)
      continue
    }
    // A ship that yields is stripped and the next of the group steps up.
    if (enc.status === 'oppSurrendered') {
      plunder(state, enc)
      continue
    }
    break
  }
}

/**
 * Run a convoy escort contract end to end. Mutates the game state (days, hull,
 * cargo, position, payout) and returns the leg-by-leg log for the UI to replay.
 */
export function runEscort(state: GameState, questId: string, rng: Rng): EscortResult {
  const quest = state.quests.find(
    (q) => q.id === questId && q.status === 'active' && q.type === 'escort'
  )
  if (!quest) return { ok: false, error: 'error.questGone' }
  // The convoy forms up over the capital planet, not out at a belt or a station.
  if (state.currentSystem !== quest.giverSystem || !atCapital(state)) {
    return { ok: false, error: 'error.escortNotHere' }
  }
  const problem = escortShipProblem(state)
  if (problem) return { ok: false, error: problem }

  const total = escortLegs(state, quest)
  const legs: EscortLeg[] = []
  let kills = 0
  let damageTaken = 0
  let destroyed = false

  for (let i = 1; i <= total; i++) {
    advanceDay(state)
    const leg: EscortLeg = { index: i, messages: [], damage: 0, kills: 0 }
    const hullBefore = state.ship.hull

    const kind = rollContact(state, rng)
    if (!kind) {
      leg.messages.push({ key: 'escort.legQuiet', params: { leg: i } })
    } else {
      const order = orderFor(kind)
      leg.kind = kind
      leg.order = order
      leg.messages.push({ key: 'escort.contact', params: { leg: i, kind: `encounter.kind.${kind}` } })
      leg.messages.push({ key: `escort.order.${order}` })

      if (order === 'engage') {
        const enc = spawnEncounter(kind, state, rng)
        fightItOut(state, enc, rng)
        leg.messages.push(...enc.messages)
        leg.kills = enc.defeated
        kills += enc.defeated
        if (enc.status === 'playerDestroyed') destroyed = true
      }
    }

    leg.damage = Math.max(0, hullBefore - state.ship.hull)
    damageTaken += leg.damage
    legs.push(leg)

    if (destroyed) {
      leg.messages.push({ key: 'escort.lost' })
      break
    }

    // The convoy tender services its escort between legs.
    if (i < total && state.ship.shields.length > 0) {
      const charged = state.ship.shieldPoints.some((p, idx) => p < SHIELDS[state.ship.shields[idx]].power)
      state.ship.shieldPoints = state.ship.shields.map((s) => SHIELDS[s].power)
      if (charged) leg.messages.push({ key: 'escort.shieldsRecharged' })
    }
  }

  const run: EscortRun = {
    questId,
    targetSystem: quest.targetSystem,
    legs,
    kills,
    damageTaken,
    destroyed,
    reward: quest.reward,
    dangerPay: destroyed ? 0 : kills * ESCORT_KILL_BONUS
  }

  if (destroyed) {
    pushLog(state, 'escort.failed', { system: state.systems[quest.targetSystem]?.nameId ?? '' })
    return { ok: true, run }
  }

  // The convoy makes port: dock at the destination and settle up.
  state.currentSystem = quest.targetSystem
  settleArrival(state, rng)
  completeEscort(state, questId, run.dangerPay)
  legs[legs.length - 1]?.messages.push({
    key: 'escort.arrived',
    params: { system: state.systems[quest.targetSystem]?.nameId ?? '' }
  })
  return { ok: true, run }
}
