import type { CardId } from './cardDatabase'
import {
  getClassDefinition,
  type ClassId,
  type ClassPassiveKind,
} from './classDatabase'
import { PVP_HAND_SIZE } from './pvpBattleState'

/** Opening-turn bonuses only — not every turn. */
export function getClassOpeningEnergyBonus(
  classId: ClassId,
  playerTurnNumber: number,
): number {
  if (passiveKind(classId) === 'opening_tempo' && playerTurnNumber === 1) {
    return 2
  }
  return 0
}

export interface ClassDamageBonusContext {
  classId: ClassId
  cardId: CardId
  strikesPlayedThisTurn: number
  attacksPlayedThisTurn: number
  handIndex: number
}

export interface ClassPostCardContext {
  classId: ClassId
  cardId: CardId
  currentHp: number
  maxHp: number
  damageDealt: number
}

export interface ClassPostCardResult {
  hp: number
  logSuffix: string
}

function isAttackCard(cardId: CardId): boolean {
  const card = cardId
  return (
    card === 'strike' ||
    card === 'strike_plus' ||
    card === 'heavy_strike'
  )
}

function isStrikeCard(cardId: CardId): boolean {
  return cardId === 'strike' || cardId === 'strike_plus' || cardId === 'heavy_strike'
}

function passiveKind(classId: ClassId): ClassPassiveKind {
  return getClassDefinition(classId).passiveKind
}

export function getClassTurnStartBlock(classId: ClassId): number {
  switch (passiveKind(classId)) {
    case 'fortify':
      return 1
    case 'ice_armor':
    case 'paladin_aegis':
      return 1
    default:
      return 0
  }
}

export function getClassTurnHandSize(_classId: ClassId): number {
  return PVP_HAND_SIZE
}

export function getClassBonusDamage(ctx: ClassDamageBonusContext): number {
  const kind = passiveKind(ctx.classId)

  switch (kind) {
    case 'bloodlust':
      return ctx.cardId === 'strike' || ctx.cardId === 'heavy_strike' ? 2 : 0
    case 'combo_shot':
      return isStrikeCard(ctx.cardId) && ctx.strikesPlayedThisTurn > 0 ? 2 : 0
    case 'burn_touch':
      return isAttackCard(ctx.cardId) ? 1 : 0
    case 'assassin_burst':
      return isAttackCard(ctx.cardId) && ctx.attacksPlayedThisTurn === 0 ? 2 : 0
    case 'alchemist_potion':
      return isAttackCard(ctx.cardId) && ctx.handIndex % 2 === 0 ? 1 : 0
    default:
      return 0
  }
}

export function applyClassPostCardEffects(
  ctx: ClassPostCardContext,
): ClassPostCardResult {
  const kind = passiveKind(ctx.classId)
  let hp = ctx.currentHp
  const parts: string[] = []

  if (ctx.cardId === 'guard' || ctx.cardId === 'guard_plus') {
    if (kind === 'life_drain') {
      hp = Math.min(ctx.maxHp, hp + 1)
      parts.push('Life Drain (+1 HP)')
    } else if (kind === 'paladin_aegis') {
      hp = Math.min(ctx.maxHp, hp + 1)
      parts.push('Aegis (+1 HP)')
    }
  }

  if (kind === 'vampire_lifesteal' && ctx.damageDealt > 0) {
    hp = Math.min(ctx.maxHp, hp + 1)
    parts.push('Lifesteal (+1 HP)')
  }

  return {
    hp,
    logSuffix: parts.length > 0 ? ` — ${parts.join(', ')}` : '',
  }
}

export function shouldIncrementStrikeCounter(cardId: CardId): boolean {
  return isStrikeCard(cardId)
}

export function shouldIncrementAttackCounter(cardId: CardId): boolean {
  return isAttackCard(cardId)
}

export function formatClassPassiveLog(classId: ClassId): string | null {
  const block = getClassTurnStartBlock(classId)
  if (block > 0) {
    const name = getClassDefinition(classId).passive.name
    return `${name} (+${block} block).`
  }
  return null
}
