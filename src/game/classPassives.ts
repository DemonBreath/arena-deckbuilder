import type { CardId } from './cardDatabase'
import type { ClassId } from './classDatabase'
import { cardCountsAsAttack, cardCountsAsStrike } from './cardEffects'
import {
  getPlayerPassive,
  getPlayerPassiveKind,
  type PlayerClassIdentity,
} from './classIdentity'

/** Opening-turn bonuses only — not every turn. */
export function getClassOpeningEnergyBonus(
  identity: PlayerClassIdentity,
  playerTurnNumber: number,
): number {
  const kind = getPlayerPassiveKind(identity)
  if (kind === 'opening_tempo' && playerTurnNumber === 1) return 2
  if (kind === 'chrono_tempo' && playerTurnNumber === 1) return 3
  if (kind === 'paradox_tempo' && playerTurnNumber === 1) return 2
  return 0
}

/** Extra energy on specific turns (Engineer). */
export function getClassExtraTurnEnergy(
  identity: PlayerClassIdentity,
  playerTurnNumber: number,
): number {
  if (
    getPlayerPassiveKind(identity) === 'engineer_overclock' &&
    playerTurnNumber > 0 &&
    playerTurnNumber % 2 === 0
  ) {
    return 1
  }
  return 0
}

/** Bonus block on turn 1 only (Chef). */
export function getClassFirstTurnBlockBonus(
  identity: PlayerClassIdentity,
  playerTurnNumber: number,
): number {
  if (playerTurnNumber !== 1) return 0
  if (getPlayerPassiveKind(identity) === 'chef_prep') return 3
  return 0
}

/** Bonus gold after a victory (Pirate). */
export function getClassVictoryGoldBonus(classId: ClassId): number {
  return classId === 'pirate' ? 15 : 0
}

export interface ClassDamageBonusContext {
  identity: PlayerClassIdentity
  cardId: CardId
  strikesPlayedThisTurn: number
  attacksPlayedThisTurn: number
  handIndex: number
  /** Turns this player has started in the current battle. */
  turnsTaken?: number
  defenderHp?: number
  defenderMaxHp?: number
}

export interface ClassPostCardContext {
  identity: PlayerClassIdentity
  cardId: CardId
  currentHp: number
  maxHp: number
  damageDealt: number
}

export interface ClassPostCardResult {
  hp: number
  logSuffix: string
  /** Counterattack damage to enemy (Sentinel, etc.). */
  enemyDamage: number
}

function isAttackCard(cardId: CardId): boolean {
  return cardCountsAsAttack(cardId)
}

function isStrikeCard(cardId: CardId): boolean {
  return cardCountsAsStrike(cardId)
}

function isGuardCard(cardId: CardId): boolean {
  return cardId === 'guard' || cardId === 'guard_plus'
}

function scalingDamageFromTurns(turnsTaken: number, maxBonus: number): number {
  return Math.min(maxBonus, Math.max(0, turnsTaken - 1))
}

export function getClassTurnStartBlock(identity: PlayerClassIdentity): number {
  switch (getPlayerPassiveKind(identity)) {
    case 'fortify':
    case 'ice_armor':
    case 'paladin_aegis':
    case 'quartermaster':
      return 1
    case 'warden_fortify':
      return 2
    case 'sentinel_counter':
    case 'templar_aegis':
    case 'juggernaut_brute':
      return 1
    default:
      return 0
  }
}

export function getClassTurnHandSize(identity: PlayerClassIdentity): number {
  const kind = getPlayerPassiveKind(identity)
  if (kind === 'bard_improv') return 6
  if (identity.baseClassId === 'timekeeper' || kind === 'timekeeper_draw') {
    return 6
  }
  return 5
}

