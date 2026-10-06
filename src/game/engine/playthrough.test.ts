import { describe, it, expect } from 'vitest'
// Through the public barrel on purpose: a bot that plays the whole game is also
// the check that everything a host needs to drive it is actually exported.
import * as E from '../index'
import type { CombatAction, Encounter, GameState, GoodId, Quest } from '../index'
import { renderMessage, setLocale, t } from '../../i18n/index'

/**
 * Whole-game playthroughs.
 *
 * The unit suite next door checks one rule at a time on a state built for the
 * purpose. This file does the opposite: a seeded bot flies entire careers —
 * trading, taking contracts, fighting, mining, crossing systems, buying hulls —
 * and after *every* action the state is held against the invariants no rule
 * may ever break, whatever order the rules were exercised in. It finds the
 * bugs that live between two features rather than inside one: a ledger one
 * path forgot to clear, a message one branch emits with a param nobody
 * translated, a ship one purchase left with more crew than bunks.
 *
 * The bot is not trying to play well. It takes the choices the UI offers,
 * weighted by a per-run temperament (cautious hauler, smuggler, gunboat), so
 * across a few dozen seeds every screen's actions get pressed in combinations
 * no hand-written test would think to try.
 */

// --- Findings ----------------------------------------------------------------
interface Report {
  /** Broken invariants, keyed by rule, with how often and one worked example. */
  violations: Map<string, { count: number; first: string }>
  /** Things that happened, for the balance read-out. */
  stats: Record<string, number>
}

function newReport(): Report {
  return { violations: new Map(), stats: {} }
}

function flag(r: Report, rule: string, detail: string): void {
  const seen = r.violations.get(rule)
  if (seen) seen.count++
  else r.violations.set(rule, { count: 1, first: detail })
}

function bump(r: Report, stat: string, by = 1): void {
  r.stats[stat] = (r.stats[stat] ?? 0) + by
}

// --- Text ----------------------------------------------------------------------
/** Ids that reach the player only if a param was passed through untranslated. */
const RAW_ID =
  /\b(good|shipType|merc|weapon|shield|gadget|robot|skill|status|standing|role|profession|encounter\.kind)\.[A-Za-z]+/

/**
 * A message the engine emitted must be real prose in both locales: a key that
 * resolves, every `{param}` filled, and no id leaking through where a name
 * should be. Locale *parity* cannot see any of this — both dictionaries can be
 * equally wrong — so the only check is to render what the game actually said.
 */
function checkText(
  r: Report,
  key: string,
  params: Record<string, string | number> | undefined,
  where: string
): void {
  for (const locale of ['en', 'uk'] as const) {
    setLocale(locale)
    const text = renderMessage(key, params)
    if (text === key) flag(r, 'message key has no text', `${locale}: ${key} (${where})`)
    else if (/\{\w+\}/.test(text)) flag(r, 'message param left unfilled', `${locale}: ${key} -> ${text}`)
    else if (RAW_ID.test(text)) flag(r, 'raw id shown to the player', `${locale}: ${key} -> ${text}`)
    else if (/\b(undefined|NaN|null)\b/.test(text)) flag(r, 'junk value in a message', `${locale}: ${key} -> ${text}`)
  }
  setLocale('en')
}

// --- Invariants ----------------------------------------------------------------
const seenLog = new WeakSet<object>()

/**
 * Everything that must be true of a `GameState` between any two actions.
 * `alive` is false only in the instant between a killing blow and the pod.
 */
function checkState(r: Report, g: GameState, where: string, alive = true): void {
  const ship = g.ship
  const type = E.SHIP_TYPES[ship.type]
  const whole = (v: number, name: string, min = 0, max = Number.MAX_SAFE_INTEGER): void => {
    if (!Number.isInteger(v) || v < min || v > max) {
      flag(r, `${name} out of bounds`, `${name}=${v} (allowed ${min}..${max}) after ${where}`)
    }
  }

  whole(g.credits, 'credits')
  whole(g.debt, 'debt')
  whole(g.day, 'day', 1)
  whole(g.noClaim, 'noClaim')
  whole(g.record.policeRecord, 'policeRecord', -100000)
  whole(g.record.reputation, 'reputation', -100000)
  whole(ship.fuel, 'fuel', 0, E.maxFuel(ship))
  whole(ship.hull, 'hull', alive ? 1 : 0, E.maxHull(ship))
  whole(ship.hullUpgrades ?? 0, 'hullUpgrades')

  for (const good of E.GOOD_IDS) {
    whole(ship.cargo[good], `cargo.${good}`)
    whole(g.buyingPrice[good], `buyingPrice.${good}`)
    const local = g.sourcedHere?.[good] ?? 0
    whole(local, `sourcedHere.${good}`)
    if (local > ship.cargo[good]) {
      flag(r, 'more cargo sourced here than is aboard', `${good}: ${local} > ${ship.cargo[good]} after ${where}`)
    }
    if (ship.cargo[good] === 0 && g.buyingPrice[good] !== 0) {
      flag(r, 'a price is on the books for cargo that is gone', `${good} after ${where}`)
    }
  }
  if (E.usedCargoBays(ship) > E.totalCargoBays(ship)) {
    flag(r, 'hold over capacity', `${E.usedCargoBays(ship)}/${E.totalCargoBays(ship)} after ${where}`)
  }

  if (ship.weapons.length > type.weaponSlots) flag(r, 'more weapons than mounts', where)
  if (ship.shields.length > type.shieldSlots) flag(r, 'more shields than mounts', where)
  if (ship.gadgets.length > type.gadgetSlots) flag(r, 'more gadgets than mounts', where)
  if (ship.shieldPoints.length !== ship.shields.length) {
    flag(r, 'shield charge out of step with shields fitted', where)
  }
  ship.shieldPoints.forEach((p, i) => {
    const power = E.SHIELDS[ship.shields[i]]?.power ?? 0
    if (!Number.isInteger(p) || p < 0 || p > power) {
      flag(r, 'shield charge out of bounds', `${p}/${power} after ${where}`)
    }
  })

  if (E.freeQuarters(ship) < 0) {
    flag(r, 'more crew than berths', `${ship.type}: free=${E.freeQuarters(ship)} after ${where}`)
  }
  if (new Set(ship.crew).size !== ship.crew.length) flag(r, 'the same hand hired twice', where)
  for (const id of ship.crew) if (!E.MERCENARIES[id]) flag(r, 'unknown crew id', `${id} after ${where}`)
  for (const id of ship.robots ?? []) if (!E.ROBOTS[id]) flag(r, 'unknown robot id', `${id} after ${where}`)
  if (g.insurance && !ship.escapePod) flag(r, 'insured with no escape pod', where)
  const drain = g.robotDrain ?? 0
  if (!(drain >= 0 && drain < 1 + 1e-9)) flag(r, 'robot fuel debt out of bounds', `${drain} after ${where}`)

  const active = E.activeQuests(g)
  if (active.length > E.MAX_ACTIVE_QUESTS) flag(r, 'too many active quests', `${active.length} after ${where}`)
  const ids = g.quests.map((q) => q.id)
  if (new Set(ids).size !== ids.length) flag(r, 'duplicate quest id', where)
  if (E.freeBerths(g) < 0) {
    flag(r, 'a berth promised to two people', `${ship.type}: ${E.passengersAboard(g)} passengers, free=${E.freeQuarters(ship)} after ${where}`)
  }

  const sys = g.systems[g.currentSystem]
  if (!sys) flag(r, 'current system does not exist', `${g.currentSystem} after ${where}`)
  else {
    const bodies = E.systemBodies(sys)
    if ((g.currentBody ?? 0) < 0 || (g.currentBody ?? 0) >= bodies.length) {
      flag(r, 'docked at a body that does not exist', `${g.currentBody} after ${where}`)
    }
    for (const good of E.GOOD_IDS) {
      whole(sys.qty[good], `market.qty.${good}`)
      whole(sys.buyPrice[good], `market.buy.${good}`)
      whole(sys.sellPrice[good], `market.sell.${good}`)
    }
  }

  if (g.log.length > 100) flag(r, 'log grew past its cap', `${g.log.length}`)
  for (const entry of g.log) {
    if (seenLog.has(entry)) continue
    seenLog.add(entry)
    checkText(r, entry.key, entry.params, `log after ${where}`)
  }
}

