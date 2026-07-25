import type { GameState, MineSite, SolarSystem, StationKind, SystemBody } from './types'
import { PLANET_MAX_HULL_UPGRADES, STATIONS } from '../data/stations'

/**
 * Where the ship is, inside a star system.
 *
 * A system is a capital planet plus whatever else orbits its star (see
 * `galaxy.ts`), and only the capital has a spaceport: the market, the bank, the
 * job board and the hiring hall are all down there. Stations will work on a
 * ship and sell it gear no planet can build; a dead rock offers nothing but
 * whatever can be mined out of it.
 *
 * This module depends on nothing but the types and the station catalogue, so
 * `game.ts` can gate its actions on location without importing half the engine.
 */

/** The capital-only body list stood in for a save written before bodies. */
function capitalOnly(): SystemBody[] {
  return [{ id: 0, kind: 'planet', orbit: 1, angle: 0, mineSite: null }]
}

/** Everywhere in a system a ship can dock, capital planet first. */
export function systemBodies(sys: SolarSystem | undefined): SystemBody[] {
  if (!sys) return []
  return sys.bodies && sys.bodies.length > 0 ? sys.bodies : capitalOnly()
}

/**
 * What can be extracted at a body. The capital planet's own workings live on
 * the system record — one source of truth, so setting `sys.mineSite` still
 * means what it always did — while every other body carries its own.
 */
export function bodyMineSite(sys: SolarSystem | undefined, body: SystemBody | undefined): MineSite | null {
  if (!sys || !body) return null
  return body.kind === 'planet' ? sys.mineSite : body.mineSite
}

/** Index of the body the ship is docked at (0 = the capital planet). */
export function currentBodyIndex(state: GameState): number {
  const bodies = systemBodies(state.systems[state.currentSystem])
  const idx = state.currentBody ?? 0
  return idx >= 0 && idx < bodies.length ? idx : 0
}

/** The body the ship is docked at. */
export function currentBody(state: GameState): SystemBody | undefined {
  return systemBodies(state.systems[state.currentSystem])[currentBodyIndex(state)]
}

/** True while the ship is at the settled planet — the only full-service port. */
export function atCapital(state: GameState): boolean {
  return currentBodyIndex(state) === 0
}

/** The station the ship is docked at, or null if it is not at one. */
export function currentStation(state: GameState): StationKind | null {
  const body = currentBody(state)
  return body?.kind === 'station' ? (body.station ?? 'science') : null
}

/** Commodity market, bank, job board and hiring hall: capital planet only. */
export function hasSpaceport(state: GameState): boolean {
  return atCapital(state)
}

/** Somewhere that will work on a ship: the planet's yard, or any station. */
export function hasShipyard(state: GameState): boolean {
  return atCapital(state) || currentStation(state) !== null
}

/** The mineable site where the ship currently is, if any. */
export function currentMineSite(state: GameState): MineSite | null {
  const sys = state.systems[state.currentSystem]
  return bodyMineSite(sys, currentBody(state))
}

/** Reinforced-hull upgrades the yard here will install, in total. */
export function maxHullUpgradesHere(state: GameState): number {
  const station = currentStation(state)
  return station ? STATIONS[station].maxHullUpgrades : PLANET_MAX_HULL_UPGRADES
}

/** Multiplier the local yard applies to the hull repair bill. */
export function repairCostMulHere(state: GameState): number {
  const station = currentStation(state)
  return station ? STATIONS[station].repairCostMul : 1
}

/**
 * Days the impulse run between two bodies takes. Warp drives are useless this
 * deep in a star's gravity well, so crossing a system is measured in days on
 * the calendar rather than parsecs out of the tank.
 */
export function bodyTransitDays(from: SystemBody, to: SystemBody): number {
  const gap = Math.abs(from.orbit - to.orbit)
  return Math.max(1, Math.min(6, Math.round(gap * 0.8)))
}

/** Days it would take to reach `bodyId` from where the ship is docked now. */
export function transitDaysTo(state: GameState, bodyId: number): number {
  const bodies = systemBodies(state.systems[state.currentSystem])
  const from = bodies[currentBodyIndex(state)]
  const to = bodies[bodyId]
  if (!from || !to) return 0
  return bodyTransitDays(from, to)
}