export function getClassBonusDamage(ctx: ClassDamageBonusContext): number {
  const kind = getPlayerPassiveKind(ctx.identity)
  const turns = ctx.turnsTaken ?? 1

  switch (kind) {
    case 'bloodlust':
    case 'executioner_slain':
      return ctx.cardId === 'strike' || ctx.cardId === 'heavy_strike'
        ? kind === 'executioner_slain'
          ? 2
          : 1
        : 0
    case 'combo_shot':
      return isStrikeCard(ctx.cardId) && ctx.strikesPlayedThisTurn > 0 ? 1 : 0
    case 'burn_touch':
      return isAttackCard(ctx.cardId) ? 1 : 0
    case 'infernal_scorch':
      return isAttackCard(ctx.cardId) ? 1 : 0
    case 'assassin_burst':
    case 'deadeye_opening':
    case 'shadow_opening':
      return isAttackCard(ctx.cardId) && ctx.attacksPlayedThisTurn === 0
        ? kind === 'shadow_opening'
          ? 3
          : kind === 'deadeye_opening'
            ? 2
            : 1
        : 0
    case 'assassin_healthy': {
      if (!isAttackCard(ctx.cardId) || ctx.attacksPlayedThisTurn !== 0) return 0
      let bonus = 1
      if (
        ctx.defenderHp !== undefined &&
        ctx.defenderMaxHp !== undefined &&
        ctx.defenderMaxHp > 0 &&
        ctx.defenderHp / ctx.defenderMaxHp > 0.7
      ) {
        bonus += 1
      }
      return bonus
    }
    case 'alchemist_potion':
      return isAttackCard(ctx.cardId) && ctx.handIndex % 2 === 0 ? 1 : 0
    case 'mutagenist_brew':
      return isAttackCard(ctx.cardId) && ctx.handIndex % 2 === 0 ? 2 : 0
    case 'juggernaut_brute':
    case 'paradox_tempo':
      return isAttackCard(ctx.cardId) ? 1 : 0
    case 'dragon_knight_siege':
      return isAttackCard(ctx.cardId)
        ? scalingDamageFromTurns(turns, 3)
        : 0
    case 'warlord_endurance':
      return isAttackCard(ctx.cardId)
        ? scalingDamageFromTurns(turns, 4)
        : 0
    case 'gambler_lucky':
      return isAttackCard(ctx.cardId)
        ? Math.floor(Math.random() * 3)
        : 0
    case 'monk_flow':
      return isAttackCard(ctx.cardId) && ctx.attacksPlayedThisTurn > 0 ? 1 : 0
    default:
      return 0
  }
}

export function applyClassPostCardEffects(
  ctx: ClassPostCardContext,
): ClassPostCardResult {
  const kind = getPlayerPassiveKind(ctx.identity)
  let hp = ctx.currentHp
  const parts: string[] = []
  let enemyDamage = 0

  if (isGuardCard(ctx.cardId)) {
    if (kind === 'life_drain' || kind === 'lich_drain') {
      const heal = kind === 'lich_drain' ? 2 : 1
      hp = Math.min(ctx.maxHp, hp + heal)
      parts.push(`Life Drain (+${heal} HP)`)
    } else if (kind === 'paladin_aegis') {
      hp = Math.min(ctx.maxHp, hp + 1)
      parts.push('Aegis (+1 HP)')
    } else if (kind === 'templar_aegis') {
      hp = Math.min(ctx.maxHp, hp + 2)
      parts.push('Holy Aegis (+2 HP)')
    }

    if (kind === 'sentinel_counter') {
      enemyDamage = 2
      parts.push('Riposte (2 damage)')
    }
  }

  if (kind === 'vampire_lifesteal' && ctx.damageDealt > 0) {
    hp = Math.min(ctx.maxHp, hp + 1)
    parts.push('Lifesteal (+1 HP)')
  }

  if (kind === 'bloodlord_siphon' && ctx.damageDealt > 0) {
    hp = Math.min(ctx.maxHp, hp + 2)
    parts.push('Bloodlord (+2 HP)')
  }

  if (kind === 'nightstalker' && ctx.damageDealt > 0) {
    hp = Math.min(ctx.maxHp, hp + 1)
    parts.push('Nightstalker (+1 HP)')
  }

  return {
    hp,
    logSuffix: parts.length > 0 ? ` — ${parts.join(', ')}` : '',
    enemyDamage,
  }
}

