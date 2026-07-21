import type { Politics, PoliticsId } from '../engine/types'

// Government profiles: police/pirate/trader strengths, tech bounds, bribery,
// preferred and forbidden goods. Grounded in the original documentation.
export const POLITICS: Record<PoliticsId, Politics> = {
  anarchy: {
    id: 'anarchy',
    strengthPolice: 0,
    strengthPirates: 7,
    strengthTraders: 1,
    minTechLevel: 0,
    maxTechLevel: 5,
    bribeLevel: 7,
    wanted: 'food',
    forbidden: []
  },
  capitalist: {
    id: 'capitalist',
    strengthPolice: 2,
    strengthPirates: 1,
    strengthTraders: 7,
    minTechLevel: 4,
    maxTechLevel: 7,
    bribeLevel: 1,
    wanted: 'ore',
    forbidden: []
  },
  communist: {
    id: 'communist',
    strengthPolice: 6,
    strengthPirates: 4,
    strengthTraders: 4,
    minTechLevel: 1,
    maxTechLevel: 5,
    bribeLevel: 5,
    wanted: null,
    forbidden: []
  },
  confederacy: {
    id: 'confederacy',
    strengthPolice: 5,
    strengthPirates: 3,
    strengthTraders: 5,
    minTechLevel: 1,
    maxTechLevel: 6,
    bribeLevel: 3,
    wanted: 'games',
    forbidden: []
  },
  corporate: {
    id: 'corporate',
    strengthPolice: 6,
    strengthPirates: 2,
    strengthTraders: 7,
    minTechLevel: 5,
    maxTechLevel: 7,
    bribeLevel: 2,
    wanted: 'robots',
    forbidden: []
  },
  cybernetic: {
    id: 'cybernetic',
    strengthPolice: 7,
    strengthPirates: 7,
    strengthTraders: 5,
    minTechLevel: 6,
    maxTechLevel: 7,
    bribeLevel: 0,
    wanted: 'ore',
    forbidden: ['firearms', 'narcotics']
  },
  democracy: {
    id: 'democracy',
    strengthPolice: 3,
    strengthPirates: 2,
    strengthTraders: 5,
    minTechLevel: 3,
    maxTechLevel: 7,
    bribeLevel: 2,
    wanted: 'games',
    forbidden: []
  },
  dictatorship: {
    id: 'dictatorship',
    strengthPolice: 4,
    strengthPirates: 5,
    strengthTraders: 3,
    minTechLevel: 0,
    maxTechLevel: 7,
    bribeLevel: 6,
    wanted: null,
    forbidden: []
  },
  fascist: {
    id: 'fascist',
    strengthPolice: 7,
    strengthPirates: 7,
    strengthTraders: 1,
    minTechLevel: 4,
    maxTechLevel: 7,
    bribeLevel: 0,
    wanted: 'machines',
    forbidden: ['narcotics']
  },
  feudal: {
    id: 'feudal',
    strengthPolice: 1,
    strengthPirates: 6,
    strengthTraders: 4,
    minTechLevel: 0,
    maxTechLevel: 3,
    bribeLevel: 6,
    wanted: 'firearms',
    forbidden: []
  },
  military: {
    id: 'military',
    strengthPolice: 7,
    strengthPirates: 0,
    strengthTraders: 6,
    minTechLevel: 2,
    maxTechLevel: 7,
    bribeLevel: 0,
    wanted: 'robots',
    forbidden: ['narcotics']
  },
  monarchy: {
    id: 'monarchy',
    strengthPolice: 4,
    strengthPirates: 3,
    strengthTraders: 4,
    minTechLevel: 0,
    maxTechLevel: 5,
    bribeLevel: 4,
    wanted: 'medicine',
    forbidden: []
  },
  pacifist: {
    id: 'pacifist',
    strengthPolice: 3,
    strengthPirates: 2,
    strengthTraders: 4,
    minTechLevel: 0,
    maxTechLevel: 3,
    bribeLevel: 1,
    wanted: null,
    forbidden: ['firearms']
  },
  socialist: {
    id: 'socialist',
    strengthPolice: 2,
    strengthPirates: 5,
    strengthTraders: 3,
    minTechLevel: 0,
    maxTechLevel: 5,
    bribeLevel: 6,
    wanted: null,
    forbidden: []
  },
  satori: {
    id: 'satori',
    strengthPolice: 1,
    strengthPirates: 1,
    strengthTraders: 1,
    minTechLevel: 0,
    maxTechLevel: 1,
    bribeLevel: 0,
    wanted: null,
    forbidden: ['firearms', 'narcotics']
  },
  technocracy: {
    id: 'technocracy',
    strengthPolice: 6,
    strengthPirates: 3,
    strengthTraders: 6,
    minTechLevel: 4,
    maxTechLevel: 7,
    bribeLevel: 2,
    wanted: 'water',
    forbidden: []
  },
  theocracy: {
    id: 'theocracy',
    strengthPolice: 6,
    strengthPirates: 1,
    strengthTraders: 3,
    minTechLevel: 0,
    maxTechLevel: 4,
    bribeLevel: 0,
    wanted: 'narcotics',
    forbidden: ['firearms', 'narcotics']
  }
}

export const POLITICS_IDS = Object.keys(POLITICS) as PoliticsId[]