/** A save must survive the trip to disk and back unchanged. */
function checkSerialisable(r: Report, g: GameState, where: string): void {
  let bad = ''
  // An `undefined` property is simply left out, which reads back the same; a
  // NaN or an Infinity is written as `null`, which does not.
  const json = JSON.stringify(g, (key, value) => {
    if (typeof value === 'number' && !Number.isFinite(value)) bad = `${key}=${value}`
    return value
  })
  if (bad) flag(r, 'state holds a value JSON cannot carry', `${bad} at ${where}`)
  if (JSON.stringify(JSON.parse(json)) !== json) flag(r, 'state does not round-trip', where)
}

// --- The bot -------------------------------------------------------------------
interface Bot {
  g: GameState
  /** The bot's own dice — never the engine's, so its choices cannot skew a roll. */
  rng: E.Rng
  r: Report
  /** 0 = runs from everything, 1 = shoots at everything, haulers included. */
  aggression: number
  /** 0 = clean record, 1 = contraband in every hold. */
  lawless: number
  dead: boolean
  /** True during a jump made with no bounty contract in the journal. */
  cleanLeg: boolean
}

function result(b: Bot, res: { ok: boolean; error?: string; info?: { key: string; params?: Record<string, string | number> } }, where: string): boolean {
  if (res.error) checkText(b.r, res.error, undefined, where)
  if (res.info) checkText(b.r, res.info.key, res.info.params, where)
  checkState(b.r, b.g, where)
  return res.ok
}

/** The ship has been lost: the pod, or the end of the run. */
function shipLost(b: Bot, cause: string): void {
  bump(b.r, `ship lost: ${cause}`)
  if (E.abandonShip(b.g)) {
    bump(b.r, 'saved by the pod')
    checkState(b.r, b.g, `pod after ${cause}`)
  } else {
    b.dead = true
    bump(b.r, `run ended: ${cause}`)
  }
}

const ALL_ACTIONS: CombatAction[] = [
  'attack', 'closeIn', 'openRange', 'endTurn', 'flee', 'submit', 'bribe', 'surrender', 'ignore', 'plunder'
]

/** The buttons the combat screen would be showing right now. */
function offeredActions(enc: Encounter): CombatAction[] {
  const peaceful = E.isPeacefulTrader(enc)
  const actions: CombatAction[] = ['attack']
  if (enc.opponent.distance > E.POINT_BLANK_RANGE) actions.push('closeIn')
  if (enc.opponent.distance < E.MAX_ENGAGEMENT_RANGE) actions.push('openRange')
  if (enc.actionsLeft < enc.actionsPerRound) actions.push('endTurn')
  if (!peaceful) actions.push('flee')
  if (enc.kind === 'police') actions.push('submit')
  if ((enc.kind === 'police' || enc.kind === 'bountyHunter') && enc.bribeCost > 0) actions.push('bribe')
  if (enc.kind === 'pirate' || enc.kind === 'bountyHunter') actions.push('surrender')
  if (peaceful) actions.push('ignore')
  return actions
}

