export type CardId =
  | 'strike'
  | 'guard'
  | 'strike_plus'
  | 'guard_plus'
  | 'heavy_strike'
  | 'quick_jab'
  | 'shield_bash'
  | 'double_guard'

export type CardSpecial = 'shield_bash' | 'double_guard'

export interface CardDefinition {
  id: CardId
  name: string
  cost: number
  damage?: number
  block?: number
  description: string
  shopPrice: number
  special?: CardSpecial
}

export const CARD_DATABASE: Record<CardId, CardDefinition> = {
  strike: {
    id: 'strike',
    name: 'Strike',
    cost: 1,
    damage: 6,
    description: 'Deal 6 damage',
    shopPrice: 25,
  },
  guard: {
    id: 'guard',
    name: 'Guard',
    cost: 1,
    block: 5,
    description: 'Gain 5 block',
    shopPrice: 25,
  },
  strike_plus: {
    id: 'strike_plus',
    name: 'Strike+',
    cost: 1,
    damage: 9,
    description: 'Deal 9 damage',
    shopPrice: 25,
  },
  guard_plus: {
    id: 'guard_plus',
    name: 'Guard+',
    cost: 1,
    block: 8,
    description: 'Gain 8 block',
    shopPrice: 25,
  },
  heavy_strike: {
    id: 'heavy_strike',
    name: 'Heavy Strike',
    cost: 2,
    damage: 14,
    description: 'Deal 14 damage',
    shopPrice: 25,
  },
  quick_jab: {
    id: 'quick_jab',
    name: 'Quick Jab',
    cost: 0,
    damage: 4,
    description: 'Deal 4 damage',
    shopPrice: 25,
  },
  shield_bash: {
    id: 'shield_bash',
    name: 'Shield Bash',
    cost: 1,
    special: 'shield_bash',
    description: 'Deal damage equal to your block',
    shopPrice: 25,
  },
  double_guard: {
    id: 'double_guard',
    name: 'Double Guard',
    cost: 2,
    special: 'double_guard',
    description: 'Gain 5 block twice',
    shopPrice: 25,
  },
}

export const STARTER_DECK: CardId[] = [
  ...Array<CardId>(5).fill('strike'),
  ...Array<CardId>(5).fill('guard'),
]

export const SHOP_CARD_POOL: CardId[] = [
  'strike_plus',
  'guard_plus',
  'heavy_strike',
  'quick_jab',
  'shield_bash',
  'double_guard',
]

/** Cards offered as post-battle rewards (same pool as shop for now). */
export const REWARD_CARD_POOL: CardId[] = [...SHOP_CARD_POOL]

export const SHOP_CARD_PRICE = 25

export function getCard(id: CardId): CardDefinition {
  return CARD_DATABASE[id]
}