export function shouldIncrementStrikeCounter(cardId: CardId): boolean {
  return isStrikeCard(cardId)
}

export function shouldIncrementAttackCounter(cardId: CardId): boolean {
  return isAttackCard(cardId)
}

/** Battle log line at turn start — surfaces passives beyond block-only tanks. */
export function formatClassPassiveLog(
  identity: PlayerClassIdentity,
  turnNumber: number,
): string | null {
  const name = getPlayerPassive(identity).name
  const kind = getPlayerPassiveKind(identity)
  const block = getClassTurnStartBlock(identity)
  const firstTurnBlock = getClassFirstTurnBlockBonus(identity, turnNumber)

  if (turnNumber === 1) {
    if (
      kind === 'opening_tempo' ||
      kind === 'chrono_tempo' ||
      kind === 'paradox_tempo'
    ) {
      const bonus = getClassOpeningEnergyBonus(identity, turnNumber)
      if (bonus > 0) {
        return `${name} — +${bonus} energy on your first turn.`
      }
    }
    if (kind === 'chef_prep' && firstTurnBlock > 0) {
      return `${name} — +${firstTurnBlock} block on your first turn.`
    }
    if (kind === 'bloodlust') {
      return `${name} — Strikes and Heavy Strikes deal +1 damage.`
    }
    if (kind === 'combo_shot') {
      return `${name} — Your second Strike each turn deals +1 damage.`
    }
    if (kind === 'burn_touch' || kind === 'infernal_scorch') {
      return `${name} — Attack cards deal bonus damage.`
    }
    if (kind === 'assassin_burst' || kind === 'assassin_healthy' || kind === 'deadeye_opening' || kind === 'shadow_opening') {
      return `${name} — Your first attack each turn hits harder.`
    }
    if (kind === 'vampire_lifesteal' || kind === 'bloodlord_siphon' || kind === 'nightstalker') {
      return `${name} — Attacks that deal damage can restore HP.`
    }
    if (kind === 'life_drain' || kind === 'lich_drain') {
      return `${name} — Playing Guard can restore HP.`
    }
    if (kind === 'paladin_aegis' || kind === 'templar_aegis') {
      return `${name} — Guards can restore HP; +${block} block this turn.`
    }
    if (kind === 'merchant_barter' || kind === 'tycoon_barter') {
      return `${name} — Extra starting gold and shop discounts (see lobby gold).`
    }
    if (kind === 'pirate_plunder') {
      return `${name} — Bonus gold on victories.`
    }
    if (kind === 'gambler_lucky') {
      return `${name} — Attacks gain random bonus damage.`
    }
    if (kind === 'monk_flow') {
      return `${name} — Second and later attacks each turn deal +1 damage.`
    }
    if (kind === 'dragon_knight_siege' || kind === 'warlord_endurance' || kind === 'juggernaut_brute') {
      return `${name} — Attack damage grows as the fight continues.`
    }
    if (kind === 'bard_improv' || kind === 'timekeeper_draw') {
      return `${name} — You draw 6 cards each turn.`
    }
    if (kind === 'engineer_overclock') {
      return `${name} — Even-numbered turns grant +1 energy.`
    }
    if (kind === 'alchemist_potion' || kind === 'mutagenist_brew') {
      return `${name} — Even hand-slot attacks deal bonus damage.`
    }
  }

  if (block > 0) {
    return `${name} (+${block} block this turn).`
  }

  if (turnNumber === 1 && kind === 'fortify') {
    return `${name} — High HP; +${block} block each turn.`
  }

  return null
}
