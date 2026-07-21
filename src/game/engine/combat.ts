import type { GameState, GoodId, ShipTypeId, WeaponId, ShieldId } from './types'
import { Rng } from './rng'
import { SHIP_TYPES } from '../data/ships'
import { WEAPONS, SHIELDS } from '../data/equipment'
import { GOOD_IDS } from '../data/goods'
import { POLITICS } from '../data/politics'
import { effectiveSkills, weaponPower, freeCargoBays, pushLog } from './game'
import { completeBounty } from './quests'

export type EncounterKind = 'trader' | 'pirate' | 'police'

export type EncounterStatus =
  | 'ongoing'
  | 'playerFled'
  | 'oppFled'
  | 'oppDestroyed'
  | 'playerDestroyed'
  | 'oppSurrendered'
  | 'playerSurrendered'
  | 'inspected'
  | 'ignored'
  | 'bribed'

export interface Opponent {
  kind: EncounterKind
  shipType: ShipTypeId
  hull: number
  maxHull: number
  shieldPoints: number
  maxShield: number
  weaponPower: number
  pilot: number
  fighter: number
  cargo: Record<GoodId, number>
  fleeing: boolean
}

export interface Encounter {
  kind: EncounterKind
  opponent: Opponent
  status: EncounterStatus
  round: number
  bribeCost: number
  /** Set when this pirate is a bounty target from an active quest. */
  bountyQuestId?: string
  bountyName?: string
  /** Rounds log keyed for i18n. */
  messages: { key: string; params?: Record<string, string | number> }[]
}

export type CombatAction =
  | 'attack'
  | 'flee'
  | 'submit' // police inspection
  | 'bribe'
  | 'surrender'
  | 'ignore'
  | 'plunder'

// --- Encounter generation ----------------------------------------------------
/**
 * Roll for an encounter during a warp. Returns null for an uneventful leg.
 */
export function rollEncounter(state: GameState, rng: Rng): Encounter | null {
  const dest = state.systems[state.currentSystem]
  const gov = POLITICS[dest.politics]

  // Base probabilities derived from government strengths.
  const pPirate = gov.strengthPirates * 0.03
  const pPolice = gov.strengthPolice * 0.025
  const pTrader = gov.strengthTraders * 0.02
  const roll = rng.next()

  if (roll < pPirate) return makeEncounter('pirate', state, rng)
  if (roll < pPirate + pPolice) return makeEncounter('police', state, rng)
  if (roll < pPirate + pPolice + pTrader) return makeEncounter('trader', state, rng)
  return null
}

/**
 * Threat level (0..5) an opponent scales to. Grows with the player's wealth and
 * combat reputation; for the police it also grows with how wanted the player is.
 */
function threatLevel(kind: EncounterKind, state: GameState): number {
  let worth = state.credits + Math.max(0, state.record.reputation) * 120
  if (kind === 'police') worth += Math.max(0, -state.record.policeRecord) * 6000
  if (worth > 150000) return 5
  if (worth > 80000) return 4
  if (worth > 40000) return 3
  if (worth > 15000) return 2
  if (worth > 5000) return 1
  return 0
}

function shipForThreat(threat: number): ShipTypeId {
  return (['gnat', 'firefly', 'mosquito', 'hornet', 'wasp', 'wasp'] as ShipTypeId[])[threat]
}

function makeEncounter(kind: EncounterKind, state: GameState, rng: Rng): Encounter {
  const threat = threatLevel(kind, state)
  const shipType =
    kind === 'trader'
      ? rng.pick(['flea', 'gnat', 'firefly', 'beetle'] as ShipTypeId[])
      : shipForThreat(threat)
  const type = SHIP_TYPES[shipType]

  // Higher-threat opponents field better shields and weapons.
  const shieldTier: ShieldId = threat >= 4 ? 'reflective' : 'energy'
  const oppShields = type.shieldSlots > 0 ? SHIELDS[shieldTier].power * Math.min(type.shieldSlots, 2) : 0
  const weaponTier: WeaponId = threat >= 4 ? 'military' : threat >= 2 ? 'beam' : 'pulse'
  const oppWeapon =
    type.weaponSlots > 0 ? WEAPONS[weaponTier].power * Math.min(type.weaponSlots, 2) : 0

  const cargo = {} as Record<GoodId, number>
  for (const g of GOOD_IDS) cargo[g] = 0
  if (kind === 'trader') {
    // Traders carry some loot.
    const loot = rng.int(2, Math.min(10, type.cargoBays))
    for (let i = 0; i < loot; i++) cargo[rng.pick(GOOD_IDS)]++
  }

  const opponent: Opponent = {
    kind,
    shipType,
    hull: type.hullStrength,
    maxHull: type.hullStrength,
    shieldPoints: oppShields,
    maxShield: oppShields,
    weaponPower: kind === 'police' ? Math.max(oppWeapon, WEAPONS.pulse.power) : oppWeapon,
    pilot: Math.min(12, rng.int(3, 8) + threat),
    fighter: Math.min(12, rng.int(3, 8) + threat),
    cargo,
    fleeing: false
  }

  const bribeCost =
    kind === 'police' ? (POLITICS[state.systems[state.currentSystem].politics].bribeLevel > 0
      ? rng.int(100, 100 + state.credits * 0.05) : 0) : 0

  return {
    kind,
    opponent,
    status: 'ongoing',
    round: 0,
    bribeCost,
    messages: [{ key: `encounter.${kind}.appear`, params: { ship: shipType } }]
  }
}

