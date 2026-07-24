import type { ShipType, ShipTypeId, ShipSize, ShipClass } from '../engine/types'

/**
 * Base equipment slots derived from size × class. Every class grows its
 * signature slots faster than the others as the hull size increases.
 *
 * Military   — best weapons & shields, few gadgets (combat focus).
 * Trade      — few weapons, strong gadget growth (cargo/utility focus).
 * Civilian   — balanced across all slot types.
 * Explorer   — most gadget slots; hulls also carry the longest fuel tanks.
 * Industrial — heaviest shields of all classes, solid gadget spread.
 */
export const SLOT_TABLE: Record<ShipSize, Record<ShipClass, { w: number; s: number; g: number }>> = {
  small: {
    military:   { w: 2, s: 1, g: 1 },
    trade:      { w: 1, s: 1, g: 2 },
    civilian:   { w: 1, s: 1, g: 1 },
    explorer:   { w: 1, s: 1, g: 3 },
    industrial: { w: 1, s: 2, g: 1 }
  },
  medium: {
    military:   { w: 3, s: 2, g: 1 },
    trade:      { w: 1, s: 2, g: 3 },
    civilian:   { w: 2, s: 2, g: 2 },
    explorer:   { w: 1, s: 2, g: 4 },
    industrial: { w: 1, s: 3, g: 2 }
  },
  large: {
    military:   { w: 4, s: 3, g: 2 },
    trade:      { w: 2, s: 2, g: 4 },
    civilian:   { w: 2, s: 3, g: 3 },
    explorer:   { w: 2, s: 2, g: 5 },
    industrial: { w: 2, s: 4, g: 3 }
  },
  capital: {
    military:   { w: 5, s: 4, g: 2 },
    trade:      { w: 2, s: 3, g: 5 },
    civilian:   { w: 3, s: 4, g: 4 },
    explorer:   { w: 2, s: 3, g: 6 },
    industrial: { w: 2, s: 5, g: 4 }
  }
}

/** Look up the standard slot counts for a given hull size and class. */
export function slotsFor(size: ShipSize, cls: ShipClass): { weaponSlots: number; shieldSlots: number; gadgetSlots: number } {
  const s = SLOT_TABLE[size][cls]
  return { weaponSlots: s.w, shieldSlots: s.s, gadgetSlots: s.g }
}

/**
 * Relative bulk of each hull size. Combat compares two ranks to decide who can
 * outrun whom and whether a tractor beam can get a lock on a smaller ship.
 */
export const SIZE_RANK: Record<ShipSize, number> = {
  small: 0,
  medium: 1,
  large: 2,
  capital: 3
}

