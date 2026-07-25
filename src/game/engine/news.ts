import type { NewsItem, PoliticsId, SolarSystem } from './types'
import { Rng } from './rng'
import { POLITICS } from '../data/politics'

/**
 * Planetary news.
 *
 * Every settled world runs its own feed, and what is on it is drawn from what
 * is actually true of the planet: the crisis it is living through, the economy
 * it lives off, the government that runs it, and whatever oddity its special
 * resource has landed it with. A drought on an agrarian world under a
 * dictatorship reads very differently from a drought on a hi-tech democracy —
 * the harvest is gone, the Governor orders everyone to pull together, and the
 * ministry starts buying water from anyone who can haul it in.
 *
 * Stories are ids, not prose: `news.<id>.headline` and `news.<id>.body` are
 * resolved in the i18n layer like every other string the engine emits. The set
 * is regenerated on each arrival, so a planet revisited has moved on.
 */

/** Governments that answer to nobody — they get the strong-arm stories. */
const AUTHORITARIAN: PoliticsId[] = [
  'dictatorship',
  'fascist',
  'military',
  'theocracy',
  'monarchy',
  'feudal'
]

interface NewsTemplate {
  id: string
  /** Relative likelihood among the stories that apply to a planet. */
  weight: number
  tone: NewsItem['tone']
  when: (sys: SolarSystem) => boolean
  /** True for stories about the planet's current crisis — always run first. */
  crisis?: boolean
}

const isAuthoritarian = (sys: SolarSystem): boolean => AUTHORITARIAN.includes(sys.politics)

const TEMPLATES: NewsTemplate[] = [
  // --- The crisis the planet is living through -------------------------------
  {
    id: 'droughtDecree',
    weight: 5,
    tone: 'bad',
    crisis: true,
    when: (s) => s.status === 'drought' && isAuthoritarian(s)
  },
  {
    id: 'droughtRation',
    weight: 3,
    tone: 'bad',
    crisis: true,
    when: (s) => s.status === 'drought'
  },
  {
    id: 'cropFailureGranary',
    weight: 4,
    tone: 'bad',
    crisis: true,
    when: (s) => s.status === 'cropFailure'
  },
  {
    id: 'cropFailureFarmhands',
    weight: 4,
    tone: 'bad',
    crisis: true,
    when: (s) => s.status === 'cropFailure' && s.economyType === 'agricultural'
  },
  {
    id: 'plagueQuarantine',
    weight: 4,
    tone: 'bad',
    crisis: true,
    when: (s) => s.status === 'plague'
  },
  {
    id: 'plagueBorder',
    weight: 4,
    tone: 'bad',
    crisis: true,
    when: (s) => s.status === 'plague' && isAuthoritarian(s)
  },
  {
    id: 'warLevy',
    weight: 4,
    tone: 'bad',
    crisis: true,
    when: (s) => s.status === 'war'
  },
  {
    id: 'warBlackMarket',
    weight: 3,
    tone: 'neutral',
    crisis: true,
    when: (s) => s.status === 'war'
  },
  {
    id: 'coldSnap',
    weight: 4,
    tone: 'bad',
    crisis: true,
    when: (s) => s.status === 'cold'
  },
  {
    id: 'boredomFestival',
    weight: 4,
    tone: 'neutral',
    crisis: true,
    when: (s) => s.status === 'boredom'
  },
  {
    id: 'workerShortage',
    weight: 4,
    tone: 'bad',
    crisis: true,
    when: (s) => s.status === 'lackOfWorkers'
  },

  // --- Who is in charge, and how it feels ------------------------------------
  {
    id: 'electionSeason',
    weight: 3,
    tone: 'neutral',
    when: (s) => s.politics === 'democracy' || s.politics === 'confederacy'
  },
  {
    id: 'partyQuota',
    weight: 3,
    tone: 'neutral',
    when: (s) => s.politics === 'communist' || s.politics === 'socialist'
  },
  {
    id: 'corporateMerger',
    weight: 3,
    tone: 'neutral',
    when: (s) => s.politics === 'corporate' || s.politics === 'capitalist'
  },
  {
    id: 'piracyRife',
    weight: 4,
    tone: 'bad',
    when: (s) => s.politics === 'anarchy'
  },
  {
    id: 'templeFast',
    weight: 3,
    tone: 'neutral',
    when: (s) => s.politics === 'theocracy'
  },
  {
    id: 'royalTour',
    weight: 3,
    tone: 'neutral',
    when: (s) => s.politics === 'monarchy' || s.politics === 'feudal'
  },
  {
    id: 'cyberNet',
    weight: 3,
    tone: 'neutral',
    when: (s) => s.politics === 'cybernetic'
  },
  {
    id: 'satoriSilence',
    weight: 3,
    tone: 'neutral',
    when: (s) => s.politics === 'satori'
  },
  {
    id: 'technocratPaper',
    weight: 3,
    tone: 'good',
    when: (s) => s.politics === 'technocracy'
  },
  {
    id: 'juntaParade',
    weight: 3,
    tone: 'neutral',
    when: (s) => s.politics === 'military' || s.politics === 'fascist' || s.politics === 'dictatorship'
  },
  {
    id: 'pacifistRally',
    weight: 3,
    tone: 'good',
    when: (s) => s.politics === 'pacifist'
  },

  // --- What the planet lives off ---------------------------------------------
  {
    id: 'oreStrike',
    weight: 3,
    tone: 'neutral',
    when: (s) => s.economyType === 'mining'
  },
  {
    id: 'refineryFlare',
    weight: 3,
    tone: 'neutral',
    when: (s) => s.economyType === 'refinery'
  },
  {
    id: 'resortSeason',
    weight: 3,
    tone: 'good',
    when: (s) => s.economyType === 'resort'
  },
  {
    id: 'factoryQuota',
    weight: 3,
    tone: 'good',
    when: (s) => s.economyType === 'industrial'
  },
  {
    id: 'harvestBumper',
    weight: 4,
    tone: 'good',
    when: (s) => s.economyType === 'agricultural' && s.status === 'uneventful'
  },
  {
    id: 'hiTechLaunch',
    weight: 3,
    tone: 'good',
    when: (s) => s.economyType === 'hiTech'
  },

  // --- Local oddities ---------------------------------------------------------
  {
    id: 'gemRush',
    weight: 4,
    tone: 'good',
    when: (s) => s.specialResource === 'mineralRich'
  },
  {
    id: 'mushroomBloom',
    weight: 4,
    tone: 'neutral',
    when: (s) => s.specialResource === 'weirdMushrooms'
  },
  {
    id: 'herbHarvest',
    weight: 4,
    tone: 'good',
    when: (s) => s.specialResource === 'lotsOfHerbs'
  },
  {
    id: 'artFestival',
    weight: 4,
    tone: 'good',
    when: (s) => s.specialResource === 'artistic'
  },
  {
    id: 'warGames',
    weight: 4,
    tone: 'neutral',
    when: (s) => s.specialResource === 'warlike'
  },
  {
    id: 'springBottling',
    weight: 4,
    tone: 'good',
    when: (s) => s.specialResource === 'sweetwater'
  },
  {
    id: 'dustStorm',
    weight: 4,
    tone: 'bad',
    when: (s) => s.specialResource === 'desert'
  },

  // --- Anywhere ---------------------------------------------------------------
  {
    id: 'pirateSighting',
    weight: 3,
    tone: 'bad',
    when: (s) => POLITICS[s.politics].strengthPirates >= 5
  },
  {
    id: 'patrolCrackdown',
    weight: 3,
    tone: 'neutral',
    when: (s) => POLITICS[s.politics].strengthPolice >= 5
  },
  {
    id: 'traderInflux',
    weight: 3,
    tone: 'good',
    when: (s) => POLITICS[s.politics].strengthTraders >= 5
  },
  {
    id: 'stationTraffic',
    weight: 3,
    tone: 'neutral',
    when: (s) => (s.bodies ?? []).some((b) => b.kind === 'station')
  },
  { id: 'dockStrike', weight: 2, tone: 'bad', when: () => true },
  { id: 'quietWeek', weight: 2, tone: 'neutral', when: (s) => s.status === 'uneventful' }
]