function chooseAction(b: Bot, enc: Encounter): CombatAction {
  const { g, rng } = b
  const offered = offeredActions(enc)
  const has = (a: CombatAction): boolean => offered.includes(a)
  const hurt = g.ship.hull <= E.maxHull(g.ship) * 0.35
  const armed = E.weaponPower(g.ship) > 0
  // Can this ship trade volleys with that one and expect to come out ahead?
  const staying = g.ship.hull + E.currentShieldCharge(g.ship)
  const theirs = enc.opponent.hull + enc.opponent.shieldPoints
  const outgunned =
    !armed ||
    enc.opponent.weaponPower * 1.3 >= staying ||
    theirs / Math.max(1, E.weaponPower(g.ship)) > (staying / Math.max(1, enc.opponent.weaponPower)) * 1.2

  if (E.isPeacefulTrader(enc)) {
    return armed && rng.chance(b.aggression * 0.15) ? 'attack' : 'ignore'
  }
  if (enc.kind === 'police') {
    const contraband = g.ship.cargo.firearms + g.ship.cargo.narcotics > 0
    if (!contraband && rng.chance(0.85)) return 'submit'
    if (has('bribe') && g.credits >= enc.bribeCost && rng.chance(0.4)) return 'bribe'
    if (rng.chance(0.3)) return 'submit'
    return armed && rng.chance(b.aggression * 0.5) ? 'attack' : 'flee'
  }
  if (hurt || outgunned) {
    // A sensible captain does not duel a ship that kills in one volley: give
    // the pirates the cargo, buy the hunter off, and otherwise run. Only the
    // most belligerent temperaments stand and fight anyway.
    if (has('surrender') && enc.kind === 'pirate' && rng.chance(hurt ? 0.9 : 0.1)) return 'surrender'
    if (has('bribe') && g.credits >= enc.bribeCost && rng.chance(0.5)) return 'bribe'
    if (has('surrender') && hurt && rng.chance(0.6)) return 'surrender'
    if (!rng.chance(b.aggression * 0.1)) return 'flee'
  }
  // Otherwise fight, with the odd manoeuvre thrown in so range is exercised.
  if (rng.chance(1 - b.aggression) && rng.chance(0.25)) return 'flee'
  if (has('closeIn') && rng.chance(0.2)) return 'closeIn'
  if (has('openRange') && rng.chance(0.05)) return 'openRange'
  if (has('endTurn') && rng.chance(0.05)) return 'endTurn'
  return 'attack'
}

function checkEncounter(b: Bot, enc: Encounter, where: string): void {
  const r = b.r
  if (enc.actionsLeft < 0 || enc.actionsLeft > enc.actionsPerRound) {
    flag(r, 'action budget out of bounds', `${enc.actionsLeft}/${enc.actionsPerRound} ${where}`)
  }
  for (const opp of [enc.opponent, ...enc.reserves]) {
    if (!Number.isInteger(opp.hull) || opp.hull < 0 || opp.hull > opp.maxHull) {
      flag(r, 'opponent hull out of bounds', `${opp.hull}/${opp.maxHull} ${where}`)
    }
    if (opp.shieldPoints < 0 || opp.shieldPoints > opp.maxShield) {
      flag(r, 'opponent shields out of bounds', `${opp.shieldPoints}/${opp.maxShield} ${where}`)
    }
    if (opp.distance < E.POINT_BLANK_RANGE || opp.distance > E.MAX_ENGAGEMENT_RANGE) {
      flag(r, 'opponent outside engagement range', `${opp.distance} ${where}`)
    }
    for (const good of E.GOOD_IDS) {
      if (!Number.isInteger(opp.cargo[good]) || opp.cargo[good] < 0) {
        flag(r, 'opponent cargo out of bounds', `${good}=${opp.cargo[good]} ${where}`)
      }
    }
  }
  if (enc.defeated + enc.reserves.length + (enc.status === 'ongoing' ? 1 : 0) > enc.fleetSize) {
    flag(r, 'more ships in the group than it started with', where)
  }
  if (enc.downed.length !== enc.defeated) flag(r, 'wreck list out of step with the tally', where)
  for (const m of enc.messages) {
    if (seenLog.has(m)) continue
    seenLog.add(m)
    checkText(r, m.key, m.params, `combat log ${where}`)
  }
}

/** Play one encounter to its end, the way the combat screen would let it go. */
function fight(b: Bot, enc: Encounter, where: string): void {
  const { g, rng, r } = b
  bump(r, `met: ${enc.kind}`)
  // A commander holding a bounty contract has asked for pirates: the target is
  // tagged onto any that turn up, and ambushes a third of otherwise quiet legs.
  // Those are counted apart, or they drown out how often raiders come unasked.
  if (enc.bountyQuestId) bump(r, 'met: bounty target')
  else if (enc.kind === 'pirate' && b.cleanLeg) bump(r, 'pirates met on jumps flown without a bounty')
  checkEncounter(b, enc, `${where} (opening)`)

  let guard = 0
  while (!b.dead && guard++ < 600) {
    if (enc.status === 'oppSurrendered') {
      if (rng.chance(0.7)) {
        E.plunder(g, enc)
        checkState(r, g, `${where} plunder`)
        checkEncounter(b, enc, `${where} plunder`)
        continue
      }
      break
    }
    if (enc.status !== 'ongoing') break

    // Deal with a peaceful hauler before deciding how to part.
    if (E.isPeacefulTrader(enc) && enc.trade && rng.chance(0.5)) {
      for (const good of E.GOOD_IDS) {
        if (enc.trade.buys[good] && g.ship.cargo[good] > 0 && rng.chance(0.5)) {
          result(b, E.tradeSell(g, enc, good, g.ship.cargo[good]), `${where} tradeSell`)
        }
        if (enc.trade.sells[good] && rng.chance(0.3)) {
          result(b, E.tradeBuy(g, enc, good, rng.int(1, 4)), `${where} tradeBuy`)
        }
      }
    }
    if (enc.reserves.length > 0 && rng.chance(0.15)) {
      E.setTarget(enc, rng.int(0, enc.reserves.length - 1))
    }

    // Now and then, an action the screen is *not* offering: the engine has to
    // hold its own rules without a missing button to hold them for it.
    const offered = offeredActions(enc)
    const action = rng.chance(0.04) ? rng.pick(ALL_ACTIONS) : chooseAction(b, enc)
    const legitimate = offered.includes(action)
    const hostile = !E.isPeacefulTrader(enc)
    const before = enc.round
    // Seeded exactly as the store seeds it.
    E.resolveRound(g, enc, action, new E.Rng((enc.seed ^ (enc.round * 2654435761)) >>> 0))
    if (action === 'ignore' && hostile && (enc.status as E.EncounterStatus) === 'ignored') {
      flag(r, 'a hostile ship was waved away', `${enc.kind} ${where}`)
    }
    if (legitimate && enc.round === before && enc.status === 'ongoing') {
      flag(r, 'an offered combat action was refused', `${action} vs ${enc.kind} ${where}`)
      break
    }
    const killed = (enc.status as E.EncounterStatus) === 'playerDestroyed'
    checkState(r, g, `${where} ${action} vs ${enc.kind}`, !killed)
    checkEncounter(b, enc, `${where} ${action}`)
    if (!killed && g.ship.hull <= 0) flag(r, 'hull at zero but the fight goes on', `${enc.status} ${where}`)
    if (killed) shipLost(b, `combat with ${enc.kind}`)
  }
  if (guard >= 600) flag(r, 'an encounter never ended', `${enc.kind} ${where}`)
  bump(r, `ended: ${enc.status}`)
}