// Ship roster based on the original documentation's described capabilities.
// Slot counts are derived from the SLOT_TABLE above (size × shipClass).
export const SHIP_TYPES: Record<ShipTypeId, ShipType> = {
  flea: {
    id: 'flea',
    size: 'small',
    shipClass: 'trade',
    price: 2000,
    cargoBays: 10,
    ...slotsFor('small', 'trade'),       // W1 S1 G2
    crewQuarters: 1,
    fuelTanks: 20,
    hullStrength: 25,
    fuelCostPerParsec: 1,
    repairCostPerUnit: 1,
    minTechLevel: 4
  },
  gnat: {
    id: 'gnat',
    size: 'small',
    shipClass: 'civilian',
    price: 10000,
    cargoBays: 15,
    ...slotsFor('small', 'civilian'),     // W1 S1 G1
    crewQuarters: 1,
    fuelTanks: 14,
    hullStrength: 100,
    fuelCostPerParsec: 2,
    repairCostPerUnit: 1,
    minTechLevel: 4
  },
  ant: {
    // Early mining tug: sturdy shields for its size and room for ore.
    id: 'ant',
    size: 'small',
    shipClass: 'industrial',
    price: 14000,
    cargoBays: 20,
    ...slotsFor('small', 'industrial'),   // W1 S2 G1
    crewQuarters: 1,
    fuelTanks: 14,
    hullStrength: 90,
    fuelCostPerParsec: 3,
    repairCostPerUnit: 1,
    minTechLevel: 4
  },
  dragonfly: {
    // Nimble long-range scout: little cargo, but reaches far and carries gadgets.
    id: 'dragonfly',
    size: 'small',
    shipClass: 'explorer',
    price: 16000,
    cargoBays: 12,
    ...slotsFor('small', 'explorer'),     // W1 S1 G3
    crewQuarters: 1,
    fuelTanks: 20,
    hullStrength: 70,
    fuelCostPerParsec: 2,
    repairCostPerUnit: 1,
    minTechLevel: 4
  },
  ladybird: {
    // Cheap escort fighter: two guns on a tough little hull.
    id: 'ladybird',
    size: 'small',
    shipClass: 'military',
    price: 20000,
    cargoBays: 12,
    ...slotsFor('small', 'military'),     // W2 S1 G1
    crewQuarters: 1,
    fuelTanks: 13,
    hullStrength: 110,
    fuelCostPerParsec: 3,
    repairCostPerUnit: 1,
    minTechLevel: 5
  },
  firefly: {
    id: 'firefly',
    size: 'medium',
    shipClass: 'trade',
    price: 25000,
    cargoBays: 20,
    ...slotsFor('medium', 'trade'),       // W1 S2 G3
    crewQuarters: 1,
    fuelTanks: 17,
    hullStrength: 100,
    fuelCostPerParsec: 3,
    repairCostPerUnit: 1,
    minTechLevel: 5
  },
  mosquito: {
    id: 'mosquito',
    size: 'medium',
    shipClass: 'military',
    price: 30000,
    cargoBays: 15,
    ...slotsFor('medium', 'military'),    // W3 S2 G1
    crewQuarters: 1,
    fuelTanks: 13,
    hullStrength: 100,
    fuelCostPerParsec: 5,
    repairCostPerUnit: 1,
    minTechLevel: 5
  },
  weevil: {
    // Mid-game mining barge: heavy shields shrug off raiders over the ore fields.
    id: 'weevil',
    size: 'medium',
    shipClass: 'industrial',
    price: 40000,
    cargoBays: 35,
    ...slotsFor('medium', 'industrial'),  // W1 S3 G2
    crewQuarters: 2,
    fuelTanks: 13,
    hullStrength: 120,
    fuelCostPerParsec: 7,
    repairCostPerUnit: 2,
    minTechLevel: 5
  },
  locust: {
    // Cheap swarm hauler: big hold, thin hull — a courier's workhorse.
    id: 'locust',
    size: 'medium',
    shipClass: 'trade',
    price: 45000,
    cargoBays: 45,
    ...slotsFor('medium', 'trade'),       // W1 S2 G3
    crewQuarters: 2,
    fuelTanks: 15,
    hullStrength: 80,
    fuelCostPerParsec: 8,
    repairCostPerUnit: 2,
    minTechLevel: 5
  },
  moth: {
    // Long-range survey ship: modest hold, deep tanks and a rack of gadget bays.
    id: 'moth',
    size: 'medium',
    shipClass: 'explorer',
    price: 55000,
    cargoBays: 15,
    ...slotsFor('medium', 'explorer'),    // W1 S2 G4
    crewQuarters: 2,
    fuelTanks: 21,
    hullStrength: 90,
    fuelCostPerParsec: 4,
    repairCostPerUnit: 2,
    minTechLevel: 5
  },
  bumblebee: {
    id: 'bumblebee',
    size: 'medium',
    shipClass: 'civilian',
    price: 60000,
    cargoBays: 20,
    ...slotsFor('medium', 'civilian'),    // W2 S2 G2
    crewQuarters: 2,
    fuelTanks: 15,
    hullStrength: 100,
    fuelCostPerParsec: 7,
    repairCostPerUnit: 2,
    minTechLevel: 5
  },
  beetle: {
    id: 'beetle',
    size: 'medium',
    shipClass: 'trade',
    price: 80000,
    cargoBays: 50,
    ...slotsFor('medium', 'trade'),       // W1 S2 G3
    crewQuarters: 3,
    fuelTanks: 14,
    hullStrength: 50,
    fuelCostPerParsec: 10,
    repairCostPerUnit: 2,
    minTechLevel: 5
  },
  mantis: {
    // Dedicated mid-game fighter: four guns, solid shields, tough hull.
    id: 'mantis',
    size: 'large',
    shipClass: 'military',
    price: 95000,
    cargoBays: 18,
    ...slotsFor('large', 'military'),     // W4 S3 G2
    crewQuarters: 2,
    fuelTanks: 16,
    hullStrength: 140,
    fuelCostPerParsec: 12,
    repairCostPerUnit: 3,
    minTechLevel: 6
  },
  hornet: {
    id: 'hornet',
    size: 'large',
    shipClass: 'military',
    price: 100000,
    cargoBays: 20,
    ...slotsFor('large', 'military'),     // W4 S3 G2
    crewQuarters: 2,
    fuelTanks: 16,
    hullStrength: 150,
    fuelCostPerParsec: 15,
    repairCostPerUnit: 3,
    minTechLevel: 6
  },
  cicada: {
    // Deep-space pathfinder: five gadget bays and tanks built for the frontier.
    id: 'cicada',
    size: 'large',
    shipClass: 'explorer',
    price: 140000,
    cargoBays: 25,
    ...slotsFor('large', 'explorer'),     // W2 S2 G5
    crewQuarters: 3,
    fuelTanks: 22,
    hullStrength: 130,
    fuelCostPerParsec: 9,
    repairCostPerUnit: 3,
    minTechLevel: 6
  },
  grasshopper: {
    id: 'grasshopper',
    size: 'large',
    shipClass: 'civilian',
    price: 150000,
    cargoBays: 30,
    ...slotsFor('large', 'civilian'),     // W2 S3 G3
    crewQuarters: 3,
    fuelTanks: 15,
    hullStrength: 150,
    fuelCostPerParsec: 15,
    repairCostPerUnit: 3,
    minTechLevel: 6
  },
  centipede: {
    // Heavy freighter: enormous hold and quarters, but sluggish and lightly armed.
    id: 'centipede',
    size: 'large',
    shipClass: 'trade',
    price: 180000,
    cargoBays: 75,
    ...slotsFor('large', 'trade'),        // W2 S2 G4
    crewQuarters: 4,
    fuelTanks: 14,
    hullStrength: 160,
    fuelCostPerParsec: 18,
    repairCostPerUnit: 3,
    minTechLevel: 6
  },
  termite: {
    // Armoured industrial hauler: the heaviest shields protect the big hold.
    id: 'termite',
    size: 'large',
    shipClass: 'industrial',
    price: 225000,
    cargoBays: 60,
    ...slotsFor('large', 'industrial'),   // W2 S4 G3
    crewQuarters: 3,
    fuelTanks: 13,
    hullStrength: 200,
    fuelCostPerParsec: 20,
    repairCostPerUnit: 4,
    minTechLevel: 7
  },
  scorpion: {
    // Pure warship: five hardpoints and heavy shields on a durable hull.
    id: 'scorpion',
    size: 'capital',
    shipClass: 'military',
    price: 260000,
    cargoBays: 25,
    ...slotsFor('capital', 'military'),   // W5 S4 G2
    crewQuarters: 3,
    fuelTanks: 15,
    hullStrength: 220,
    fuelCostPerParsec: 20,
    repairCostPerUnit: 4,
    minTechLevel: 7
  },
  wasp: {
    id: 'wasp',
    size: 'capital',
    shipClass: 'civilian',
    price: 300000,
    cargoBays: 35,
    ...slotsFor('capital', 'civilian'),   // W3 S4 G4
    crewQuarters: 3,
    fuelTanks: 14,
    hullStrength: 200,
    fuelCostPerParsec: 20,
    repairCostPerUnit: 4,
    minTechLevel: 7
  },
  goliath: {
    // Colossal mining platform: five shield emitters guard a vast ore hold.
    id: 'goliath',
    size: 'capital',
    shipClass: 'industrial',
    price: 320000,
    cargoBays: 90,
    ...slotsFor('capital', 'industrial'), // W2 S5 G4
    crewQuarters: 4,
    fuelTanks: 12,
    hullStrength: 260,
    fuelCostPerParsec: 22,
    repairCostPerUnit: 5,
    minTechLevel: 7
  },
  atlas: {
    // Super-freighter: the largest hold in space, escorted or not at your peril.
    id: 'atlas',
    size: 'capital',
    shipClass: 'trade',
    price: 350000,
    cargoBays: 100,
    ...slotsFor('capital', 'trade'),      // W2 S3 G5
    crewQuarters: 4,
    fuelTanks: 13,
    hullStrength: 220,
    fuelCostPerParsec: 24,
    repairCostPerUnit: 5,
    minTechLevel: 7
  },
  monarch: {
    // Flagship expedition vessel: six gadget bays and the deepest tanks built.
    id: 'monarch',
    size: 'capital',
    shipClass: 'explorer',
    price: 360000,
    cargoBays: 30,
    ...slotsFor('capital', 'explorer'),   // W2 S3 G6
    crewQuarters: 3,
    fuelTanks: 24,
    hullStrength: 210,
    fuelCostPerParsec: 16,
    repairCostPerUnit: 5,
    minTechLevel: 7
  },
  widow: {
    // Elite flagship: heavy shields, four gadget slots and strong firepower.
    id: 'widow',
    size: 'capital',
    shipClass: 'civilian',
    price: 380000,
    cargoBays: 30,
    ...slotsFor('capital', 'civilian'),   // W3 S4 G4
    crewQuarters: 3,
    fuelTanks: 18,
    hullStrength: 240,
    fuelCostPerParsec: 18,
    repairCostPerUnit: 5,
    minTechLevel: 7
  }
}

export const SHIP_TYPE_IDS = Object.keys(SHIP_TYPES) as ShipTypeId[]

/** Bulk rank of a ship type (0 = smallest hull, 3 = capital). */
export function sizeRank(id: ShipTypeId): number {
  return SIZE_RANK[SHIP_TYPES[id].size]
}
