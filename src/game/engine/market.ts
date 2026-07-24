import type { SolarSystem, GoodId, TradeGood } from './types'
import { Rng } from './rng'
import { TRADE_GOODS, GOOD_IDS } from '../data/goods'
import { POLITICS } from '../data/politics'
import { economyOf } from '../data/economies'

/**
 * Baseline "encyclopaedia" price for a good in a system, ignoring random
 * fluctuation. Returns 0 when the good cannot be traded there at all.
 */
export function standardPrice(good: TradeGood, sys: SolarSystem): number {
  // Exotic goods are gated by a source resource, not by tech level. They are
  // only buyable (cheaply) on the planet that produces them.
  if (good.producedByResource) {
    return sys.specialResource === good.producedByResource ? Math.round(good.basePrice * 0.5) : 0
  }

  // Not produced at this tech level -> not available to buy.
  if (sys.techLevel < good.techProduction) return 0

  return marketValue(good, sys)
}

/**
 * What a good is worth on a planet, with the production gate left out.
 *
 * Selling is judged on this rather than on `standardPrice`: a world below a
 * good's `techProduction` cannot *make* it but may still be perfectly able to
 * *use* it (`techUsage`), and hauling goods down the tech ladder to exactly
 * those buyers is the trade the price tables are built for — narcotics are
 * produced from tech 5 and usable from tech 0, robots produced from 6 and
 * usable from 4. Judging the sell price on `standardPrice` made all of those
 * markets return 0, so the goods could only be sold where they were also made.
 */
function marketValue(good: TradeGood, sys: SolarSystem): number {
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

  // Planet economy: cheap where the good is produced, dear where imported.
  const econMul = economyOf(sys.economyType).goods[good.id]
  if (econMul !== undefined) price = Math.round(price * econMul)

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

    // Quantity available: exotic goods are scarce; ordinary goods scale with tech.
    const supply = good.producedByResource
      ? rng.int(3, 15)
      : Math.max(0, (sys.techLevel + 1) * rng.int(3, 12))
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
  // Exotic goods: no demand at their own source; wanted on the complementary
  // resource planet (premium) or on any hi-tech planet hungry for exotics.
  if (good.producedByResource) {
    if (sys.specialResource === good.producedByResource) return 0
    const complementary = !!good.wantedByResource && sys.specialResource === good.wantedByResource
    if (!complementary && sys.techLevel < 6) return 0
    let price = good.basePrice * (0.9 + sys.techLevel * 0.03)
    if (complementary) price *= 1.6
    return Math.max(1, Math.round(price + rng.variance(good.variance)))
  }

  // Can't sell openly if forbidden here, or if system can't use the good.
  if (gov.forbidden.includes(good.id)) return 0
  if (sys.techLevel < good.techUsage) return 0

  // Not what the planet can produce — what it reckons the goods are worth.
  const reference = buy > 0 ? buy : marketValue(good, sys)
  if (reference <= 0) return 0

  // Sellers typically get slightly under buy price, plus fluctuation.
  const fluct = rng.variance(good.variance)
  return Math.max(1, Math.round(reference * 0.92) + fluct)
}

/** Convenience: list of goods currently buyable in a system. */
export function buyableGoods(sys: SolarSystem): GoodId[] {
  return GOOD_IDS.filter((id) => sys.buyPrice[id] > 0 && sys.qty[id] > 0)
}