/** What a jump (or a crossing) handed back, played out as the store plays it. */
function arrive(b: Bot, res: E.WarpResult, where: string): void {
  const { g, r } = b
  for (const enc of res.encounters ?? []) {
    if (b.dead) return
    fight(b, enc, where)
  }
  if (b.dead) return
  if (res.blackHole) {
    bump(r, 'black hole')
    const story = E.blackHoleEvent(res.blackHole, g.ship.escapePod)
    checkText(r, story.titleKey, undefined, where)
    checkText(r, story.bodyKey, story.params, where)
    if (!res.blackHole.survived) {
      shipLost(b, 'black hole')
      if (b.dead) return
    }
  }
  if (res.incident) {
    bump(r, `incident: ${res.incident.role}`)
    checkText(r, res.incident.titleKey, undefined, where)
    checkText(r, res.incident.bodyKey, res.incident.params, where)
  }
  if (res.event) {
    bump(r, `event: ${res.event.id}`)
    checkText(r, res.event.titleKey, undefined, where)
    checkText(r, res.event.bodyKey, res.event.params, where)
  }
  const wantsIt = res.questOffer?.type !== 'bounty' || b.rng.chance(b.aggression * 0.3)
  if (res.questOffer && wantsIt && b.rng.chance(0.6)) {
    E.acceptQuest(g, res.questOffer)
    bump(r, `offer taken: ${res.questOffer.type}`)
    if (b.rng.chance(0.5)) E.buyQuestSupplies(g, res.questOffer)
  }
  checkState(r, g, where)
}

function cargoWorth(g: GameState): number {
  return E.GOOD_IDS.reduce((sum, id) => sum + g.ship.cargo[id] * E.TRADE_GOODS[id].basePrice, 0)
}

/** Net worth: what the commander would have if everything were cashed in. */
function netWorth(g: GameState): number {
  return g.credits - g.debt + E.shipValue(g.ship) + cargoWorth(g)
}

/** Everything a commander gets done in port before leaving again. */
function portCall(b: Bot): void {
  const { g, rng, r } = b
  const here = E.currentSystem(g)

  // Arrival leaves three things settled, whatever happened on the way in.
  if ((g.currentBody ?? 0) !== 0) flag(r, 'made port somewhere other than the capital', here.nameId)
  for (const item of here.news ?? []) {
    checkText(r, item.headlineKey, undefined, 'news')
    checkText(r, item.bodyKey, item.params, 'news')
  }

  if (rng.chance(0.15)) fuzz(b)

  // Contracts due here.
  for (const q of E.questsReadyToTurnIn(g)) {
    const done = E.turnInQuest(g, q.id)
    if (!done) flag(r, 'a quest reported ready could not be handed in', q.type)
    else bump(r, `quest done: ${q.type}`)
    checkState(r, g, `turnIn ${q.type}`)
  }
  // A journal that has filled with jobs nobody can finish gets one cleared out.
  if (E.activeQuests(g).length >= E.MAX_ACTIVE_QUESTS && rng.chance(0.5)) {
    result(b, E.abandonQuest(g, rng.pick(E.activeQuests(g)).id), 'abandonQuest')
  }

  // Sell what is not spoken for.
  const demand = E.questDemand(g)
  for (const good of E.GOOD_IDS) {
    const keep = demand[good]?.required ?? 0
    const spare = g.ship.cargo[good] - keep
    if (spare > 0 && here.sellPrice[good] > 0) result(b, E.sellGood(g, good, spare), `sell ${good}`)
    else if (spare > 0 && rng.chance(0.05)) result(b, E.dumpGood(g, good, spare), `dump ${good}`)
  }

  // The bank and the courts.
  // At ten per cent a day nothing is worth more than being out of debt, so
  // everything past a tank of fuel goes to the bank first.
  const keep = E.maxFuel(g.ship) * E.fuelPricePerParsec(g) + 50
  if (g.debt > 0 && g.credits > keep) result(b, E.payDebt(g, g.credits - keep), 'payDebt')
  // Borrowing is for a ship that cannot otherwise fill its tank: at ten per
  // cent a day, a loan taken for comfort is a career ended for want of it.
  const tank = (E.maxFuel(g.ship) - g.ship.fuel) * E.fuelPricePerParsec(g)
  if (g.credits < tank && g.debt === 0) result(b, E.getLoan(g, tank - g.credits + 200), 'getLoan')
  if (E.fineToClear(g) > 0 && g.credits > E.fineToClear(g) * 2) result(b, E.payFine(g), 'payFine')

  // The yard.
  result(b, E.repairFull(g), 'repair')
  result(b, E.refuelFull(g), 'refuel')
  if (rng.chance(0.3)) g.autoRefuel = !g.autoRefuel
  if (g.credits > 6000 && !g.ship.escapePod) result(b, E.buyEscapePod(g), 'buyEscapePod')
  if (g.ship.escapePod && !g.insurance && rng.chance(0.3)) result(b, E.buyInsurance(g), 'buyInsurance')
  if (g.insurance && rng.chance(0.03)) result(b, E.cancelInsurance(g), 'cancelInsurance')
  shopForGear(b)

  // A new hull, now and then, when the hold is empty and the money is there.
  if (E.usedCargoBays(g.ship) === 0 && rng.chance(0.25)) {
    const lot = E.shipsForSale(g).filter(
      (id) => id !== g.ship.type && E.SHIP_TYPES[id].price - E.shipValue(g.ship) < g.credits * 0.7
    )
    if (lot.length > 0) {
      const pick = rng.pick(lot)
      if (result(b, E.buyShip(g, pick), `buyShip ${pick}`)) bump(r, 'ships bought')
    }
  }

  // The hiring hall.
  for (const id of E.crewRoster(g)) {
    if (E.freeQuarters(g.ship) > 0 && g.credits > E.MERCENARIES[id].wage * 40 && rng.chance(0.5)) {
      if (result(b, E.hireMercenary(g, id), `hire ${id}`)) bump(r, 'hands hired')
    }
  }
  if (g.ship.crew.length > 0 && rng.chance(0.04)) {
    result(b, E.fireMercenary(g, rng.pick(g.ship.crew)), 'fire')
  }
  for (const id of E.robotsForSale(g)) {
    if (E.freeQuarters(g.ship) > 0 && g.credits > E.ROBOTS[id].price * 3 && rng.chance(0.3)) {
      if (result(b, E.buyRobot(g, id), `buyRobot ${id}`)) bump(r, 'robots bought')
    }
  }

  // The job board.
  for (const q of [...(here.questBoard ?? [])]) {
    if (E.activeQuests(g).length >= E.MAX_ACTIVE_QUESTS) break
    if (E.boardQuestProblem(g, q) !== null) continue
    if (q.type === 'smuggle' && !rng.chance(b.lawless)) continue
    // A bounty is a standing invitation to be ambushed, so only the gunboats
    // take them — and not while one is already in the journal.
    if (q.type === 'bounty' && (E.hasActiveBounty(g) || !rng.chance(b.aggression * 0.3))) continue
    if (!rng.chance(0.45)) continue
    if (result(b, E.acceptBoardQuest(g, q.id), `accept ${q.type}`)) bump(r, `quest taken: ${q.type}`)
  }
  for (const q of E.activeQuests(g)) {
    if (q.targetSystem !== g.currentSystem && E.questSupplyMissing(g, q) > 0 && rng.chance(0.6)) {
      const need = E.questSupply(q)!
      result(b, E.buyGood(g, need.good, E.questSupplyMissing(g, q)), `supplies ${need.good}`)
    }
  }

  // A convoy forming up here.
  const convoy = E.activeQuests(g).find((q) => q.type === 'escort' && q.giverSystem === g.currentSystem)
  if (convoy && E.canEscort(g)) runConvoy(b, convoy)
}