/** Build a tough pirate encounter for a bounty quest target. */
export function createBountyEncounter(
  state: GameState,
  questId: string,
  bountyName: string,
  rng: Rng
): Encounter {
  const enc = makeEncounter('pirate', state, rng)
  const type = SHIP_TYPES[enc.opponent.shipType]
  // Bounty targets are notably tougher than the usual rabble.
  enc.opponent.hull = Math.round(type.hullStrength * 1.3)
  enc.opponent.maxHull = enc.opponent.hull
  enc.opponent.fighter = Math.min(12, enc.opponent.fighter + 2)
  enc.opponent.pilot = Math.min(12, enc.opponent.pilot + 2)
  enc.bountyQuestId = questId
  enc.bountyName = bountyName
  enc.messages = [{ key: 'encounter.bounty.appear', params: { name: bountyName } }]
  return enc
}

// --- Combat resolution -------------------------------------------------------
function hitChance(attackerFighter: number, defenderPilot: number): number {
  // Logistic-ish curve based on the fighter/pilot differential.
  const diff = attackerFighter - defenderPilot
  return Math.min(0.95, Math.max(0.15, 0.55 + diff * 0.05))
}

function applyDamage(
  target: { hull: number; shieldPoints: number },
  amount: number
): void {
  if (amount <= 0) return
  const absorbed = Math.min(target.shieldPoints, amount)
  target.shieldPoints -= absorbed
  const overflow = amount - absorbed
  target.hull = Math.max(0, target.hull - overflow)
}

export interface CombatContext {
  addMessage: (key: string, params?: Record<string, string | number>) => void
}

/**
 * Resolve a single combat round given the player's chosen action.
 * Mutates both the game state and the encounter in place.
 */
