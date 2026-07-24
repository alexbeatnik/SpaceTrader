import type { GameState, GoodId, Quest } from './types'
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

/** The goods a cargo-backed quest requires the player to carry, or null. */
export function questSupply(quest: Quest): { good: GoodId; amount: number } | null {
  if (
    (quest.type === 'relief' || quest.type === 'smuggle' || quest.type === 'fetch') &&
    quest.good &&
    quest.amount
  ) {
    return { good: quest.good, amount: quest.amount }
  }
  return null
}

/**
 * True when this planet will not sell `good` because the player is under
 * contract to deliver it *here*.
 *
 * A planet that has put out a contract for a commodity is, by the story the
 * contract tells, short of it — so it has none to sell. Mechanically this closes
 * a trap: local purchases are excluded from hand-ins (`deliverableUnits`), so
 * buying the goods on the delivery planet spent the player's money on cargo that
 * could never settle the job, with nothing on screen explaining why.
 */
export function isContractEmbargoed(state: GameState, good: GoodId): boolean {
  return state.quests.some((q) => {
    if (q.status !== 'active' || q.targetSystem !== state.currentSystem) return false
    return questSupply(q)?.good === good
  })
}