/**
 * Everything a careless caller could send. None of it may be accepted in a way
 * that leaves the state malformed: amounts that are fractional, negative or not
 * numbers at all, and ids that name nothing.
 */
function fuzz(b: Bot): void {
  const { g, rng, r } = b
  const junk = [0, -1, -7.5, 0.5, 2.5, NaN, Infinity, -Infinity, 1e12]
  const n = rng.pick(junk)
  const good = rng.pick(E.GOOD_IDS)
  const nobody = 'nobody'
  E.buyGood(g, good, n)
  E.sellGood(g, good, n)
  E.dumpGood(g, good, n)
  E.refuel(g, n)
  E.repair(g, n)
  E.getLoan(g, n)
  E.payDebt(g, n)
  E.sellWeapon(g, 99)
  E.sellShield(g, -1)
  E.sellGadget(g, 0.5)
  E.sellRobot(g, 42)
  E.hireMercenary(g, nobody)
  E.fireMercenary(g, nobody)
  E.buyRobot(g, nobody)
  E.acceptBoardQuest(g, nobody)
  E.abandonQuest(g, nobody)
  E.turnInQuest(g, nobody)
  E.buyShip(g, nobody as E.ShipTypeId)
  for (const target of [-1, 99999, g.currentSystem, 1.5]) {
    if (E.warp(g, target).ok) flag(r, 'a jump to nowhere was accepted', String(target))
  }
  if (E.travelToBody(g, 99, rng).ok) flag(r, 'a crossing to a body that is not there was accepted', '')
  checkState(r, g, `fuzz (${n})`)
}

function shopForGear(b: Bot): void {
  const { g, rng } = b
  const type = (): (typeof E.SHIP_TYPES)[keyof typeof E.SHIP_TYPES] => E.SHIP_TYPES[g.ship.type]
  const spare = (): number => g.credits * 0.5
  for (const id of E.weaponsForSale(g)) {
    if (g.ship.weapons.length < type().weaponSlots && E.WEAPONS[id].price < spare() && rng.chance(0.5)) {
      result(b, E.buyWeapon(g, id), `buyWeapon ${id}`)
    }
  }
  for (const id of E.shieldsForSale(g)) {
    if (g.ship.shields.length < type().shieldSlots && E.SHIELDS[id].price < spare() && rng.chance(0.5)) {
      result(b, E.buyShield(g, id), `buyShield ${id}`)
    }
  }
  for (const id of E.gadgetsForSale(g)) {
    if (g.ship.gadgets.length < type().gadgetSlots && E.GADGETS[id].price < spare() && rng.chance(0.4)) {
      result(b, E.buyGadget(g, id), `buyGadget ${id}`)
    }
  }
  if (g.credits > E.hullUpgradePrice(g.ship) * 3 && rng.chance(0.3)) {
    if (result(b, E.buyHullUpgrade(g), 'buyHullUpgrade')) bump(b.r, 'hull upgrades')
  }
  // Refits: the odd module comes back off again.
  if (g.ship.weapons.length > 1 && rng.chance(0.03)) result(b, E.sellWeapon(g, 0), 'sellWeapon')
  if (g.ship.shields.length > 0 && rng.chance(0.03)) result(b, E.sellShield(g, 0), 'sellShield')
  if (g.ship.gadgets.length > 0 && rng.chance(0.03)) {
    result(b, E.sellGadget(g, rng.int(0, g.ship.gadgets.length - 1)), 'sellGadget')
  }
  if ((g.ship.robots ?? []).length > 0 && rng.chance(0.03)) result(b, E.sellRobot(g, 0), 'sellRobot')
}

