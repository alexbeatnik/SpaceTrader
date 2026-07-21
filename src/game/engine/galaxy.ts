import type {
  SolarSystem,
  TechLevel,
  SpecialResource,
  SystemStatus,
  PoliticsId
} from './types'
import { Rng } from './rng'
import { POLITICS, POLITICS_IDS } from '../data/politics'
import { SYSTEM_NAMES } from '../data/systemNames'
import { GOOD_IDS } from '../data/goods'

export const GALAXY_WIDTH = 150
export const GALAXY_HEIGHT = 110
export const SYSTEM_COUNT = 60
export const MIN_SYSTEM_DISTANCE = 8

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

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Pick a government whose tech-level bounds contain `tech`. */
function pickPolitics(rng: Rng, tech: TechLevel): PoliticsId {
  const valid = POLITICS_IDS.filter((id) => {
    const p = POLITICS[id]
    return tech >= p.minTechLevel && tech <= p.maxTechLevel
  })
  return valid.length ? rng.pick(valid) : 'anarchy'
}

function emptyGoodRecord(): Record<string, number> {
  const rec: Record<string, number> = {}
  for (const g of GOOD_IDS) rec[g] = 0
  return rec
}

export function generateGalaxy(seed: number): SolarSystem[] {
  const rng = new Rng(seed)
  const systems: SolarSystem[] = []
  const names = [...SYSTEM_NAMES]

  // Shuffle names so each galaxy uses a distinct subset/order.
  for (let i = names.length - 1; i > 0; i--) {
    const j = rng.int(0, i)
    ;[names[i], names[j]] = [names[j], names[i]]
  }

  let attempts = 0
  while (systems.length < SYSTEM_COUNT && attempts < SYSTEM_COUNT * 200) {
    attempts++
    const x = rng.int(10, GALAXY_WIDTH - 10)
    const y = rng.int(10, GALAXY_HEIGHT - 10)
    if (systems.some((s) => distance(s, { x, y }) < MIN_SYSTEM_DISTANCE)) continue

    const tech = rng.int(0, 7) as TechLevel
    const politics = pickPolitics(rng, tech)
    const id = systems.length
    systems.push({
      id,
      nameId: names[id % names.length],
      x,
      y,
      techLevel: tech,
      politics,
      specialResource: rng.pick(SPECIAL_RESOURCES),
      status: rng.pick(STATUSES),
      qty: emptyGoodRecord() as SolarSystem['qty'],
      buyPrice: emptyGoodRecord() as SolarSystem['buyPrice'],
      sellPrice: emptyGoodRecord() as SolarSystem['sellPrice'],
      visited: false,
      wormholeTo: null
    })
  }

  // Create a few wormholes linking distant systems.
  const wormholeCount = 6
  const pool = [...systems].sort(() => rng.next() - 0.5)
  for (let i = 0; i + 1 < wormholeCount * 2 && i + 1 < pool.length; i += 2) {
    pool[i].wormholeTo = pool[i + 1].id
    pool[i + 1].wormholeTo = pool[i].id
  }

  return systems
}

export { distance }
