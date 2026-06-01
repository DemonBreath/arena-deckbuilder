import type { CardId } from './cardDatabase'
import { SHOP_CARD_POOL } from './cardDatabase'
import type { ClassId } from './classDatabase'

/** Cards any class can roll in rewards and shops. */
export const SHARED_CARD_POOL: readonly CardId[] = SHOP_CARD_POOL

export type ClassCardPoolTier = 'shared' | 'class' | 'rare_class'

export interface ClassCardPool {
  classCards: readonly CardId[]
  rareClassCards: readonly CardId[]
}

/** Two class cards + one rare per playable class. */
export const CLASS_CARD_POOLS: Record<ClassId, ClassCardPool> = {
  guardian: {
    classCards: ['shield_slam', 'stonewall'],
    rareClassCards: ['bastion'],
  },
  berserker: {
    classCards: ['blood_rush', 'reckless_swing'],
    rareClassCards: ['rampage'],
  },
  gunslinger: {
    classCards: ['quickdraw', 'fan_the_hammer'],
    rareClassCards: ['dead_eye'],
  },
  necromancer: {
    classCards: ['soul_tax', 'bone_armor'],
    rareClassCards: ['grave_pact'],
  },
  pyromancer: {
    classCards: ['flame_bolt', 'ignite'],
    rareClassCards: ['inferno'],
  },
  cryomancer: {
    classCards: ['frost_wall', 'glacial_strike'],
    rareClassCards: ['absolute_zero'],
  },
  paladin: {
    classCards: ['lay_on_hands', 'consecrate'],
    rareClassCards: ['divine_shield'],
  },
  assassin: {
    classCards: ['ambush', 'rupture'],
    rareClassCards: ['death_mark'],
  },
  alchemist: {
    classCards: ['unstable_concoction', 'grand_elixir'],
    rareClassCards: ['philosophers_stone'],
  },
  timekeeper: {
    classCards: ['temporal_draw', 'borrowed_power'],
    rareClassCards: ['time_stop'],
  },
  merchant: {
    classCards: ['spare_change', 'liquidation'],
    rareClassCards: ['golden_contract'],
  },
  vampire: {
    classCards: ['sanguine_strike', 'essence_drain'],
    rareClassCards: ['blood_feast'],
  },
}

/** 65% shared / 30% class / 5% rare — see rollPoolTier(). */
const ODDS_CLASS = 0.3
const ODDS_RARE = 0.05

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function rollPoolTier(): ClassCardPoolTier {
  const r = Math.random()
  if (r < ODDS_RARE) return 'rare_class'
  if (r < ODDS_RARE + ODDS_CLASS) return 'class'
  return 'shared'
}

export function rollClassOfferCard(classId: ClassId): CardId {
  const pool = CLASS_CARD_POOLS[classId]
  const tier = rollPoolTier()

  if (tier === 'rare_class' && pool.rareClassCards.length > 0) {
    return pickRandom(pool.rareClassCards)
  }
  if (tier === 'class' && pool.classCards.length > 0) {
    return pickRandom(pool.classCards)
  }
  return pickRandom(SHARED_CARD_POOL)
}

/** Generate N card offers using 65% shared / 30% class / 5% rare odds. */
export function generateClassCardOffers(
  classId: ClassId,
  count: number,
): CardId[] {
  return Array.from({ length: count }, () => rollClassOfferCard(classId))
}

/** All class-specific card ids (for PvP legality and UI). */
export function getAllClassCardIds(): CardId[] {
  const ids: CardId[] = []
  for (const pool of Object.values(CLASS_CARD_POOLS)) {
    ids.push(...pool.classCards, ...pool.rareClassCards)
  }
  return ids
}

export function getClassCardPoolTier(
  classId: ClassId,
  cardId: CardId,
): ClassCardPoolTier | null {
  const pool = CLASS_CARD_POOLS[classId]
  if (pool.rareClassCards.includes(cardId)) return 'rare_class'
  if (pool.classCards.includes(cardId)) return 'class'
  if (SHARED_CARD_POOL.includes(cardId)) return 'shared'
  return null
}

export function getCardOwnerClass(cardId: CardId): ClassId | null {
  for (const [classId, pool] of Object.entries(CLASS_CARD_POOLS) as [
    ClassId,
    ClassCardPool,
  ][]) {
    if (
      pool.classCards.includes(cardId) ||
      pool.rareClassCards.includes(cardId)
    ) {
      return classId
    }
  }
  return null
}

export function isRareClassCard(cardId: CardId): boolean {
  for (const pool of Object.values(CLASS_CARD_POOLS)) {
    if (pool.rareClassCards.includes(cardId)) return true
  }
  return false
}

export function isClassSpecificCard(cardId: CardId): boolean {
  return getCardOwnerClass(cardId) !== null
}