function runConvoy(b: Bot, quest: Quest): void {
  const { g, r } = b
  const res = E.runEscort(g, quest.id, new E.Rng((g.seed ^ (g.day * 2654435761) ^ 0x5c07) >>> 0))
  if (!res.ok || !res.run) {
    if (res.error) checkText(r, res.error, undefined, 'escort')
    flag(r, 'an escort the ship qualified for would not start', res.error ?? '')
    return
  }
  bump(r, 'escort runs')
  for (const leg of res.run.legs) {
    for (const m of leg.messages) checkText(r, m.key, m.params, 'escort leg')
  }
  if (res.run.destroyed) {
    checkState(r, g, 'escort lost', false)
    shipLost(b, 'convoy escort')
  } else {
    bump(r, 'quest done: escort')
    checkState(r, g, 'escort done')
  }
}

/** Work a mine site for a few days, raiders and all. */
function mine(b: Bot, where: string): void {
  const { g, rng, r } = b
  const shifts = rng.int(1, 6)
  for (let i = 0; i < shifts && !b.dead; i++) {
    const res = E.mineOnce(g, new E.Rng((g.seed ^ (g.day * 2654435761)) >>> 0))
    if (res.error) checkText(r, res.error, undefined, where)
    if (!res.ok) return
    bump(r, 'days mined')
    if (res.incident) checkText(r, res.incident.bodyKey, res.incident.params, where)
    checkState(r, g, where)
    if (res.encounter) {
      fight(b, res.encounter, `${where} raid`)
      return
    }
  }
}

/** Out to another body and — eventually — back to the planet. */
function tourSystem(b: Bot): void {
  const { g, rng, r } = b
  const bodies = E.systemBodies(E.currentSystem(g))
  if (bodies.length < 2) return
  const fly = (bodyId: number): boolean => {
    const before = { ...g.sourcedHere }
    const res = E.travelToBody(
      g,
      bodyId,
      new E.Rng((g.seed ^ (g.day * 2246822519) ^ ((bodyId + 1) * 40503)) >>> 0)
    )
    if (res.error) checkText(r, res.error, undefined, 'impulse')
    if (!res.ok) return false
    bump(r, 'impulse crossings')
    arrive(b, { ok: true, encounters: res.encounters, incident: res.incident }, `impulse to body ${bodyId}`)
    // Crossing a system is not an arrival: the ledger must come through intact
    // (less whatever a fight or a fire took out of the hold on the way).
    for (const good of E.GOOD_IDS) {
      if (!b.dead && (g.sourcedHere?.[good] ?? 0) > (before?.[good] ?? 0)) {
        flag(r, 'local sourcing grew during an impulse crossing', good)
      }
    }
    return !b.dead
  }

  const target = rng.int(1, bodies.length - 1)
  if (!fly(target)) return
  if (E.currentMineSite(g) && rng.chance(0.8)) mine(b, 'mining out-system')
  if (b.dead) return
  if (E.hasShipyard(g)) {
    bump(r, 'station calls')
    result(b, E.repairFull(g), 'station repair')
    result(b, E.refuelFull(g), 'station refuel')
    shopForGear(b)
  }
  // Port services must all refuse out here, with a reason.
  for (const [name, res] of [
    ['buyGood', E.buyGood(g, 'water', 1)],
    ['sellGood', E.sellGood(g, 'water', 1)],
    ['getLoan', E.getLoan(g, 100)],
    ['hire', E.hireMercenary(g, 'pax')]
  ] as const) {
    if (res.ok) flag(r, 'a port service worked away from the port', name)
  }
  if (E.questsReadyToTurnIn(g).length > 0) flag(r, 'a quest was ready to hand in away from the port', '')
  if (!b.dead && (g.currentBody ?? 0) !== 0) fly(0)
}

