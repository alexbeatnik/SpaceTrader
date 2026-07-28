// Core domain types for the Space Trader engine.
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
  // Exotic goods produced only where a matching special resource exists.
  | 'gems'
  | 'springWater'
  | 'delicacies'
  | 'pelts'
  | 'mushrooms'
  | 'herbs'
  | 'artwork'
  | 'relics'

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
  /**
   * Exotic good: produced (and cheaply buyable) only on planets whose special
   * resource matches this. Undefined for ordinary, tech-produced goods.
   */
  producedByResource?: SpecialResource
  /** Special resource whose planets crave this exotic good and pay a premium. */
  wantedByResource?: SpecialResource
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

// --- Mining ------------------------------------------------------------------
export type MineKind = 'asteroidField' | 'gasGiant' | 'iceField'

/** A mineable site near a planet (asteroids, a gas giant, an ice field). */
export interface MineSite {
  kind: MineKind
  /** Extracted resource: a good id, or 'fuel' scooped straight into the tank. */
  resource: GoodId | 'fuel'
  /** Relative richness; scales the chance of a rare bonus while mining. */
  richness: number
}

// --- Bodies inside a star system ---------------------------------------------
/**
 * A star system is not one dot on the chart but a handful of places to dock at:
 * the settled capital planet, the dead rocks and gas giants that share its star,
 * and the occasional orbital station. Warp drives do not work this far down a
 * gravity well, so moving between them burns days on the impulse drive.
 */
export type BodyKind = 'planet' | 'barren' | 'station'

/** The three kinds of orbital station, each with its own speciality. */
export type StationKind = 'science' | 'military' | 'engineering'
export const STATION_KINDS = ['science', 'military', 'engineering'] as const

/** Surface of an uninhabited world — flavour, and what can be dug out of it. */
export type BarrenTerrain =
  | 'asteroidBelt'
  | 'gasGiant'
  | 'iceMoon'
  | 'rockyMoon'
  | 'lavaWorld'
  | 'dustWorld'

/** Spectral class of a system's star. Cosmetic: it colours the system map. */
export type StarClass = 'blue' | 'white' | 'yellow' | 'orange' | 'red'

export interface SystemBody {
  /** Index into the owning system's `bodies` array. 0 is always the capital. */
  id: number
  kind: BodyKind
  /**
   * Orbit index, 1 = innermost. Drives both the system-map layout and how long
   * the impulse run between two bodies takes.
   */
  orbit: number
  /** Position around the star in turns (0..1). Layout only. */
  angle: number
  /** Station speciality, for `kind === 'station'`. */
  station?: StationKind
  /** Surface type, for `kind === 'barren'`. */
  terrain?: BarrenTerrain
  /** A mineable site here, if any. */
  mineSite: MineSite | null
}

// --- Planetary news ----------------------------------------------------------
/**
 * A story running on a planet's feeds, generated from what is actually true of
 * it — its economy, its government, and whatever crisis it is living through.
 * Like everything else in the engine this carries ids, not prose.
 */
export interface NewsItem {
  id: string
  /** i18n key for the headline. */
  headlineKey: string
  /** i18n key for the story. */
  bodyKey: string
  params?: Record<string, string | number>
  /** How the story reads for a trader passing through. */
  tone: 'good' | 'bad' | 'neutral'
}

// --- Ships & equipment -------------------------------------------------------

/** Physical hull size — governs base slot capacity and docking restrictions. */
export type ShipSize = 'small' | 'medium' | 'large' | 'capital'
export const SHIP_SIZES = ['small', 'medium', 'large', 'capital'] as const

/**
 * Functional role of the hull — determines equipment slot distribution and
 * grants a class perk:
 *
 * military   — most weapon & shield slots; +15% weapon damage in combat.
 * trade      — biggest cargo holds and plenty of gadget slots.
 * civilian   — balanced slots, no extremes; cheap all-rounders.
 * explorer   — most gadget slots and long-range tanks; +3 parsecs warp range.
 * industrial — heavy shields and utility slots; mines 2 units per day.
 */
export type ShipClass = 'military' | 'trade' | 'civilian' | 'explorer' | 'industrial'
export const SHIP_CLASSES = ['military', 'trade', 'civilian', 'explorer', 'industrial'] as const

export type ShipTypeId =
  | 'flea'
  | 'gnat'
  | 'ant'
  | 'dragonfly'
  | 'ladybird'
  | 'firefly'
  | 'mosquito'
  | 'weevil'
  | 'locust'
  | 'moth'
  | 'bumblebee'
  | 'beetle'
  | 'mantis'
  | 'hornet'
  | 'cicada'
  | 'grasshopper'
  | 'centipede'
  | 'termite'
  | 'scorpion'
  | 'wasp'
  | 'goliath'
  | 'atlas'
  | 'monarch'
  | 'widow'

export interface ShipType {
  id: ShipTypeId
  /** Physical hull size category. */
  size: ShipSize
  /** Functional role / class of the hull. */
  shipClass: ShipClass
  price: number
  cargoBays: number
  weaponSlots: number
  shieldSlots: number
  gadgetSlots: number
  /** Berths aboard, including the commander's own. */
  crewQuarters: number
  /**
   * Hands the hull needs to run properly, commander included. Only the Flea is
   * built for a single pilot; anything larger is undercrewed without help, and
   * an overloaded crew invites incidents.
   */
  minCrew: number
  fuelTanks: number // max range in parsecs
  hullStrength: number
  fuelCostPerParsec: number
  repairCostPerUnit: number
  /** Minimum tech level for a shipyard to sell this ship. */
  minTechLevel: TechLevel
}

