export type RelicId =
  | 'training_coin'
  | 'iron_charm'
  | 'sharp_stone'
  | 'cheap_coupon'

export interface RelicDefinition {
  id: RelicId
  name: string
  description: string
}

export const RELIC_DATABASE: Record<RelicId, RelicDefinition> = {
  training_coin: {
    id: 'training_coin',
    name: 'Training Coin',
    description: 'Gain +10 extra gold after each win',
  },
  iron_charm: {
    id: 'iron_charm',
    name: 'Iron Charm',
    description: 'Start each battle with 5 block',
  },
  sharp_stone: {
    id: 'sharp_stone',
    name: 'Sharp Stone',
    description: 'All attack cards deal +1 damage',
  },
  cheap_coupon: {
    id: 'cheap_coupon',
    name: 'Cheap Coupon',
    description: 'Shop cards cost 5 less gold',
  },
}

export const ALL_RELIC_IDS: RelicId[] = Object.keys(
  RELIC_DATABASE,
) as RelicId[]

export const WIN_GOLD_BASE = 50
export const LOSS_GOLD_BASE = 25
export const TRAINING_COIN_BONUS = 10
export const CHEAP_COUPON_DISCOUNT = 5
export const IRON_CHARM_STARTING_BLOCK = 5
export const SHARP_STONE_DAMAGE_BONUS = 1
export const RELIC_REWARD_EVERY_N_WINS = 3

export function getRelic(id: RelicId): RelicDefinition {
  return RELIC_DATABASE[id]
}

export function hasRelic(relics: RelicId[], id: RelicId): boolean {
  return relics.includes(id)
}

export function getWinGoldAmount(relics: RelicId[]): number {
  const bonus = hasRelic(relics, 'training_coin') ? TRAINING_COIN_BONUS : 0
  return WIN_GOLD_BASE + bonus
}

export function getLossGoldAmount(): number {
  return LOSS_GOLD_BASE
}

export function getShopCardPrice(relics: RelicId[]): number {
  const base = 25
  const discount = hasRelic(relics, 'cheap_coupon') ? CHEAP_COUPON_DISCOUNT : 0
  return Math.max(0, base - discount)
}

export function getAttackDamageBonus(relics: RelicId[]): number {
  return hasRelic(relics, 'sharp_stone') ? SHARP_STONE_DAMAGE_BONUS : 0
}

export function getBattleStartBlock(relics: RelicId[]): number {
  return hasRelic(relics, 'iron_charm') ? IRON_CHARM_STARTING_BLOCK : 0
}

export function isRelicWinReward(battlesWon: number): boolean {
  return (
    battlesWon > 0 && battlesWon % RELIC_REWARD_EVERY_N_WINS === 0
  )
}

export function generateRelicOffers(owned: RelicId[]): RelicId[] {
  const available = ALL_RELIC_IDS.filter((id) => !owned.includes(id))
  if (available.length === 0) return []

  return Array.from({ length: 3 }, () => {
    const index = Math.floor(Math.random() * available.length)
    return available[index]
  })
}
