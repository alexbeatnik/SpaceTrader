import type { EconomyType, GoodId, TechLevel } from '../engine/types'

// Each planet economy shifts commodity prices via per-good multipliers applied
// on top of the standard (tech/resource/government) price, and scales the local
// fuel price. A multiplier < 1 means the good is produced/plentiful here (cheap);
// > 1 means it must be imported (dear). Missing goods default to 1 (unaffected).
export interface Economy {
  id: EconomyType
  goods: Partial<Record<GoodId, number>>
  /** Multiplier on the ship's base fuel cost per parsec. */
  fuelCostMul: number
  /** Tech-level band this economy typically occupies (used for generation). */
  techMin: TechLevel
  techMax: TechLevel
}

export const ECONOMIES: Record<EconomyType, Economy> = {
  agricultural: {
    id: 'agricultural',
    goods: {
      food: 0.6, water: 0.7, furs: 0.8, games: 1.1,
      machines: 1.35, robots: 1.3, firearms: 1.25, medicine: 1.1
    },
    fuelCostMul: 0.9,
    techMin: 0,
    techMax: 4
  },
  mining: {
    id: 'mining',
    goods: {
      ore: 0.6, firearms: 0.95, water: 1.15, food: 1.2, machines: 1.15, robots: 1.1
    },
    fuelCostMul: 0.85,
    techMin: 0,
    techMax: 5
  },
  industrial: {
    id: 'industrial',
    goods: {
      machines: 0.7, robots: 0.75, firearms: 0.8, ore: 0.9,
      food: 1.25, water: 1.2, furs: 1.1
    },
    fuelCostMul: 0.8,
    techMin: 3,
    techMax: 7
  },
  refinery: {
    id: 'refinery',
    goods: {
      ore: 0.85, machines: 0.95, narcotics: 0.9, medicine: 1.05, food: 1.15, water: 1.1
    },
    fuelCostMul: 0.55,
    techMin: 3,
    techMax: 7
  },
  resort: {
    id: 'resort',
    goods: {
      games: 0.65, furs: 0.9, medicine: 0.95, narcotics: 1.25, food: 1.35, water: 1.35
    },
    fuelCostMul: 1.4,
    techMin: 2,
    techMax: 7
  },
  hiTech: {
    id: 'hiTech',
    goods: {
      robots: 0.65, medicine: 0.75, machines: 0.8, games: 0.9, firearms: 0.85,
      ore: 1.1, water: 1.25, food: 1.2
    },
    fuelCostMul: 0.9,
    techMin: 5,
    techMax: 7
  }
}

export const ECONOMY_IDS = Object.keys(ECONOMIES) as EconomyType[]

/** Safe lookup that tolerates missing/legacy values (old saves). */
export function economyOf(id: EconomyType | undefined): Economy {
  return ECONOMIES[id as EconomyType] ?? ECONOMIES.agricultural
}