export type WeaponId =
  | 'pulse'
  | 'beam'
  | 'plasma'
  | 'military'
  | 'fusion'
  // Station-grade ordnance, built in orbital yards only.
  | 'railgun'
  | 'singularity'
export type ShieldId = 'energy' | 'reflective' | 'deflector' | 'barrier'
export type GadgetId =
  | 'cargoBays'
  | 'autoRepair'
  | 'navigation'
  | 'targeting'
  | 'cloaking'
  | 'fuelCompactor'
  | 'hiddenCompartment'
  // Station-grade modules. No planetary yard has the fabricators for these.
  | 'nanoHold'
  | 'quantumCompactor'
  | 'aiHelm'
  | 'battleComputer'
  | 'nanoForge'

export interface Weapon {
  id: WeaponId
  power: number
  price: number
  minTechLevel: TechLevel
  /** Built only in orbit: sold at stations, never at a planetary yard. */
  stationOnly?: boolean
}
export interface Shield {
  id: ShieldId
  power: number
  price: number
  minTechLevel: TechLevel
  stationOnly?: boolean
}
export interface Gadget {
  id: GadgetId
  price: number
  minTechLevel: TechLevel
  stationOnly?: boolean
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
  /**
   * An unmapped wormhole hangs in this system: it goes *somewhere*, and which
   * somewhere is only settled the moment a ship falls into it.
   */
  unstableWormhole?: boolean
  /**
   * Hands looking for a berth at this planet's hiring hall, refreshed on
   * arrival. Optional so saves written before hiring halls existed still load.
   */
  mercenaryIds?: string[]
  /** Assignments posted on this planet's job board (refreshed on arrival). */
  questBoard: Quest[]
  /** A mineable site at the capital planet itself, if any. */
  mineSite: MineSite | null
  /**
   * Everywhere in this system a ship can dock, capital planet first. Optional
   * so saves written before star systems had more than one place in them still
   * load — `ensureBodies` fills them in on load.
   */
  bodies?: SystemBody[]
  /** Spectral class of the star, for the system map. */
  starClass?: StarClass
  /** What the planet's feeds are running today; refreshed on every arrival. */
  news?: NewsItem[]
}

export interface Ship {
  type: ShipTypeId
  hull: number // current hull points
  /** Reinforced-hull upgrades installed; each raises max hull. */
  hullUpgrades: number
  fuel: number // current fuel (parsecs)
  cargo: Record<GoodId, number>
  weapons: WeaponId[]
  shields: ShieldId[]
  shieldPoints: number[] // current charge per shield
  gadgets: GadgetId[]
  crew: string[] // mercenary ids occupying quarters (excluding commander)
  /** Robot ids aboard. They take berths like any crew member. */
  robots?: string[]
  escapePod: boolean
}

export interface Skills {
  pilot: number
  fighter: number
  trader: number
  engineer: number
  /** Power systems, life support and wiring — the electrician's trade. */
  electrician: number
}

/**
 * Stations that have to be manned aboard a ship. Each maps to the skill its
 * holder is judged on; an unmanned station is covered by whoever is free, at a
 * penalty, and neglected stations are what cause crew incidents.
 */
export type CrewRole = 'pilot' | 'gunner' | 'mechanic' | 'electrician'
export const CREW_ROLES = ['pilot', 'gunner', 'mechanic', 'electrician'] as const

/**
 * The trade a hand advertises at the hiring hall. Four match a shipboard
 * station; traders are hired for the markets, and generalists are the
 * jacks-of-all-trades who fill a berth without excelling anywhere.
 */
export type Profession = CrewRole | 'trader' | 'generalist'
export const PROFESSIONS = [
  'pilot',
  'gunner',
  'mechanic',
  'electrician',
  'trader',
  'generalist'
] as const

/** A hireable crew member with fixed skills and a daily wage. */
export interface Mercenary {
  id: string
  /** The trade they advertise — what you hire them for. */
  profession: Profession
  skills: Skills
  /** Daily wage in credits. */
  wage: number
}

/**
 * An android crew member. Costs as much as a decent ship and draws no wage,
 * but its power cells burn fuel every day — and a dry tank puts it to sleep.
 */
export interface Robot {
  id: string
  /** The station this model is built for. */
  profession: Profession
  skills: Skills
  price: number
  /** Minimum system tech level for a shipyard to sell this unit. */
  minTechLevel: TechLevel
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
  /**
   * Which body of the current system the ship is docked at (an index into its
   * `bodies`). Optional for save compatibility: absent means the capital
   * planet, which is where every pre-system-map save left the player.
   */
  currentBody?: number
  systems: SolarSystem[]
  /** Insurance active flag + accumulated no-claim days. */
  insurance: boolean
  noClaim: number
  /** When true, the tank is filled automatically on each arrival. */
  autoRefuel: boolean
  /** Purchase cost bookkeeping per good for profit display. */
  buyingPrice: Record<GoodId, number>
  /**
   * Units of each good obtained at the *current* planet since docking here —
   * bought from its market or mined at its site. A contract cannot be settled
   * with goods sourced at its own delivery point, so these are excluded from
   * hand-ins. Reset on every arrival.
   * Optional: saves written before this existed simply have nothing to exclude.
   */
  sourcedHere?: Record<GoodId, number>
  /**
   * Fractional fuel a ship's robots have drawn but not yet paid for. Robots
   * burn less than a whole unit a day, so the remainder is carried over.
   */
  robotDrain?: number
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
  | 'escort'
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
