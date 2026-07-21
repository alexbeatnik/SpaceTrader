import type { GameState, SolarSystem } from './types'
import { SHIP_TYPES } from '../data/ships'
import { distance } from './galaxy'

/** Distance in parsecs between two systems (galaxy units == parsecs). */
export function systemDistance(a: SolarSystem, b: SolarSystem): number {
  return Math.round(distance(a, b))
}

/** Max range the current ship can travel on a full tank. */
export function maxRange(state: GameState): number {
  return SHIP_TYPES[state.ship.type].fuelTanks
}

/** Systems reachable given current fuel (excluding the current system). */
export function reachableSystems(state: GameState): SolarSystem[] {
  const here = state.systems[state.currentSystem]
  return state.systems.filter(
    (s) => s.id !== here.id && systemDistance(here, s) <= state.ship.fuel
  )
}

/** Fuel cost to reach a target system from the current one. */
export function fuelCost(state: GameState, targetId: number): number {
  const here = state.systems[state.currentSystem]
  const target = state.systems[targetId]
  return systemDistance(here, target)
}

export function canTravelTo(state: GameState, targetId: number): boolean {
  const here = state.systems[state.currentSystem]
  if (here.wormholeTo === targetId) return true
  return fuelCost(state, targetId) <= state.ship.fuel
}