export function resolveRound(
  state: GameState,
  enc: Encounter,
  action: CombatAction,
  rng: Rng
): void {
  if (enc.status !== 'ongoing') return
  enc.round++
  const skills = effectiveSkills(state)
  const opp = enc.opponent
  const playerWeapon = weaponPower(state.ship)

  const msg = (key: string, params?: Record<string, string | number>) =>
    enc.messages.push({ key, params })

  // --- Non-combat resolutions ---
  if (action === 'ignore') {
    enc.status = 'ignored'
    return
  }

  if (action === 'submit' && enc.kind === 'police') {
    const illegal = state.ship.cargo.firearms + state.ship.cargo.narcotics
    // A hidden compartment may conceal contraband from the inspection.
    if (illegal > 0 && state.ship.gadgets.includes('hiddenCompartment') && rng.chance(0.6)) {
      state.record.policeRecord += 1
      msg('encounter.police.hidden')
      enc.status = 'inspected'
      return
    }
    if (illegal > 0) {
      state.ship.cargo.firearms = 0
      state.ship.cargo.narcotics = 0
      const fine = 500 + illegal * 50
      state.credits = Math.max(0, state.credits - fine)
      state.record.policeRecord -= 3
      msg('encounter.police.impound', { fine })
      enc.status = 'inspected'
    } else {
      state.record.policeRecord += 1
      msg('encounter.police.clean')
      enc.status = 'inspected'
    }
    return
  }

  if (action === 'bribe' && enc.kind === 'police') {
    if (enc.bribeCost <= 0) {
      msg('encounter.police.incorruptible')
      return
    }
    if (state.credits >= enc.bribeCost) {
      state.credits -= enc.bribeCost
      msg('encounter.police.bribed', { amount: enc.bribeCost })
      enc.status = 'bribed'
    } else {
      msg('error.notEnoughCredits')
    }
    return
  }

  if (action === 'surrender') {
    if (enc.kind === 'pirate') {
      // Pirates plunder cargo (or extort if empty).
      let looted = 0
      for (const g of GOOD_IDS) {
        looted += state.ship.cargo[g]
        state.ship.cargo[g] = 0
      }
      if (looted === 0) {
        const extort = Math.min(state.credits, Math.round(state.credits * 0.5))
        state.credits -= extort
        msg('encounter.pirate.extort', { amount: extort })
      } else {
        msg('encounter.pirate.plundered', { qty: looted })
      }
      enc.status = 'playerSurrendered'
    } else if (enc.kind === 'police') {
      const fine = Math.min(state.credits, 1000)
      state.credits -= fine
      state.record.policeRecord -= 1
      msg('encounter.police.arrested', { fine })
      enc.status = 'playerSurrendered'
    }
    return
  }

  if (action === 'plunder' && enc.status === 'ongoing' && opp.hull <= 0) {
    return
  }

  // --- Fleeing ---
  if (action === 'flee') {
    const chance = hitChance(skills.pilot, opp.fighter)
    // Opponent gets a parting shot if it can attack.
    if (opp.weaponPower > 0 && !opp.fleeing) {
      if (rng.chance(hitChance(opp.fighter, skills.pilot))) {
        dealDamageToPlayer(state, opp.weaponPower, rng, msg)
      }
    }
    if (rng.chance(chance)) {
      enc.status = 'playerFled'
      msg('encounter.fledSuccess')
    } else {
      msg('encounter.fledFail')
    }
    checkPlayerDestroyed(state, enc, msg)
    return
  }

  // --- Attack ---
  if (action === 'attack') {
    if (playerWeapon <= 0) {
      msg('encounter.noWeapons')
    } else if (rng.chance(hitChance(skills.fighter, opp.pilot))) {
      const dmg = playerWeapon + rng.int(0, Math.round(playerWeapon * 0.3))
      applyDamage(opp, dmg)
      msg('encounter.playerHit', { dmg })
    } else {
      msg('encounter.playerMiss')
    }

    if (opp.hull <= 0) {
      enc.status = 'oppDestroyed'
      state.record.reputation += 1
      // Chance to salvage a cargo canister.
      if (rng.chance(0.5) && freeCargoBays(state.ship) > 0) {
        const g = pickLoot(opp, rng)
        if (g) {
          state.ship.cargo[g]++
          msg('encounter.salvage', { good: g })
        }
      }
      if (enc.kind === 'pirate') state.record.policeRecord += 1
      if (enc.kind === 'police') state.record.policeRecord -= 5
      // Bounty target destroyed -> complete the quest and pay out.
      if (enc.bountyQuestId) {
        const q = completeBounty(state, enc.bountyQuestId)
        if (q) msg('encounter.bounty.done', { name: enc.bountyName ?? '', reward: q.reward })
      }
      msg('encounter.oppDestroyed')
      return
    }

    // Opponent may surrender if badly hurt (traders/pirates only).
    if (
      enc.kind !== 'police' &&
      opp.hull < opp.maxHull * 0.3 &&
      rng.chance(0.3)
    ) {
      enc.status = 'oppSurrendered'
      msg('encounter.oppSurrendered')
      return
    }
  }

  // --- Opponent's turn (attacks back unless a trader who won't provoke) ---
  const oppWillFight =
    enc.kind === 'pirate' ||
    enc.kind === 'police' ||
    (enc.kind === 'trader' && action === 'attack')

  if (oppWillFight && opp.weaponPower > 0) {
    if (rng.chance(hitChance(opp.fighter, skills.pilot))) {
      dealDamageToPlayer(state, opp.weaponPower, rng, msg)
    } else {
      msg('encounter.oppMiss')
    }
  }

  checkPlayerDestroyed(state, enc, msg)
}

function dealDamageToPlayer(
  state: GameState,
  power: number,
  rng: Rng,
  msg: (k: string, p?: Record<string, string | number>) => void
): void {
  const dmg = power + rng.int(0, Math.round(power * 0.3))
  // Distribute across shields then hull.
  let remaining = dmg
  for (let i = 0; i < state.ship.shieldPoints.length && remaining > 0; i++) {
    const absorbed = Math.min(state.ship.shieldPoints[i], remaining)
    state.ship.shieldPoints[i] -= absorbed
    remaining -= absorbed
  }
  if (remaining > 0) state.ship.hull = Math.max(0, state.ship.hull - remaining)
  msg('encounter.oppHit', { dmg })
}

function checkPlayerDestroyed(
  state: GameState,
  enc: Encounter,
  msg: (k: string, p?: Record<string, string | number>) => void
): void {
  if (state.ship.hull <= 0) {
    if (state.ship.escapePod) {
      msg('encounter.escapePod')
      enc.status = 'playerDestroyed'
    } else {
      msg('encounter.playerDestroyed')
      enc.status = 'playerDestroyed'
    }
  }
}

function pickLoot(opp: Opponent, rng: Rng): GoodId | null {
  const available = GOOD_IDS.filter((g) => opp.cargo[g] > 0)
  if (available.length === 0) return rng.chance(0.5) ? 'water' : null
  return rng.pick(available)
}

/** Plunder a surrendered/destroyed opponent's cargo into free bays. */
export function plunder(state: GameState, enc: Encounter): number {
  let taken = 0
  for (const g of GOOD_IDS) {
    while (enc.opponent.cargo[g] > 0 && freeCargoBays(state.ship) > 0) {
      enc.opponent.cargo[g]--
      state.ship.cargo[g]++
      taken++
    }
  }
  if (enc.kind === 'trader' && taken > 0) {
    state.record.policeRecord -= 2
    pushLog(state, 'log.plunderedTrader', { qty: taken })
  }
  enc.status = 'ignored'
  return taken
}

