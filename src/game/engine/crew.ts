import type { GameState, CrewRole, GadgetId, Skills, GoodId } from './types'
import { CREW_ROLES } from './types'
import { Rng } from './rng'
import { SHIP_TYPES } from '../data/ships'
import { MERCENARIES, MERCENARY_IDS } from '../data/mercenaries'
import { ROBOTS } from '../data/robots'
import { GADGET_SKILL_BONUS, GADGET_SKILL_BONUS_ADVANCED } from '../data/equipment'
import { GOOD_IDS } from '../data/goods'
import { releaseLocalSourcing } from './sourcing'

/**
 * Crew stations.
 *
 * Every ship has four posts to man — helm, guns, engineering and power. The
 * crew sorts itself onto them (each hand takes the post they are best at), and
 * a post nobody is free to take is covered by whoever is most qualified, at
 * half effect: that is the electrician doing the mechanic's job as well as
 * their own. Neglected posts are what cause incidents, and a well-manned
 * engineering post patches hull plate every day underway.
 */

/** The skill each station is judged on. */
export const ROLE_SKILL: Record<CrewRole, keyof Skills> = {
  pilot: 'pilot',
  gunner: 'fighter',
  mechanic: 'engineer',
  electrician: 'electrician'
}

/** Gadget that stands in for a trained hand at each station. */
const ROLE_GADGET: Partial<Record<CrewRole, GadgetId>> = {
  pilot: 'navigation',
  gunner: 'targeting',
  mechanic: 'autoRepair'
}

/** The station-built equivalent, which is worth far more than a bolt-on. */
const ROLE_GADGET_ADVANCED: Partial<Record<CrewRole, GadgetId>> = {
  pilot: 'aiHelm',
  gunner: 'battleComputer',
  mechanic: 'nanoForge'
}

/** How much of their skill someone brings to a post that is not really theirs. */
export const DOUBLE_DUTY_PENALTY = 0.5
/** Fuel per day each robot's power cells draw. */
export const ROBOT_FUEL_PER_DAY = 0.34
/** Baseline daily incident chance per station, before competence is counted. */
export const INCIDENT_BASE_RISK = 0.006
/** Extra daily risk per station for each whole crew member the hull is short. */
export const INCIDENT_OVERLOAD_RISK = 0.02

/** Somebody aboard who can stand a watch. */
export interface CrewHand {
  id: string
  kind: 'commander' | 'mercenary' | 'robot'
  skills: Skills
}

/** A station and who is standing it. */
export interface RoleAssignment {
  role: CrewRole
  hand: CrewHand | null
  /** Effective skill at this post, after any double-duty penalty. */
  strength: number
  /** True when nobody is dedicated to it and another hand is covering. */
  covered: boolean
}

/** True while the ship has fuel to keep its robots powered. */
export function robotsPowered(state: GameState): boolean {
  return state.ship.fuel > 0
}

/** Robot ids aboard (empty when the ship carries none). */
export function shipRobots(state: GameState): string[] {
  return state.ship.robots ?? []
}

/**
 * Everyone aboard who can stand a watch: the commander, hired mercenaries and
 * any powered robots. Robots on a dry tank are dormant and count for nothing.
 */
export function crewHands(state: GameState): CrewHand[] {
  const hands: CrewHand[] = [
    { id: 'commander', kind: 'commander', skills: state.skills }
  ]
  for (const id of state.ship.crew) {
    const m = MERCENARIES[id]
    if (m) hands.push({ id, kind: 'mercenary', skills: m.skills })
  }
  if (robotsPowered(state)) {
    for (const id of shipRobots(state)) {
      const r = ROBOTS[id]
      if (r) hands.push({ id, kind: 'robot', skills: r.skills })
    }
  }
  return hands
}

/** Heads aboard counting the commander (dormant robots do not count). */
export function crewCount(state: GameState): number {
  return crewHands(state).length
}

/** Berths taken, including dormant robots — they still occupy a bunk. */
export function berthsUsed(state: GameState): number {
  return 1 + state.ship.crew.length + shipRobots(state).length
}

/** Hands the hull needs to run properly. Only the Flea gets by with one. */
export function minCrew(state: GameState): number {
  return SHIP_TYPES[state.ship.type].minCrew
}

/** A full watch bill: every berth filled, so no station goes short. */
export function recommendedCrew(state: GameState): number {
  return SHIP_TYPES[state.ship.type].crewQuarters
}

/** How many hands short of the hull's minimum the ship is flying. */
export function crewShortfall(state: GameState): number {
  return Math.max(0, minCrew(state) - crewCount(state))
}

/**
 * Work each hand is carrying, where 1.0 is the hull's nominal load. A lone
 * pilot in a capital ship is running at 4×, and it shows.
 */
export function crewLoad(state: GameState): number {
  return minCrew(state) / Math.max(1, crewCount(state))
}

/**
 * A hand's skill at a station, including any gadget that assists there. The
 * station-built assistant supersedes the bolt-on rather than stacking with it —
 * there is only one set of controls to sit at.
 */
