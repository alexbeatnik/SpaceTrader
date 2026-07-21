import type { SolarSystem, GoodId, TradeGood } from './types'
import { Rng } from './rng'
import { TRADE_GOODS, GOOD_IDS } from '../data/goods'
import { POLITICS } from '../data/politics'

/**
 * Baseline "encyclopaedia" price for a good in a system, ignoring random
 * fluctuation. Returns 0 when the good cannot be traded there at all.
 */
export function standardPrice(good: TradeGood, sys: SolarSystem): number {
  // Not produced at this tech level -> not available to buy.
  if (sys.techLevel < good.techProduction) return 0

  let price = good.basePrice + sys.techLevel * good.pricePerTech

  if (good.cheapResource && sys.specialResource === good.cheapResource) {
    price = Math.round((price * 3) / 4)
  }
  if (good.expensiveResource && sys.specialResource === good.expensiveResource) {
    price = Math.round((price * 4) / 3)
  }
  if (good.spikeStatus && sys.status === good.spikeStatus) {
    price = Math.round(price * 1.5)
  }

  const gov = POLITICS[sys.politics]
  if (gov.wanted === good.id) price = Math.round(price * 1.15)

  return Math.max(0, price)
}

/**
 * Recompute a system's market: available quantity and buy/sell prices.
 * Called when the galaxy is created and each time a system's day advances.
 */
export function refreshMarket(sys: SolarSystem, rng: Rng): void {
  const gov = POLITICS[sys.politics]

  for (const id of GOOD_IDS) {
    const good = TRADE_GOODS[id]
    const base = standardPrice(good, sys)

    if (base <= 0) {
      sys.qty[id] = 0
      sys.buyPrice[id] = 0
      // Even if not produced, the system may still buy it if tech usage allows.
      sys.sellPrice[id] = sellablePrice(good, sys, gov, 0, rng)
      continue
    }

    // Quantity available scales with tech level and a random factor.
    const supply = Math.max(0, (sys.techLevel + 1) * rng.int(3, 12))
    sys.qty[id] = supply

    const fluct = rng.variance(good.variance)
    const buy = Math.max(good.minPrice > 0 ? Math.round(good.minPrice / 2) : 1, base + fluct)
    sys.buyPrice[id] = buy

    sys.sellPrice[id] = sellablePrice(good, sys, gov, buy, rng)
  }
}

function sellablePrice(
  good: TradeGood,
  sys: SolarSystem,
  gov: (typeof POLITICS)[keyof typeof POLITICS],
  buy: number,
  rng: Rng
): number {
  // Can't sell openly if forbidden here, or if system can't use the good.
  if (gov.forbidden.includes(good.id)) return 0
  if (sys.techLevel < good.techUsage) return 0

  const base = standardPrice(good, sys)
  const reference = buy > 0 ? buy : base
  if (reference <= 0) return 0

  // Sellers typically get slightly under buy price, plus fluctuation.
  const fluct = rng.variance(good.variance)
  return Math.max(1, Math.round(reference * 0.92) + fluct)
}

/** Convenience: list of goods currently buyable in a system. */
export function buyableGoods(sys: SolarSystem): GoodId[] {
  return GOOD_IDS.filter((id) => sys.buyPrice[id] > 0 && sys.qty[id] > 0)
}
