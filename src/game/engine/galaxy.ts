import type {
  SolarSystem,
  TechLevel,
  SpecialResource,
  SystemStatus,
  PoliticsId,
  EconomyType,
  MineSite,
  SystemBody,
  BarrenTerrain,
  StarClass,
  StationKind
} from './types'
import { Rng } from './rng'
import { POLITICS, POLITICS_IDS } from '../data/politics'
import { ECONOMIES, ECONOMY_IDS } from '../data/economies'
import { SYSTEM_NAMES } from '../data/systemNames'
import { GOOD_IDS } from '../data/goods'
import { MERCENARY_IDS } from '../data/mercenaries'

export const GALAXY_WIDTH = 260
export const GALAXY_HEIGHT = 190
export const SYSTEM_COUNT = 140
export const MIN_SYSTEM_DISTANCE = 8

/** Stable pairs of wormholes: each one links two systems, both ways. */
export const WORMHOLE_PAIRS = 12
/**
 * Systems hosting an unmapped wormhole. Unlike a surveyed one it has no fixed
 * far end: it spits a ship out wherever it feels like, anywhere on the chart.
 */
export const UNSTABLE_WORMHOLES = 14

/** Most bodies a star system can hold, capital planet included. */
export const MAX_SYSTEM_BODIES = 7

const SPECIAL_RESOURCES: SpecialResource[] = [
  'none', 'none', 'none', // weight "none" more heavily
  'mineralRich', 'mineralPoor', 'desert', 'sweetwater', 'richSoil',
  'poorSoil', 'richFauna', 'lifeless', 'weirdMushrooms', 'lotsOfHerbs',
  'artistic', 'warlike'
]

const STATUSES: SystemStatus[] = [
  'uneventful', 'uneventful', 'uneventful', 'uneventful', 'uneventful',
  'uneventful', 'uneventful', 'uneventful', 'uneventful', 'uneventful',
  'war', 'plague', 'drought', 'boredom', 'cold', 'cropFailure', 'lackOfWorkers'
]

/** Hotter stars first; weighted so ordinary yellow/orange suns dominate. */
const STAR_CLASSES: StarClass[] = [
  'blue', 'white', 'white', 'yellow', 'yellow', 'yellow', 'orange', 'orange', 'red', 'red'
]

