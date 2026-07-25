import type { Weapon, Shield, Gadget, WeaponId, ShieldId, GadgetId } from '../engine/types'

// Equipment marked `stationOnly` is built in orbital yards and sold nowhere
// else — see `data/stations.ts` for which station stocks what. It is a clear
// step above anything a planetary shipyard will fit, and priced accordingly.

export const WEAPONS: Record<WeaponId, Weapon> = {
  pulse: { id: 'pulse', power: 15, price: 2000, minTechLevel: 5 },
  beam: { id: 'beam', power: 25, price: 12500, minTechLevel: 6 },
  plasma: { id: 'plasma', power: 30, price: 22000, minTechLevel: 6 },
  military: { id: 'military', power: 35, price: 35000, minTechLevel: 7 },
  fusion: { id: 'fusion', power: 50, price: 70000, minTechLevel: 7 },
  railgun: { id: 'railgun', power: 95, price: 180000, minTechLevel: 7, stationOnly: true },
  singularity: { id: 'singularity', power: 160, price: 420000, minTechLevel: 7, stationOnly: true }
}

export const SHIELDS: Record<ShieldId, Shield> = {
  energy: { id: 'energy', power: 100, price: 5000, minTechLevel: 5 },
  reflective: { id: 'reflective', power: 200, price: 20000, minTechLevel: 6 },
  deflector: { id: 'deflector', power: 350, price: 45000, minTechLevel: 7 },
  barrier: { id: 'barrier', power: 900, price: 210000, minTechLevel: 7, stationOnly: true }
}

// Extra cargo bays granted by the cargoBays gadget.
export const EXTRA_CARGO_BAYS = 5
// Extra cargo bays granted by the station-built nanoHold.
export const EXTRA_CARGO_BAYS_ADVANCED = 20
// Extra fuel tank capacity (parsecs) granted by the fuelCompactor gadget.
export const EXTRA_FUEL_TANKS = 3
// Extra fuel tank capacity granted by the station-built quantumCompactor.
export const EXTRA_FUEL_TANKS_ADVANCED = 12

export const GADGETS: Record<GadgetId, Gadget> = {
  cargoBays: { id: 'cargoBays', price: 2500, minTechLevel: 4 },
  autoRepair: { id: 'autoRepair', price: 7500, minTechLevel: 5 },
  navigation: { id: 'navigation', price: 15000, minTechLevel: 5 },
  targeting: { id: 'targeting', price: 25000, minTechLevel: 6 },
  fuelCompactor: { id: 'fuelCompactor', price: 30000, minTechLevel: 6 },
  hiddenCompartment: { id: 'hiddenCompartment', price: 45000, minTechLevel: 6 },
  cloaking: { id: 'cloaking', price: 100000, minTechLevel: 7 },
  nanoHold: { id: 'nanoHold', price: 95000, minTechLevel: 7, stationOnly: true },
  quantumCompactor: { id: 'quantumCompactor', price: 140000, minTechLevel: 7, stationOnly: true },
  aiHelm: { id: 'aiHelm', price: 120000, minTechLevel: 7, stationOnly: true },
  battleComputer: { id: 'battleComputer', price: 160000, minTechLevel: 7, stationOnly: true },
  nanoForge: { id: 'nanoForge', price: 130000, minTechLevel: 7, stationOnly: true }
}

// Skill bonus each system-type gadget confers.
export const GADGET_SKILL_BONUS = 3
// Skill bonus a station-built assistant confers at the station it serves.
export const GADGET_SKILL_BONUS_ADVANCED = 8

export const WEAPON_IDS = Object.keys(WEAPONS) as WeaponId[]
export const SHIELD_IDS = Object.keys(SHIELDS) as ShieldId[]
export const GADGET_IDS = Object.keys(GADGETS) as GadgetId[]

/** Gear a planetary shipyard will fit. */
export const PLANET_WEAPON_IDS = WEAPON_IDS.filter((id) => !WEAPONS[id].stationOnly)
export const PLANET_SHIELD_IDS = SHIELD_IDS.filter((id) => !SHIELDS[id].stationOnly)
export const PLANET_GADGET_IDS = GADGET_IDS.filter((id) => !GADGETS[id].stationOnly)
