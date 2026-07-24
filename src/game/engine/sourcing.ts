import type { GameState, GoodId } from './types'
import { GOOD_IDS } from '../data/goods'

/**
 * Local sourcing: which goods in the hold were obtained at the planet the ship
 * is standing on, and therefore may not settle a contract due here.
 *
 * This lives on its own rather than in `game.ts` because everything that moves
 * cargo has to keep the ledger straight — including `crew.ts`, whose electrical
 * fire burns cargo, and which `game.ts` imports (so it can never import back).
 * Depends on nothing but the goods table.
 */

/** A zeroed record with an entry for every tradeable good. */
export function emptyGoods(): Record<GoodId, number> {
  const rec = {} as Record<GoodId, number>
  for (const g of GOOD_IDS) rec[g] = 0
  return rec
}

/**
 * Record goods obtained at the current planet (bought at its market or mined
 * at its site). A contract may not be settled with cargo picked up at the very
 * planet expecting the delivery, so these units are held back from quest
 * hand-ins until the ship travels again.
 */
export function noteLocalSourcing(state: GameState, good: GoodId, qty: number): void {
  if (qty <= 0) return
  if (!state.sourcedHere) state.sourcedHere = emptyGoods()
  state.sourcedHere[good] += qty
}

/** Forget local sourcing — called on arrival, once the cargo has been hauled. */
export function clearLocalSourcing(state: GameState): void {
  state.sourcedHere = emptyGoods()
}

/**
 * Units have left the hold at this planet (sold back, dumped, seized, burnt).
 * Retire the locally-sourced ones first: they are the units a contract could
 * not have used anyway, and leaving them on the books would wrongly hold back
 * goods the ship really did haul in — sell the 5 you just bought here and the
 * 10 you arrived with would stop counting.
 */
export function releaseLocalSourcing(state: GameState, good: GoodId, qty: number): void {
  if (qty <= 0 || !state.sourcedHere) return
  state.sourcedHere[good] = Math.max(0, state.sourcedHere[good] - qty)
}

/**
 * Units of a good that may be used to settle a contract here: everything in
 * the hold except what was obtained at this very planet. Cargo hauled in,
 * salvaged, or plundered in space all counts.
 */
export function deliverableUnits(state: GameState, good: GoodId): number {
  return Math.max(0, state.ship.cargo[good] - (state.sourcedHere?.[good] ?? 0))
}
