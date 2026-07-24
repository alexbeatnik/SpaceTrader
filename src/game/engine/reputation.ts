import type { GameState, QuestType } from './types'
import { Rng } from './rng'
import { advanceDay, pushLog, type ActionResult } from './game'

/**
 * Standing (karma) model.
 *
 * `record.policeRecord` is the single signed axis the galaxy judges the player
 * on: negative is criminal notoriety, positive is a name as a defender.
 * Contraband runs and attacks on the law push it down; relief missions and
 * bounty contracts push it up. Notoriety — or a loan the bank has given up on
 * collecting — is what puts hired hunters on the player's tail.
 */

/** Notoriety at which the authorities post a standing bounty on the player. */
export const WANTED_THRESHOLD = 3
/** Debt at which the bank stops chasing payment and hires hunters instead. */
export const BANK_BOUNTY_DEBT = 10000
/** Flat part of the fine that buys a criminal record clean. */
export const FINE_BASE = 2000
/** Fine surcharge per point of notoriety, on top of `FINE_BASE`. */
export const FINE_PER_NOTORIETY = 2500
/** Days behind bars before any notoriety surcharge. */
export const SENTENCE_BASE_DAYS = 5
/** Extra days served per point of notoriety. */
export const SENTENCE_DAYS_PER_NOTORIETY = 2
/** Flat processing fine levied on arrest. */
export const PRISON_FINE_BASE = 1000
/** Arrest fine surcharge per point of notoriety. */
export const PRISON_FINE_PER_NOTORIETY = 500

/** Standing tiers, from most criminal to most respected. */
export const STANDING_IDS = [
  'outlaw',
  'criminal',
  'rogue',
  'citizen',
  'trusted',
  'defender',
  'champion'
] as const
export type StandingId = (typeof STANDING_IDS)[number]

/**
 * Karma granted when a contract of each type is handed in. Humanitarian and
 * anti-pirate work builds a defender's name; smuggling builds a criminal one.
 */
export const QUEST_KARMA: Record<QuestType, number> = {
  relief: 2,
  bounty: 3,
  escort: 1,
  smuggle: -3,
  delivery: 0,
  fetch: 0,
  passenger: 0
}

/** How criminal the player's record is (0 = not wanted at all). */
export function notoriety(state: GameState): number {
  return Math.max(0, -state.record.policeRecord)
}

/** The tier the galaxy currently files the player under. */
export function standing(state: GameState): StandingId {
  const r = state.record.policeRecord
  if (r <= -10) return 'outlaw'
  if (r <= -5) return 'criminal'
  if (r <= -1) return 'rogue'
  if (r === 0) return 'citizen'
  if (r <= 4) return 'trusted'
  if (r <= 9) return 'defender'
  return 'champion'
}

/**
 * Shift the player's record, logging whenever the change moves them into a new
 * standing tier (that is what other captains would actually notice).
 */
export function applyKarma(state: GameState, delta: number): void {
  if (delta === 0) return
  const before = standing(state)
  state.record.policeRecord += delta
  const after = standing(state)
  if (after !== before) {
    pushLog(state, 'log.standingChanged', { standing: `standing.${after}` })
  }
}

/** True while the authorities have a standing bounty on the player. */
export function wantedByLaw(state: GameState): boolean {
  return notoriety(state) >= WANTED_THRESHOLD
}

/** True while the bank has hired collectors over an unpaid loan. */
export function wantedByBank(state: GameState): boolean {
  return state.debt >= BANK_BOUNTY_DEBT
}

/** Per-jump chance that a hunter hired to collect on the player turns up. */
export function hunterChance(state: GameState): number {
  let p = 0
  if (wantedByLaw(state)) p += Math.min(0.2, 0.02 + notoriety(state) * 0.02)
  if (wantedByBank(state)) p += Math.min(0.15, 0.03 + (state.debt - BANK_BOUNTY_DEBT) / 200000)
  return Math.min(0.35, p)
}

/** Which creditor put the price on the player's head. */
export function hunterEmployer(state: GameState, rng: Rng): 'law' | 'bank' {
  if (wantedByLaw(state) && wantedByBank(state)) return rng.chance(0.5) ? 'bank' : 'law'
  return wantedByBank(state) ? 'bank' : 'law'
}

/** What it costs to buy a criminal record clean (0 when already clean). */
export function fineToClear(state: GameState): number {
  const n = notoriety(state)
  return n <= 0 ? 0 : FINE_BASE + n * FINE_PER_NOTORIETY
}

/**
 * Pay off the courts: the record is wiped and any hunters the law sent are
 * called off. The bank's collectors are a separate problem — pay the debt.
 */
export function payFine(state: GameState): ActionResult {
  const cost = fineToClear(state)
  if (cost <= 0) return { ok: false, error: 'error.recordClean' }
  if (state.credits < cost) return { ok: false, error: 'error.notEnoughCredits' }
  state.credits -= cost
  state.record.policeRecord = 0
  pushLog(state, 'log.finePaid', { amount: cost })
  return { ok: true, info: { key: 'info.finePaid', params: { amount: cost } } }
}

/** Days the player would serve if taken in right now. */
export function sentenceDays(state: GameState): number {
  return SENTENCE_BASE_DAYS + notoriety(state) * SENTENCE_DAYS_PER_NOTORIETY
}

export interface Sentence {
  days: number
  fine: number
  /** Units of contraband seized on booking. */
  confiscated: number
}

/**
 * Serve time: contraband is seized, a fine is levied, the calendar runs on
 * (debt interest, wages and premiums keep accruing behind bars) and the record
 * comes out clean. This is the slow, cheap alternative to `payFine`.
 */
export function serveSentence(state: GameState): Sentence {
  const days = sentenceDays(state)
  const fine = Math.min(state.credits, PRISON_FINE_BASE + notoriety(state) * PRISON_FINE_PER_NOTORIETY)
  const confiscated = state.ship.cargo.firearms + state.ship.cargo.narcotics
  state.ship.cargo.firearms = 0
  state.ship.cargo.narcotics = 0
  state.buyingPrice.firearms = 0
  state.buyingPrice.narcotics = 0
  state.credits -= fine
  for (let i = 0; i < days; i++) advanceDay(state)
  // Time served wipes the slate.
  state.record.policeRecord = 0
  pushLog(state, 'log.servedSentence', { days, fine })
  return { days, fine, confiscated }
}