/** Pick somewhere to go, load up for it, and go. Returns false when stuck. */
function depart(b: Bot): boolean {
  const { g, rng, r } = b
  const here = E.currentSystem(g)

  // Sometimes the hole in the sky is the plan.
  if (here.unstableWormhole && rng.chance(0.25)) {
    const res = E.enterUnstableWormhole(g)
    if (res.ok) {
      bump(r, 'unmapped wormhole falls')
      arrive(b, res, 'unmapped wormhole')
      return true
    }
  }
  if (here.wormholeTo !== null && g.credits >= E.wormholeTax(g) && rng.chance(0.3)) {
    const res = E.warp(g, here.wormholeTo)
    if (res.ok) {
      bump(r, 'wormhole jumps')
      arrive(b, res, 'wormhole')
      return true
    }
  }

  const inRange = g.systems.filter(
    (s) => s.id !== here.id && E.systemDistance(here, s) <= g.ship.fuel
  )
  if (inRange.length === 0) {
    // A hole in the sky is still a way out when the tank is not.
    if (here.unstableWormhole) {
      const res = E.enterUnstableWormhole(g)
      if (res.ok) {
        bump(r, 'unmapped wormhole falls')
        arrive(b, res, 'unmapped wormhole')
        return true
      }
    }
    // And so is the surveyed one, for the toll — borrowed if it has to be.
    if (here.wormholeTo !== null) {
      if (E.tollOnAccount(g)) bump(r, 'wormhole tolls taken on account')
      const res = E.warp(g, here.wormholeTo)
      if (res.ok) {
        bump(r, 'wormhole jumps')
        arrive(b, res, 'wormhole')
        return true
      }
    }
    const everInRange = g.systems.some(
      (s) => s.id !== here.id && E.systemDistance(here, s) <= E.maxFuel(g.ship)
    )
    bump(r, everInRange ? 'stuck: tank too low to reach anything' : 'stuck: nothing within a full tank')
    // The second is a trap with no way out, and must never happen: every way
    // of ending up somewhere, or of changing the ship's range, is meant to
    // refuse rather than leave the ship in a system it cannot fly out of.
    if (!everInRange && !E.canLeaveSystem(g, E.maxFuel(g.ship))) {
      flag(r, 'ship trapped in a system beyond its range', `${g.ship.type} at ${here.nameId}, day ${g.day}`)
    }
    return false
  }

  // A contract's destination first; otherwise wherever the cargo pays best.
  const questTargets = E.activeQuests(g)
    .filter((q) => q.type !== 'bounty' && q.type !== 'escort' && E.questSupplyMissing(g, q) === 0)
    .map((q) => q.targetSystem)
  const wanted = inRange.filter((s) => questTargets.includes(s.id))
  const margin = (to: E.SolarSystem, good: GoodId): number => {
    const cost = E.marketBuyPrice(g, good)
    return cost > 0 && to.sellPrice[good] > 0 ? to.sellPrice[good] - cost : 0
  }
  const best = (to: E.SolarSystem): number => Math.max(...E.GOOD_IDS.map((id) => margin(to, id)))
  const target =
    wanted.length > 0 && rng.chance(0.8)
      ? rng.pick(wanted)
      : rng.chance(0.25)
        ? rng.pick(inRange)
        : [...inRange].sort((x, y) => best(y) - best(x))[0]

  // Load the hold with whatever turns a profit at the far end.
  if (E.atCapital(g)) {
    const goods = [...E.GOOD_IDS].sort((x, y) => margin(target, y) - margin(target, x))
    for (const good of goods) {
      if (margin(target, good) <= 0 || E.freeCargoBays(g.ship) <= 0) break
      if (E.TRADE_GOODS[good].illegal && !rng.chance(b.lawless)) continue
      // Never the last credit: a full tank's worth stays in the purse, or one
      // bad leg leaves the ship with an empty hold and no way to refuel.
      const reserve = E.maxFuel(g.ship) * E.fuelPricePerParsec(g) + 100
      const budget = Math.floor(Math.max(0, g.credits - reserve) / E.marketBuyPrice(g, good))
      if (budget > 0) result(b, E.buyGood(g, good, budget), `buy ${good}`)
    }
  }

  b.cleanLeg = !E.hasActiveBounty(g)
  if (b.cleanLeg) {
    bump(r, 'jumps flown without a bounty')
    if (E.usedCargoBays(g.ship) > 0) bump(r, 'jumps flown without a bounty, laden')
  }
  const res = E.warp(g, target.id)
  if (!res.ok) {
    if (res.error) checkText(r, res.error, undefined, 'warp')
    flag(r, 'a jump within range was refused', `${res.error} to ${target.nameId}`)
    return false
  }
  bump(r, 'jumps')
  arrive(b, res, `jump to ${target.nameId}`)
  b.cleanLeg = false
  return true
}

interface Career {
  report: Report
  /** Net worth sampled on these days, for the balance read-out. */
  worth: Record<number, number>
  days: number
  dead: boolean
  final: GameState
}

const CHECKPOINTS = [25, 50, 100, 200, 300]

/**
 * Fly one whole career from a seed. Pure: the same seed flies the same career.
 *
 * A `veteran` starts rich and skilled. Not to flatter the bot: a commander who
 * starts in a Flea with a thousand credits rarely lives to see a capital ship,
 * so without this cohort the late game — big hulls, full crews, robots, station
 * gear, convoy escorts — would be covered by a handful of lucky seeds at best.
 */
function flyCareer(seed: number, maxDays: number, veteran = false): Career {
  const g = E.newGame({
    commanderName: 'Bot',
    seed,
    skills: veteran ? { pilot: 8, fighter: 8, trader: 8, engineer: 8, electrician: 8 } : undefined
  })
  if (veteran) g.credits = 900000
  const rng = new E.Rng((seed * 7919 + 17) >>> 0)
  const r = newReport()
  const b: Bot = { g, rng, r, aggression: rng.next(), lawless: rng.next() * rng.next(), dead: false, cleanLeg: false }
  const worth: Record<number, number> = {}

  // The start system's board, hall and feeds, as the store seeds them.
  const boot = new E.Rng((g.seed ^ (g.day * 2654435761)) >>> 0)
  const start = E.currentSystem(g)
  start.questBoard = E.generateQuestBoard(g, boot)
  start.mercenaryIds = E.generateCrewRoster(g, boot)
  start.news = E.generateNews(start, boot)
  checkState(r, g, 'new game')

  const here = (): E.SolarSystem => E.currentSystem(g)
  let stuck = 0
  let turns = 0
  while (!b.dead && g.day < maxDays && turns++ < maxDays * 2) {
    const day = g.day
    portCall(b)
    if (b.dead) break
    if (E.currentMineSite(g) && rng.chance(0.15)) mine(b, 'mining at the capital')
    if (!b.dead && rng.chance(0.12)) tourSystem(b)
    if (b.dead) break
    // A ship that ended up parked at a moon makes for the planet first.
    if ((g.currentBody ?? 0) !== 0) {
      E.travelToBody(g, 0, new E.Rng((g.seed ^ (g.day * 2246822519) ^ 40503) >>> 0))
      checkState(r, g, 'return to port')
    }
    if (!depart(b)) {
      // Out of fuel and out of money: the port's advance is the way out, and
      // there must always be one — a ship with nowhere it can reach, no
      // credits to change that and no offer on the table has simply stopped.
      const offer = E.emergencyFuelOffer(g)
      if (offer) {
        result(b, E.takeEmergencyFuel(g), 'emergency fuel')
        bump(r, 'emergency fuel taken')
        if (E.emergencyFuelOffer(g)) flag(r, 'the port advance did not get the ship moving', here().nameId)
      } else {
        E.getLoan(g, 2000)
        E.refuelFull(g)
        if (E.currentMineSite(g)?.resource === 'fuel') mine(b, 'scooping fuel')
      }
      if (++stuck > 3) {
        bump(r, 'careers ended stranded')
        flag(r, 'a career ended stranded', `${g.ship.type} at ${here().nameId} day ${g.day}: fuel ${g.ship.fuel}/${E.maxFuel(g.ship)}, ${g.credits} cr, debt ${g.debt}`)
        break
      }
    } else stuck = 0

    for (const mark of CHECKPOINTS) {
      if (day < mark && g.day >= mark && worth[mark] === undefined) worth[mark] = netWorth(g)
    }
    if (turns % 10 === 0) checkSerialisable(r, g, `day ${g.day}`)
  }
  checkSerialisable(r, g, 'end of career')
  return { report: r, worth, days: g.day, dead: b.dead, final: g }
}