/** Fewest and most stories a planet's feed carries at once. */
export const NEWS_MIN = 2
export const NEWS_MAX = 4

function toItem(template: NewsTemplate): NewsItem {
  return {
    id: template.id,
    headlineKey: `news.${template.id}.headline`,
    bodyKey: `news.${template.id}.body`,
    tone: template.tone
  }
}

/** Draw one story from a weighted pool, removing it so it cannot repeat. */
function drawOne(pool: NewsTemplate[], rng: Rng): NewsTemplate | null {
  if (pool.length === 0) return null
  const total = pool.reduce((sum, t) => sum + t.weight, 0)
  let roll = rng.int(0, total - 1)
  for (let i = 0; i < pool.length; i++) {
    if (roll < pool[i].weight) return pool.splice(i, 1)[0]
    roll -= pool[i].weight
  }
  return pool.splice(pool.length - 1, 1)[0]
}

/**
 * Today's feed for a planet. A world in crisis always leads with the crisis;
 * the rest of the bulletin is drawn from everything else that fits.
 */
export function generateNews(sys: SolarSystem, rng: Rng): NewsItem[] {
  const applicable = TEMPLATES.filter((t) => t.when(sys))
  const crisis = applicable.filter((t) => t.crisis)
  const rest = applicable.filter((t) => !t.crisis)

  const items: NewsItem[] = []
  // The crisis is the story of the day; lead with one, and often a second.
  const lead = drawOne(crisis, rng)
  if (lead) items.push(toItem(lead))
  if (crisis.length > 0 && rng.chance(0.5)) {
    const second = drawOne(crisis, rng)
    if (second) items.push(toItem(second))
  }

  const want = rng.int(NEWS_MIN, NEWS_MAX)
  while (items.length < want) {
    const next = drawOne(rest, rng)
    if (!next) break
    items.push(toItem(next))
  }
  return items
}

/** Stories a planet is running, tolerating saves written before news existed. */
export function systemNews(sys: SolarSystem | undefined): NewsItem[] {
  return sys?.news ?? []
}
