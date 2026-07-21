import type { TradeGood, GoodId } from '../engine/types'

// Prices grounded in the original Space Trader documentation's typical ranges.
// pricePerTech: natural resources rise with tech level, industrial goods fall.
export const TRADE_GOODS: Record<GoodId, TradeGood> = {
  water: {
    id: 'water',
    techProduction: 0,
    techUsage: 0,
    basePrice: 30,
    pricePerTech: 3,
    variance: 4,
    spikeStatus: 'drought',
    cheapResource: 'sweetwater',
    expensiveResource: 'desert',
    illegal: false,
    minPrice: 30,
    maxPrice: 54
  },
  furs: {
    id: 'furs',
    techProduction: 0,
    techUsage: 0,
    basePrice: 250,
    pricePerTech: 10,
    variance: 10,
    spikeStatus: 'cold',
    cheapResource: 'richFauna',
    expensiveResource: 'lifeless',
    illegal: false,
    minPrice: 250,
    maxPrice: 320
  },
  food: {
    id: 'food',
    techProduction: 1,
    techUsage: 0,
    basePrice: 105,
    pricePerTech: 5,
    variance: 5,
    spikeStatus: 'cropFailure',
    cheapResource: 'richSoil',
    expensiveResource: 'poorSoil',
    illegal: false,
    minPrice: 105,
    maxPrice: 135
  },
  ore: {
    id: 'ore',
    techProduction: 2,
    techUsage: 2,
    basePrice: 350,
    pricePerTech: 20,
    variance: 10,
    spikeStatus: 'war',
    cheapResource: 'mineralRich',
    expensiveResource: 'mineralPoor',
    illegal: false,
    minPrice: 390,
    maxPrice: 490
  },
  games: {
    id: 'games',
    techProduction: 3,
    techUsage: 1,
    basePrice: 250,
    pricePerTech: -10,
    variance: 5,
    spikeStatus: 'boredom',
    cheapResource: 'artistic',
    expensiveResource: null,
    illegal: false,
    minPrice: 180,
    maxPrice: 240
  },
  firearms: {
    id: 'firearms',
    techProduction: 3,
    techUsage: 1,
    basePrice: 1250,
    pricePerTech: -75,
    variance: 100,
    spikeStatus: 'war',
    cheapResource: 'warlike',
    expensiveResource: null,
    illegal: true,
    minPrice: 725,
    maxPrice: 1175
  },
  medicine: {
    id: 'medicine',
    techProduction: 4,
    techUsage: 1,
    basePrice: 650,
    pricePerTech: -20,
    variance: 10,
    spikeStatus: 'plague',
    cheapResource: 'lotsOfHerbs',
    expensiveResource: null,
    illegal: false,
    minPrice: 510,
    maxPrice: 630
  },
  machines: {
    id: 'machines',
    techProduction: 4,
    techUsage: 3,
    basePrice: 900,
    pricePerTech: -30,
    variance: 5,
    spikeStatus: 'lackOfWorkers',
    cheapResource: null,
    expensiveResource: null,
    illegal: false,
    minPrice: 690,
    maxPrice: 810
  },
  narcotics: {
    id: 'narcotics',
    techProduction: 5,
    techUsage: 0,
    basePrice: 3500,
    pricePerTech: -125,
    variance: 150,
    spikeStatus: 'boredom',
    cheapResource: 'weirdMushrooms',
    expensiveResource: null,
    illegal: true,
    minPrice: 2625,
    maxPrice: 3500
  },
  robots: {
    id: 'robots',
    techProduction: 6,
    techUsage: 4,
    basePrice: 5000,
    pricePerTech: -150,
    variance: 100,
    spikeStatus: 'lackOfWorkers',
    cheapResource: null,
    expensiveResource: null,
    illegal: false,
    minPrice: 3950,
    maxPrice: 4400
  }
}

export const GOOD_IDS = Object.keys(TRADE_GOODS) as GoodId[]