function skillAt(state: GameState, hand: CrewHand, role: CrewRole): number {
  const base = hand.skills[ROLE_SKILL[role]]
  const advanced = ROLE_GADGET_ADVANCED[role]
  if (advanced && state.ship.gadgets.includes(advanced)) {
    return base + GADGET_SKILL_BONUS_ADVANCED
  }
  const gadget = ROLE_GADGET[role]
  return base + (gadget && state.ship.gadgets.includes(gadget) ? GADGET_SKILL_BONUS : 0)
}

/**
 * Sort the crew onto stations: repeatedly give the most qualified free hand the
 * post they are strongest at. Anything left unmanned falls to whoever aboard is
 * best suited, at half effect for working two posts at once.
 */
export function assignRoles(state: GameState): Record<CrewRole, RoleAssignment> {
  const hands = crewHands(state)
  const taken = new Set<CrewHand>()
  const result = {} as Record<CrewRole, RoleAssignment>
  const unfilled = new Set<CrewRole>(CREW_ROLES)

  // Greedy: the single best hand-and-post pairing left, over and over.
  while (unfilled.size > 0 && taken.size < hands.length) {
    let bestRole: CrewRole | null = null
    let bestHand: CrewHand | null = null
    let best = -1
    for (const role of unfilled) {
      for (const hand of hands) {
        if (taken.has(hand)) continue
        const skill = skillAt(state, hand, role)
        if (skill > best) {
          best = skill
          bestRole = role
          bestHand = hand
        }
      }
    }
    if (!bestRole || !bestHand) break
    result[bestRole] = { role: bestRole, hand: bestHand, strength: best, covered: false }
    taken.add(bestHand)
    unfilled.delete(bestRole)
  }

  // Short-handed: the best qualified person aboard doubles up on what is left.
  // How much they lose to it depends on how stretched the ship already is — a
  // Flea is built for one pair of hands, a freighter emphatically is not.
  const staffing = Math.min(1, crewCount(state) / minCrew(state))
  const factor = DOUBLE_DUTY_PENALTY + (1 - DOUBLE_DUTY_PENALTY) * staffing
  for (const role of unfilled) {
    let bestHand: CrewHand | null = null
    let best = 0
    for (const hand of hands) {
      const skill = skillAt(state, hand, role)
      if (skill > best) {
        best = skill
        bestHand = hand
      }
    }
    result[role] = {
      role,
      hand: bestHand,
      strength: Math.round(best * factor),
      covered: true
    }
  }

  return result
}

// --- Battle stations ---------------------------------------------------------
/** What the watch bill lets the ship do in one round of a fight. */
export interface BattleStations {
  /** Volleys the ship can loose in a round: one per gunner, capped by its guns. */
  shots: number
  /** True when a hand is free to fly while the guns are being worked. */
  helm: boolean
  /** Actions the player may spend before the other side replies. */
  actions: number
}

/**
 * Battle stations.
 *
 * The daily watch bill puts one hand on each of the four posts, but a fight is
 * not a day: everyone not flying the ship is on a gun. So a round's actions come
 * straight off the roster — one to manoeuvre with, and one volley for every
 * remaining pair of hands.
 *
 * Two limits keep it honest. A lone commander gets no helm action: one pair of
 * hands cannot fly the ship and lay the guns in the same breath, so they choose.
 * And gunners cannot outnumber the guns — a Flea with one laser fires once
 * however many people are aboard, which is what makes a second weapon mount
 * worth buying rather than just another body.
 */
export function battleStations(state: GameState): BattleStations {
  const hands = crewCount(state)
  const guns = Math.max(1, state.ship.weapons.length)
  const helm = hands > 1
  const gunners = helm ? hands - 1 : 1
  const shots = Math.max(1, Math.min(gunners, guns))
  return { shots, helm, actions: shots + (helm ? 1 : 0) }
}

// --- Hiring hall -------------------------------------------------------------
/**
 * Who is looking for a berth at the current planet today. Refreshed on every
 * arrival, so a captain who needs an electrician can go and find one rather
 * than hoping the galaxy's single spare specialist is nearby.
 */
export function generateCrewRoster(state: GameState, rng: Rng): string[] {
  const aboard = new Set(state.ship.crew)
  const pool = MERCENARY_IDS.filter((id) => !aboard.has(id))
  // Busier, higher-tech worlds keep a fuller hall.
  const size = Math.min(pool.length, rng.int(1, 2 + Math.round(currentTech(state) / 3)))
  const picked: string[] = []
  const taken = new Set<number>()
  while (picked.length < size) {
    const i = rng.int(0, pool.length - 1)
    if (taken.has(i)) continue
    taken.add(i)
    picked.push(pool[i])
  }
  return picked
}

function currentTech(state: GameState): number {
  return state.systems[state.currentSystem]?.techLevel ?? 4
}

