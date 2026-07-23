// Core domain types for the Star Trader engine.
// The engine is pure TypeScript with no UI/Electron dependencies.
// All human-readable text lives in the i18n layer; the engine uses stable IDs.

export type TechLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
export const TECH_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7] as const
export const TECH_LEVEL_IDS = [
  'preAgricultural',
  'agricultural',
  'medieval',
  'renaissance',
  'earlyIndustrial',
  'industrial',
  'postIndustrial',
  'hiTech'
] as const
export type TechLevelId = (typeof TECH_LEVEL_IDS)[number]

// --- Trade goods -------------------------------------------------------------
export type GoodId =
  | 'water'
  | 'furs'
  | 'food'
  | 'ore'
  | 'games'
  | 'firearms'
  | 'medicine'
  | 'machines'
  | 'narcotics'
  | 'robots'

export interface TradeGood {
  id: GoodId
  /** Minimum system tech level required to *produce* (and thus buy cheaply). */
  techProduction: TechLevel
  /** Minimum system tech level required to *use* (and thus be able to sell there). */
  techUsage: TechLevel
  /** Base price at tech level 0. */
  basePrice: number
  /** Price change per tech level (positive: natural goods; negative: industrial). */
  pricePerTech: number
  /** Random per-visit variance (+/- credits). */
  variance: number
  /** System status that spikes this good's price. */
  spikeStatus: SystemStatus | null
  /** Special resource that makes this good cheap here. */
  cheapResource: SpecialResource | null
  /** Special resource that makes this good expensive here. */
  expensiveResource: SpecialResource | null
  /** Illegal to carry (police will impound): firearms & narcotics. */
  illegal: boolean
  /** Documented typical trading range, for reference/avg list. */
  minPrice: number
  maxPrice: number
}

// --- Political systems -------------------------------------------------------
export type PoliticsId =
  | 'anarchy'
  | 'capitalist'
  | 'communist'
  | 'confederacy'
  | 'corporate'
  | 'cybernetic'
  | 'democracy'
  | 'dictatorship'
  | 'fascist'
  | 'feudal'
  | 'military'
  | 'monarchy'
  | 'pacifist'
  | 'socialist'
  | 'satori'
  | 'technocracy'
  | 'theocracy'

export interface Politics {
  id: PoliticsId
  /** 0..7 relative strength of police presence. */
  strengthPolice: number
  /** 0..7 relative strength of pirate presence. */
  strengthPirates: number
  /** 0..7 relative strength of trader traffic. */
  strengthTraders: number
  /** Minimum tech level a system needs for this government. */
  minTechLevel: TechLevel
  /** Maximum tech level this government tolerates. */
  maxTechLevel: TechLevel
  /** How corruptible officials are (0 = incorruptible, 7 = easily bribed). */
  bribeLevel: number
  /** Good this government especially wants (sells for more). */
  wanted: GoodId | null
  /** Goods this government forbids (cannot be sold openly). */
  forbidden: GoodId[]
}

// --- Special resources & statuses -------------------------------------------
export type SpecialResource =
  | 'none'
  | 'mineralRich'
  | 'mineralPoor'
  | 'desert'
  | 'sweetwater'
  | 'richSoil'
  | 'poorSoil'
  | 'richFauna'
  | 'lifeless'
  | 'weirdMushrooms'
  | 'lotsOfHerbs'
  | 'artistic'
  | 'warlike'

export type SystemStatus =
  | 'uneventful'
  | 'war'
  | 'plague'
  | 'drought'
  | 'boredom'
  | 'cold'
  | 'cropFailure'
  | 'lackOfWorkers'

// --- Economy / planet type ---------------------------------------------------
// A planet's economic specialisation. Shifts commodity prices (cheap where a
// good is produced, dear where it must be imported) and the local fuel price.
export type EconomyType =
  | 'agricultural'
  | 'mining'
  | 'industrial'
  | 'refinery'
  | 'resort'
  | 'hiTech'

// --- Ships & equipment -------------------------------------------------------
export type ShipTypeId =
  | 'flea'
  | 'gnat'
  | 'dragonfly'
  | 'firefly'
  | 'mosquito'
  | 'locust'
  | 'bumblebee'
  | 'beetle'
  | 'mantis'
  | 'hornet'
  | 'grasshopper'
  | 'centipede'
  | 'termite'
  | 'scorpion'
  | 'wasp'
  | 'widow'