function merge(into: Report, from: Report): void {
  for (const [rule, v] of from.violations) {
    const seen = into.violations.get(rule)
    if (seen) seen.count += v.count
    else into.violations.set(rule, { ...v })
  }
  for (const [stat, n] of Object.entries(from.stats)) bump(into, stat, n)
}

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length === 0 ? 0 : s[Math.floor(s.length / 2)]
}

// --- The suite -----------------------------------------------------------------
const SEEDS = Array.from({ length: 80 }, (_, i) => 1000 + i * 37)
const MAX_DAYS = 300

const VETERAN_SEEDS = Array.from({ length: 30 }, (_, i) => 50000 + i * 53)

describe('whole-game playthroughs', () => {
  const careers = SEEDS.map((seed) => flyCareer(seed, MAX_DAYS))
  const veterans = VETERAN_SEEDS.map((seed) => flyCareer(seed, MAX_DAYS, true))
  const total = newReport()
  const late = newReport()
  for (const c of careers) merge(total, c.report)
  for (const c of veterans) merge(late, c.report)

  it('break no invariant, in any career, after any action', () => {
    const broken = [...total.violations, ...late.violations].map(
      ([rule, v]) => `${rule} ×${v.count} — e.g. ${v.first}`
    )
    expect(broken).toEqual([])
  })

  it('reach the late game with the veteran cohort', () => {
    const s = late.stats
    expect(s['ships bought']).toBeGreaterThan(50)
    expect(s['hands hired']).toBeGreaterThan(50)
    expect(s['robots bought']).toBeGreaterThan(10)
    expect(s['hull upgrades']).toBeGreaterThan(20)
    expect(s['station calls']).toBeGreaterThan(20)
    expect(s['escort runs']).toBeGreaterThan(5)
  })

  it('actually exercise the game they claim to cover', () => {
    // A bot that died on day 3 everywhere would pass the test above vacuously.
    const s = total.stats
    expect(s['jumps']).toBeGreaterThan(2000)
    for (const kind of ['pirate', 'police', 'trader']) expect(s[`met: ${kind}`]).toBeGreaterThan(50)
    expect(s['days mined']).toBeGreaterThan(50)
    expect(s['impulse crossings']).toBeGreaterThan(50)
    expect(s['ships bought']).toBeGreaterThan(20)
    for (const type of ['delivery', 'fetch', 'relief']) {
      expect(s[`quest done: ${type}`]).toBeGreaterThan(5)
    }
  })

  it('fly the same career twice from the same seed', () => {
    // Determinism end to end: nothing in a whole career may read the wall
    // clock or `Math.random`, or a seeded replay stops being one.
    const again = flyCareer(SEEDS[0], MAX_DAYS)
    expect(JSON.stringify(again.final)).toBe(JSON.stringify(careers[0].final))
  })

  it('print the balance read-out', () => {
    const lines: string[] = []
    lines.push(`careers: ${careers.length}, died: ${careers.filter((c) => c.dead).length}`)
    lines.push(`days survived (median): ${median(careers.map((c) => c.days))}`)
    for (const mark of CHECKPOINTS) {
      const xs = careers.map((c) => c.worth[mark]).filter((x): x is number => x !== undefined)
      lines.push(`net worth by day ${mark}: median ${median(xs)} (${xs.length} careers got there)`)
    }
    // The handful of ratios that say how the game actually plays, worked out
    // rather than left for whoever reads the tallies below to divide by hand.
    const rate = (r: Report, a: string, b: string): string => {
      const x = r.stats[a] ?? 0
      const y = r.stats[b] ?? 0
      return y === 0 ? 'n/a' : `${Math.round((x / y) * 100)}% (${x}/${y})`
    }
    for (const [label, r] of [['rookies', total], ['veterans', late]] as const) {
      lines.push(`[${label}] uninvited pirate meetings per jump: ${rate(r, 'pirates met on jumps flown without a bounty', 'jumps flown without a bounty')}`)
      lines.push(`[${label}] alien meetings per jump: ${rate(r, 'met: alien', 'jumps')}`)
      lines.push(`[${label}] ship lost per alien meeting: ${rate(r, 'ship lost: combat with alien', 'met: alien')}`)
      lines.push(`[${label}] ship lost per pirate meeting: ${rate(r, 'ship lost: combat with pirate', 'met: pirate')}`)
      lines.push(`[${label}] ship lost per black hole: ${rate(r, 'ship lost: black hole', 'black hole')}`)
    }
    lines.push(`[rookies] careers ended stranded: ${total.stats['careers ended stranded'] ?? 0} of ${careers.length}`)
    lines.push('')
    for (const stat of Object.keys(total.stats).sort()) lines.push(`${stat}: ${total.stats[stat]}`)
    lines.push('', `--- veterans: ${veterans.length} careers, died: ${veterans.filter((c) => c.dead).length}, days survived (median): ${median(veterans.map((c) => c.days))} ---`)
    for (const stat of Object.keys(late.stats).sort()) lines.push(`${stat}: ${late.stats[stat]}`)
    // Not an assertion — a picture of how the game plays, printed with the run.
    console.log(`\n--- playthrough read-out (${t('app.title')}) ---\n${lines.join('\n')}\n`)
    expect(lines.length).toBeGreaterThan(0)
  })
})