/** The hands on offer here, tolerating saves written before hiring halls. */
export function crewRoster(state: GameState): string[] {
  const sys = state.systems[state.currentSystem]
  return (sys?.mercenaryIds ?? []).filter((id) => MERCENARIES[id] && !state.ship.crew.includes(id))
}

/** Effective skill standing a given station right now. */
export function roleStrength(state: GameState, role: CrewRole): number {
  return assignRoles(state)[role].strength
}

/**
 * Daily chance a station's neglected duties turn into an incident. Competence
 * buys down most of the risk; flying short-handed drives it up sharply.
 */
export function roleRisk(state: GameState, role: CrewRole): number {
  const strength = roleStrength(state, role)
  const overload = Math.max(0, crewLoad(state) - 1)
  const competence = Math.min(1, strength / 10)
  const risk = (INCIDENT_BASE_RISK + INCIDENT_OVERLOAD_RISK * overload) * (1 - competence)
  return Math.max(0, Math.min(0.5, risk))
}

/** Hull points the engineering watch patches up over a day underway. */
export function crewRepairPerDay(state: GameState): number {
  return Math.floor(roleStrength(state, 'mechanic') / 4)
}

// --- Incidents ---------------------------------------------------------------
/** Something that went wrong because a station was not properly manned. */
export interface CrewIncident {
  role: CrewRole
  /** i18n key for the headline. */
  titleKey: string
  /** i18n key for the body. */
  bodyKey: string
  params?: Record<string, string | number>
}

/** Pick the good a fire is most likely to ruin: the bulkiest thing aboard. */
function bulkiestCargo(state: GameState): GoodId | null {
  let best: GoodId | null = null
  let bestQty = 0
  for (const g of GOOD_IDS) {
    if (state.ship.cargo[g] > bestQty) {
      bestQty = state.ship.cargo[g]
      best = g
    }
  }
  return best
}

/** Apply the mishap that follows a neglected station. */
function runIncident(state: GameState, role: CrewRole, rng: Rng): CrewIncident {
  const maxHullPoints = SHIP_TYPES[state.ship.type].hullStrength

  if (role === 'electrician') {
    // Wiring fire: a day drifting while it is fought, cargo scorched, hull scarred.
    const dmg = Math.min(state.ship.hull - 1, rng.int(3, Math.max(4, Math.round(maxHullPoints * 0.12))))
    if (dmg > 0) state.ship.hull -= dmg
    const good = bulkiestCargo(state)
    let burned = 0
    if (good) {
      burned = Math.min(state.ship.cargo[good], rng.int(1, 4))
      state.ship.cargo[good] -= burned
      // Cargo lost is cargo off the local-sourcing ledger too, or a fire while
      // mining would keep holding back goods that no longer exist.
      releaseLocalSourcing(state, good, burned)
      if (state.ship.cargo[good] === 0) state.buyingPrice[good] = 0
    }
    state.day++
    return {
      role,
      titleKey: 'crew.incident.fire.title',
      bodyKey: burned > 0 ? 'crew.incident.fire.body' : 'crew.incident.fire.bodyNoCargo',
      params: { dmg: Math.max(0, dmg), qty: burned, good: good ?? '' }
    }
  }

  if (role === 'mechanic') {
    // Something works loose and chews up hull plate before anyone notices.
    const dmg = Math.min(state.ship.hull - 1, rng.int(2, Math.max(3, Math.round(maxHullPoints * 0.1))))
    if (dmg > 0) state.ship.hull -= dmg
    return {
      role,
      titleKey: 'crew.incident.breakdown.title',
      bodyKey: 'crew.incident.breakdown.body',
      params: { dmg: Math.max(0, dmg) }
    }
  }

  if (role === 'pilot') {
    // A sloppy plot burns fuel the ship did not have to spend.
    const lost = Math.min(state.ship.fuel, rng.int(1, 3))
    state.ship.fuel -= lost
    return {
      role,
      titleKey: 'crew.incident.misjump.title',
      bodyKey: 'crew.incident.misjump.body',
      params: { lost }
    }
  }

  // Gunner: an unsupervised weapon bay discharges into the ship's own frame.
  const dmg = Math.min(state.ship.hull - 1, rng.int(2, Math.max(3, Math.round(maxHullPoints * 0.08))))
  if (dmg > 0) state.ship.hull -= dmg
  state.ship.shieldPoints = state.ship.shieldPoints.map(() => 0)
  return {
    role: 'gunner',
    titleKey: 'crew.incident.misfire.title',
    bodyKey: 'crew.incident.misfire.body',
    params: { dmg: Math.max(0, dmg) }
  }
}

/**
 * Roll each station for a mishap over one day. At most one incident a day —
 * a crew has to be truly hopeless before the ship starts falling apart.
 */
export function rollCrewIncident(state: GameState, rng: Rng): CrewIncident | null {
  // Nothing to go wrong on a ship that is already a wreck.
  if (state.ship.hull <= 1) return null
  for (const role of CREW_ROLES) {
    if (rng.chance(roleRisk(state, role))) return runIncident(state, role, rng)
  }
  return null
}
