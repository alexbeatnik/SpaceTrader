import type { Weapon, Shield, Gadget, WeaponId, ShieldId, GadgetId } from '../engine/types'

export const WEAPONS: Record<WeaponId, Weapon> = {
  pulse: { id: 'pulse', power: 15, price: 2000, minTechLevel: 5 },
  beam: { id: 'beam', power: 25, price: 12500, minTechLevel: 6 },
  plasma: { id: 'plasma', power: 30, price: 22000, minTechLevel: 6 },
  military: { id: 'military', power: 35, price: 35000, minTechLevel: 7 },
  fusion: { id: 'fusion', power: 50, price: 70000, minTechLevel: 7 }
}

export const SHIELDS: Record<ShieldId, Shield> = {
  energy: { id: 'energy', power: 100, price: 5000, minTechLevel: 5 },
  reflective: { id: 'reflective', power: 200, price: 20000, minTechLevel: 6 },
  deflector: { id: 'deflector', power: 350, price: 45000, minTechLevel: 7 }
}

// Extra cargo bays granted by the cargoBays gadget.
export const EXTRA_CARGO_BAYS = 5
// Extra fuel tank capacity (parsecs) granted by the fuelCompactor gadget.
export const EXTRA_FUEL_TANKS = 3

export const GADGETS: Record<GadgetId, Gadget> = {
  cargoBays: { id: 'cargoBays', price: 2500, minTechLevel: 4 },
  autoRepair: { id: 'autoRepair', price: 7500, minTechLevel: 5 },
  navigation: { id: 'navigation', price: 15000, minTechLevel: 5 },
  targeting: { id: 'targeting', price: 25000, minTechLevel: 6 },
  fuelCompactor: { id: 'fuelCompactor', price: 30000, minTechLevel: 6 },
  hiddenCompartment: { id: 'hiddenCompartment', price: 45000, minTechLevel: 6 },
  cloaking: { id: 'cloaking', price: 100000, minTechLevel: 7 }
}

// Skill bonus each system-type gadget confers.
export const GADGET_SKILL_BONUS = 3

export const WEAPON_IDS = Object.keys(WEAPONS) as WeaponId[]
export const SHIELD_IDS = Object.keys(SHIELDS) as ShieldId[]
export const GADGET_IDS = Object.keys(GADGETS) as GadgetId[]
