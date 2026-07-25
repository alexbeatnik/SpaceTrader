import type { GadgetId, ShieldId, StationKind, WeaponId } from '../engine/types'

/**
 * Orbital stations.
 *
 * A station is a yard with no gravity well and no local government to answer
 * to, and it shows in the catalogue: everything here is a clear step beyond
 * what a planetary shipyard will fit, at a price to match. Each of the three
 * specialities stocks its own corner of that catalogue, so kitting a ship out
 * properly means visiting more than one.
 *
 * Stations sell no commodities, post no jobs and keep no hiring hall — the
 * spaceport on the capital planet is still the only place to trade.
 */
export interface StationCatalog {
  weapons: WeaponId[]
  shields: ShieldId[]
  gadgets: GadgetId[]
  /**
   * Reinforced-hull upgrades this yard will install, total. Engineering
   * stations go well past what a planet's dry dock can manage.
   */
  maxHullUpgrades: number
  /** Multiplier on the hull repair bill — a station rig is quick and cheap. */
  repairCostMul: number
}

/** Reinforced-hull upgrades a planetary yard will install. */
export const PLANET_MAX_HULL_UPGRADES = 5

export const STATIONS: Record<StationKind, StationCatalog> = {
  // Weapons research: the guns nobody wants built over an inhabited world.
  military: {
    weapons: ['railgun', 'singularity'],
    shields: ['barrier'],
    gadgets: ['battleComputer'],
    maxHullUpgrades: 8,
    repairCostMul: 0.85
  },
  // Deep-space research: sensors, navigation and the exotic end of physics.
  science: {
    weapons: [],
    shields: ['barrier'],
    gadgets: ['aiHelm', 'quantumCompactor'],
    maxHullUpgrades: PLANET_MAX_HULL_UPGRADES,
    repairCostMul: 1
  },
  // Heavy fabrication: holds, drives, hull plate and the rigs that fit them.
  engineering: {
    weapons: ['railgun'],
    shields: [],
    gadgets: ['nanoHold', 'nanoForge', 'quantumCompactor'],
    maxHullUpgrades: 10,
    repairCostMul: 0.5
  }
}

export const STATION_IDS = Object.keys(STATIONS) as StationKind[]