/** Surfaces an uninhabited world can have, and what can be dug out of each. */
const BARREN_TERRAINS: BarrenTerrain[] = [
  'asteroidBelt', 'gasGiant', 'iceMoon', 'rockyMoon', 'lavaWorld', 'dustWorld'
]

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Fisher–Yates shuffle on a copy, driven by the seeded rng. */
function shuffled<T>(arr: readonly T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pick a government whose tech-level bounds contain `tech`. */
function pickPolitics(rng: Rng, tech: TechLevel): PoliticsId {
  const valid = POLITICS_IDS.filter((id) => {
    const p = POLITICS[id]
    return tech >= p.minTechLevel && tech <= p.maxTechLevel
  })
  return valid.length ? rng.pick(valid) : 'anarchy'
}

/** Pick a mineable site for a system, themed by its special resource. */
function pickMineSite(rng: Rng, resource: SpecialResource): MineSite | null {
  // Mineral worlds are ringed by asteroids; watery worlds have ice fields.
  if (resource === 'mineralRich') return { kind: 'asteroidField', resource: 'ore', richness: 12 }
  if (resource === 'mineralPoor' || resource === 'lifeless')
    return { kind: 'asteroidField', resource: 'ore', richness: 7 }
  if (resource === 'sweetwater') return { kind: 'iceField', resource: 'water', richness: 12 }
  // Otherwise, some systems host a gas giant you can scoop fuel from.
  if (rng.chance(0.22)) return { kind: 'gasGiant', resource: 'fuel', richness: 10 }
  return null
}

/** What, if anything, can be extracted from an uninhabited world. */
function mineSiteForTerrain(terrain: BarrenTerrain, rng: Rng): MineSite | null {
  switch (terrain) {
    case 'asteroidBelt':
      return { kind: 'asteroidField', resource: 'ore', richness: rng.int(9, 15) }
    case 'gasGiant':
      return { kind: 'gasGiant', resource: 'fuel', richness: rng.int(8, 14) }
    case 'iceMoon':
      return { kind: 'iceField', resource: 'water', richness: rng.int(8, 14) }
    case 'lavaWorld':
      // Fresh crust, and metals close enough to the surface to be worth landing for.
      return { kind: 'asteroidField', resource: 'ore', richness: rng.int(5, 10) }
    // Rock and dust: somewhere to stand, and nothing else.
    default:
      return null
  }
}

/**
 * Which speciality a station in this system would have. Stations follow the
 * work: research orbits the high-tech worlds, weapons yards the militarised
 * ones, and heavy fabrication the systems already digging and refining.
 */
function pickStationKind(
  rng: Rng,
  tech: TechLevel,
  politics: PoliticsId,
  economy: EconomyType
): StationKind {
  const weights: Array<[StationKind, number]> = [
    ['science', tech >= 6 ? 4 : 1],
    [
      'military',
      politics === 'military' || politics === 'dictatorship' || politics === 'fascist' ? 5 : 1
    ],
    ['engineering', economy === 'industrial' || economy === 'refinery' || economy === 'mining' ? 4 : 1]
  ]
  const total = weights.reduce((sum, [, w]) => sum + w, 0)
  let roll = rng.int(0, total - 1)
  for (const [kind, w] of weights) {
    if (roll < w) return kind
    roll -= w
  }
  return 'science'
}

/**
 * Lay out everywhere in one star system a ship can dock. Body 0 is always the
 * settled capital planet — the world the system's tech level, government and
 * market describe. The rest are the dead worlds sharing its star, and now and
 * then a station in orbit around one of them.
 */
export function generateBodies(
  rng: Rng,
  sys: Pick<SolarSystem, 'techLevel' | 'politics' | 'economyType'>
): SystemBody[] {
  const bodies: SystemBody[] = []
  // 2–7 places in the system, so no system is a single dot and none is a maze.
  const count = rng.int(2, MAX_SYSTEM_BODIES)
  // Orbits are handed out in ascending order, so the map reads outward.
  const orbits = shuffled([1, 2, 3, 4, 5, 6, 7, 8], rng).slice(0, count).sort((a, b) => a - b)

  // The capital sits somewhere habitable rather than always innermost.
  const capitalIndex = count > 2 ? rng.int(0, Math.min(count - 1, 2)) : rng.int(0, count - 1)

  // At most one station per system: they are rare, and worth crossing to.
  const hasStation = rng.chance(0.3)
  const stationIndex = hasStation
    ? shuffled(
        Array.from({ length: count }, (_, i) => i).filter((i) => i !== capitalIndex),
        rng
      )[0]
    : -1

  for (let i = 0; i < count; i++) {
    const orbit = orbits[i]
    const angle = rng.next()
    if (i === capitalIndex) {
      // The capital's own workings stay on the system record (`sys.mineSite`),
      // which is where they have always lived and where saves keep them —
      // `bodyMineSite` reads them back. Two copies would only drift apart.
      bodies.push({ id: 0, kind: 'planet', orbit, angle, mineSite: null })
      continue
    }
    if (i === stationIndex) {
      bodies.push({
        id: 0,
        kind: 'station',
        orbit,
        angle,
        station: pickStationKind(rng, sys.techLevel, sys.politics, sys.economyType),
        mineSite: null
      })
      continue
    }
    const terrain = rng.pick(BARREN_TERRAINS)
    bodies.push({
      id: 0,
      kind: 'barren',
      orbit,
      angle,
      terrain,
      mineSite: mineSiteForTerrain(terrain, rng)
    })
  }

  // The capital always comes first, so index 0 is where a ship makes port.
  const capital = bodies.splice(capitalIndex, 1)[0]
  bodies.unshift(capital)
  bodies.forEach((b, i) => (b.id = i))
  return bodies
}

/**
 * Fill in bodies (and a star) for any system that has none. New galaxies get
 * them at generation; this is what brings a save written before star systems
 * had insides up to date. Seeded off the galaxy seed and the system id, so the
 * same save always grows the same worlds.
 */
export function ensureBodies(seed: number, systems: SolarSystem[]): void {
  for (const sys of systems) {
    if (sys.bodies && sys.bodies.length > 0 && sys.starClass) continue
    const rng = new Rng((seed ^ ((sys.id + 1) * 0x9e3779b1)) >>> 0)
    if (!sys.starClass) sys.starClass = rng.pick(STAR_CLASSES)
    if (!sys.bodies || sys.bodies.length === 0) sys.bodies = generateBodies(rng, sys)
  }
}

/** Pick a planet economy whose typical tech band contains `tech`. */
function pickEconomy(rng: Rng, tech: TechLevel): EconomyType {
  const valid = ECONOMY_IDS.filter((id) => {
    const e = ECONOMIES[id]
    return tech >= e.techMin && tech <= e.techMax
  })
  return valid.length ? rng.pick(valid) : 'agricultural'
}

function emptyGoodRecord(): Record<string, number> {
  const rec: Record<string, number> = {}
  for (const g of GOOD_IDS) rec[g] = 0
  return rec
}

export function generateGalaxy(seed: number): SolarSystem[] {
  const rng = new Rng(seed)
  const systems: SolarSystem[] = []
  const names = shuffled(SYSTEM_NAMES, rng)

  let attempts = 0
  while (systems.length < SYSTEM_COUNT && attempts < SYSTEM_COUNT * 200) {
    attempts++
    const x = rng.int(10, GALAXY_WIDTH - 10)
    const y = rng.int(10, GALAXY_HEIGHT - 10)
    if (systems.some((s) => distance(s, { x, y }) < MIN_SYSTEM_DISTANCE)) continue

    const tech = rng.int(0, 7) as TechLevel
    const politics = pickPolitics(rng, tech)
    const id = systems.length
    const specialResource = rng.pick(SPECIAL_RESOURCES)
    const economyType = pickEconomy(rng, tech)
    const mineSite = pickMineSite(rng, specialResource)
    const sys: SolarSystem = {
      id,
      nameId: names[id % names.length],
      x,
      y,
      techLevel: tech,
      politics,
      specialResource,
      economyType,
      mineSite,
      starClass: rng.pick(STAR_CLASSES),
      status: rng.pick(STATUSES),
      qty: emptyGoodRecord() as SolarSystem['qty'],
      buyPrice: emptyGoodRecord() as SolarSystem['buyPrice'],
      sellPrice: emptyGoodRecord() as SolarSystem['sellPrice'],
      visited: false,
      wormholeTo: null,
      mercenaryIds: [],
      questBoard: [],
      news: []
    }
    sys.bodies = generateBodies(rng, sys)
    systems.push(sys)
  }

  // Seed each hiring hall. Rosters are refreshed properly on every arrival;
  // this just means an unvisited system is never empty when first reached.
  for (const sys of systems) {
    const size = rng.int(1, 3)
    const hall: string[] = []
    while (hall.length < size) {
      const id = rng.pick(MERCENARY_IDS)
      if (!hall.includes(id)) hall.push(id)
    }
    sys.mercenaryIds = hall
  }

  // Surveyed wormholes: fixed pairs linking distant systems, both ways.
  const pool = shuffled(systems, rng)
  for (let i = 0; i + 1 < WORMHOLE_PAIRS * 2 && i + 1 < pool.length; i += 2) {
    pool[i].wormholeTo = pool[i + 1].id
    pool[i + 1].wormholeTo = pool[i].id
  }

  // Unmapped ones: no far end until a ship goes through. Never in a system
  // that already has a surveyed wormhole — one hole per sky is plenty.
  let placed = 0
  for (const sys of pool) {
    if (placed >= UNSTABLE_WORMHOLES) break
    if (sys.wormholeTo !== null) continue
    sys.unstableWormhole = true
    placed++
  }

  return systems
}

export { distance }