export interface ShipType {
  id: ShipTypeId
  price: number
  cargoBays: number
  weaponSlots: number
  shieldSlots: number
  gadgetSlots: number
  crewQuarters: number
  fuelTanks: number // max range in parsecs
  hullStrength: number
  fuelCostPerParsec: number
  repairCostPerUnit: number
  /** Minimum tech level for a shipyard to sell this ship. */
  minTechLevel: TechLevel
}

export type WeaponId = 'pulse' | 'beam' | 'plasma' | 'military' | 'fusion'
export type ShieldId = 'energy' | 'reflective' | 'deflector'
export type GadgetId =
  | 'cargoBays'
  | 'autoRepair'
  | 'navigation'
  | 'targeting'
  | 'cloaking'
  | 'fuelCompactor'
  | 'hiddenCompartment'

export interface Weapon {
  id: WeaponId
  power: number
  price: number
  minTechLevel: TechLevel
}
export interface Shield {
  id: ShieldId
  power: number
  price: number
  minTechLevel: TechLevel
}
export interface Gadget {
  id: GadgetId
  price: number
  minTechLevel: TechLevel
}

// --- Runtime state -----------------------------------------------------------
export interface SolarSystem {
  id: number
  nameId: string
  x: number
  y: number
  techLevel: TechLevel
  politics: PoliticsId
  specialResource: SpecialResource
  /** Economic specialisation of the planet (agricultural, industrial, …). */
  economyType: EconomyType
  status: SystemStatus
  /** Current quantity available at market, keyed by good. */
  qty: Record<GoodId, number>
  /** Current buy prices (what you pay). Empty entry = not sold here. */
  buyPrice: Record<GoodId, number>
  /** Current sell prices (what you get). 0 = not accepted here. */
  sellPrice: Record<GoodId, number>
  /** Whether the player has visited (revealed on chart). */
  visited: boolean
  /** Optional wormhole destination system id. */
  wormholeTo: number | null
  /** Mercenary currently available for hire here, if any. */
  mercenaryId: string | null
}

export interface Ship {
  type: ShipTypeId
  hull: number // current hull points
  fuel: number // current fuel (parsecs)
  cargo: Record<GoodId, number>
  weapons: WeaponId[]
  shields: ShieldId[]
  shieldPoints: number[] // current charge per shield
  gadgets: GadgetId[]
  crew: string[] // mercenary ids occupying quarters (excluding commander)
  escapePod: boolean
}

export interface Skills {
  pilot: number
  fighter: number
  trader: number
  engineer: number
}

/** A hireable crew member with fixed skills and a daily wage. */
export interface Mercenary {
  id: string
  skills: Skills
  /** Daily wage in credits. */
  wage: number
}

export interface PlayerRecord {
  policeRecord: number // negative = criminal, positive = clean/hero
  reputation: number // combat reputation score
}

export interface GameState {
  seed: number
  day: number
  credits: number
  debt: number
  commanderName: string
  skills: Skills
  ship: Ship
  record: PlayerRecord
  currentSystem: number
  systems: SolarSystem[]
  /** Insurance active flag + accumulated no-claim days. */
  insurance: boolean
  noClaim: number
  /** When true, the tank is filled automatically on each arrival. */
  autoRefuel: boolean
  /** Purchase cost bookkeeping per good for profit display. */
  buyingPrice: Record<GoodId, number>
  /** Log of notable events, newest first (ids + params resolved in UI). */
  log: LogEntry[]
  /** Quest / event progress flags keyed by id. */
  flags: Record<string, number>
  /** Accepted and completed quests. */
  quests: Quest[]
  version: number
}

export interface LogEntry {
  day: number
  key: string
  params?: Record<string, string | number>
}

// --- Quests ------------------------------------------------------------------
export type QuestType =
  | 'delivery'
  | 'relief'
  | 'bounty'
  | 'passenger'
  | 'smuggle'
  | 'fetch'
export type QuestStatus = 'offered' | 'active' | 'completed'

export interface Quest {
  id: string
  type: QuestType
  giverSystem: number
  targetSystem: number
  reward: number
  status: QuestStatus
  /** relief / smuggle / fetch: good and amount that must be delivered. */
  good?: GoodId
  amount?: number
  /** bounty: name of the wanted pirate to destroy. */
  bountyName?: string
  /** passenger: name of the VIP being transported. */
  passengerName?: string
}
