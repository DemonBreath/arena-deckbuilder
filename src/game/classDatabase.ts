import type { CardId } from './cardDatabase'
import { ONLINE_SHOP_CARD_PRICE } from './arenaConstants'
import { PVP_MAX_HP, PVP_STARTING_ENERGY } from './pvpBattleState'

/** Extend this union when adding class #13+. */
export type ClassId =
  | 'guardian'
  | 'berserker'
  | 'gunslinger'
  | 'necromancer'
  | 'pyromancer'
  | 'cryomancer'
  | 'paladin'
  | 'assassin'
  | 'alchemist'
  | 'timekeeper'
  | 'merchant'
  | 'vampire'

export type ClassRole =
  | 'Tank'
  | 'Aggressor'
  | 'Combo'
  | 'Sustain'
  | 'Burn'
  | 'Control'
  | 'Support'
  | 'Burst'
  | 'Utility'
  | 'Tempo'
  | 'Economy'
  | 'Lifesteal'

export type ClassPassiveKind =
  | 'fortify'
  | 'bloodlust'
  | 'combo_shot'
  | 'life_drain'
  | 'burn_touch'
  | 'ice_armor'
  | 'paladin_aegis'
  | 'assassin_burst'
  | 'alchemist_potion'
  | 'extra_draw'
  | 'merchant_barter'
  | 'vampire_lifesteal'
  | 'none'

export const DEFAULT_CLASS_ID: ClassId = 'guardian'

export interface ClassStats {
  maxHp: number
  turnEnergy: number
  arenaLives: number
  /** Added to starting gold when joining a lobby or solo run. */
  startingGoldBonus: number
  /** 0–100 discount on shop card prices (Merchant). */
  shopDiscountPercent: number
}

export interface ClassPassive {
  id: string
  name: string
  description: string
}

export interface ClassDefinition {
  id: ClassId
  name: string
  role: ClassRole
  tagline: string
  description: string
  passive: ClassPassive
  passiveKind: ClassPassiveKind
  stats: ClassStats
  starterDeck: CardId[]
  playable: true
}

export interface ClassTeaser {
  id: string
  name: string
  role: ClassRole
  description: string
}

function deck(...cards: CardId[]): CardId[] {
  return cards
}

const GUARDIAN_DECK = deck(
  'guard',
  'guard',
  'guard',
  'guard',
  'guard',
  'guard_plus',
  'guard_plus',
  'guard_plus',
  'strike',
  'strike',
)

const BERSERKER_DECK = deck(
  'strike',
  'strike',
  'strike',
  'strike',
  'strike',
  'heavy_strike',
  'heavy_strike',
  'heavy_strike',
  'strike_plus',
  'strike_plus',
)

const GUNSLINGER_DECK = deck(
  'strike',
  'strike',
  'strike',
  'strike',
  'strike_plus',
  'strike_plus',
  'strike_plus',
  'guard',
  'guard',
  'heavy_strike',
)

const NECROMANCER_DECK = deck(
  'guard',
  'guard',
  'guard',
  'strike',
  'strike',
  'strike',
  'guard_plus',
  'guard_plus',
  'strike_plus',
  'strike_plus',
)

const PYROMANCER_DECK = deck(
  'strike',
  'strike',
  'strike',
  'strike',
  'heavy_strike',
  'heavy_strike',
  'strike_plus',
  'strike_plus',
  'guard',
  'guard',
)

const CRYOMANCER_DECK = deck(
  'guard',
  'guard',
  'guard',
  'guard',
  'guard_plus',
  'guard_plus',
  'strike',
  'strike',
  'strike_plus',
  'heavy_strike',
)

const PALADIN_DECK = deck(
  'guard',
  'guard',
  'guard',
  'guard',
  'guard_plus',
  'guard_plus',
  'strike',
  'strike',
  'strike',
  'strike_plus',
)

const ASSASSIN_DECK = deck(
  'strike',
  'strike',
  'strike',
  'strike_plus',
  'strike_plus',
  'strike_plus',
  'heavy_strike',
  'guard',
  'guard',
  'guard',
)

const ALCHEMIST_DECK = deck(
  'strike',
  'guard',
  'strike_plus',
  'guard_plus',
  'strike',
  'guard',
  'heavy_strike',
  'guard_plus',
  'strike_plus',
  'guard',
)

const TIMEKEEPER_DECK = deck(
  'strike',
  'strike',
  'guard',
  'guard',
  'strike_plus',
  'guard_plus',
  'strike',
  'guard',
  'heavy_strike',
  'guard_plus',
)

const MERCHANT_DECK = deck(
  'guard',
  'guard',
  'guard',
  'guard',
  'guard',
  'guard',
  'guard',
  'strike',
  'strike',
  'strike',
)

const VAMPIRE_DECK = deck(
  'strike',
  'strike',
  'guard',
  'guard',
  'strike_plus',
  'guard_plus',
  'heavy_strike',
  'strike',
  'guard',
  'guard_plus',
)

/**
 * Master playable roster — append new playable classes here.
 * Passive behavior is implemented in classPassives.ts via passiveKind.
 */
export const CLASS_REGISTRY: readonly ClassDefinition[] = [
  {
    id: 'guardian',
    name: 'Guardian',
    role: 'Tank',
    tagline: 'Hold the line with extra health and defense.',
    description:
      'A front-line defender built to outlast burst damage with block and high HP.',
    passive: {
      id: 'fortify',
      name: 'Fortify',
      description: '+10 Max HP. Start each turn with 2 Block.',
    },
    passiveKind: 'fortify',
    stats: {
      maxHp: PVP_MAX_HP + 10,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...GUARDIAN_DECK],
    playable: true,
  },
  {
    id: 'berserker',
    name: 'Berserker',
    role: 'Aggressor',
    tagline: 'Trade safety for explosive pressure.',
    description:
      'Low HP striker who rewards all-in attacks and finishing fights fast.',
    passive: {
      id: 'bloodlust',
      name: 'Bloodlust',
      description: 'Lower Max HP. Strike and Heavy Strike deal +2 damage.',
    },
    passiveKind: 'bloodlust',
    stats: {
      maxHp: PVP_MAX_HP - 6,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...BERSERKER_DECK],
    playable: true,
  },
  {
    id: 'gunslinger',
    name: 'Gunslinger',
    role: 'Combo',
    tagline: 'Extra energy and chaining quick shots.',
    description:
      'Fires many low-cost attacks and spikes damage on combo turns.',
    passive: {
      id: 'combo_shot',
      name: 'Combo Shot',
      description:
        '+1 Energy per turn. Second Strike each turn deals +3 bonus damage.',
    },
    passiveKind: 'combo_shot',
    stats: {
      maxHp: PVP_MAX_HP,
      turnEnergy: PVP_STARTING_ENERGY + 1,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...GUNSLINGER_DECK],
    playable: true,
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    role: 'Sustain',
    tagline: 'Sacrifice durability to drain life from defense.',
    description:
      'Death-themed controller who recovers HP while playing Guard cards.',
    passive: {
      id: 'life_drain',
      name: 'Life Drain',
      description: 'Lower Max HP. Heal 2 HP when you play a Guard card.',
    },
    passiveKind: 'life_drain',
    stats: {
      maxHp: PVP_MAX_HP - 4,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...NECROMANCER_DECK],
    playable: true,
  },
  {
    id: 'pyromancer',
    name: 'Pyromancer',
    role: 'Burn',
    tagline: 'Relentless firepower, little defense.',
    description:
      'Glass cannon mage — every attack hits a little harder (burn placeholder).',
    passive: {
      id: 'burn_touch',
      name: 'Scorch',
      description: '+1 damage on all attack cards. Low block focus.',
    },
    passiveKind: 'burn_touch',
    stats: {
      maxHp: PVP_MAX_HP - 4,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...PYROMANCER_DECK],
    playable: true,
  },
  {
    id: 'cryomancer',
    name: 'Cryomancer',
    role: 'Control',
    tagline: 'Ice armor and defensive control.',
    description:
      'Slows the pace with extra block — freeze effects coming in a later update.',
    passive: {
      id: 'ice_armor',
      name: 'Ice Armor',
      description: 'Start each turn with 1 Block. Defensive starter deck.',
    },
    passiveKind: 'ice_armor',
    stats: {
      maxHp: PVP_MAX_HP + 4,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...CRYOMANCER_DECK],
    playable: true,
  },
  {
    id: 'paladin',
    name: 'Paladin',
    role: 'Support',
    tagline: 'Stable block and small heals.',
    description:
      'Holy knight who stabilizes HP while guarding — slower but steady.',
    passive: {
      id: 'paladin_aegis',
      name: 'Aegis',
      description: 'Start each turn with 1 Block. Heal 1 HP when playing Guard.',
    },
    passiveKind: 'paladin_aegis',
    stats: {
      maxHp: PVP_MAX_HP + 6,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...PALADIN_DECK],
    playable: true,
  },
  {
    id: 'assassin',
    name: 'Assassin',
    role: 'Burst',
    tagline: 'First strike each turn hits hardest.',
    description:
      'Burst specialist who opens every turn with a punishing attack.',
    passive: {
      id: 'assassin_burst',
      name: 'Opening Strike',
      description: 'First attack card each turn deals +4 bonus damage.',
    },
    passiveKind: 'assassin_burst',
    stats: {
      maxHp: PVP_MAX_HP - 2,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...ASSASSIN_DECK],
    playable: true,
  },
  {
    id: 'alchemist',
    name: 'Alchemist',
    role: 'Utility',
    tagline: 'Unpredictable potion-powered plays.',
    description:
      'Flexible brewer — even-index cards in hand deal +1 damage (potion luck).',
    passive: {
      id: 'alchemist_potion',
      name: 'Volatile Brew',
      description: 'Attack cards in even hand slots deal +1 damage.',
    },
    passiveKind: 'alchemist_potion',
    stats: {
      maxHp: PVP_MAX_HP,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...ALCHEMIST_DECK],
    playable: true,
  },
  {
    id: 'timekeeper',
    name: 'Timekeeper',
    role: 'Tempo',
    tagline: 'Extra cards and tempo advantage.',
    description:
      'Manipulates time to draw one extra card each turn (simple draw buff).',
    passive: {
      id: 'extra_draw',
      name: 'Borrowed Moment',
      description: 'Draw 6 cards at turn start instead of 5.',
    },
    passiveKind: 'extra_draw',
    stats: {
      maxHp: PVP_MAX_HP,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...TIMEKEEPER_DECK],
    playable: true,
  },
  {
    id: 'merchant',
    name: 'Merchant',
    role: 'Economy',
    tagline: 'Rich start, weaker combat deck.',
    description:
      'Starts with bonus gold and shop discounts — wins through economy.',
    passive: {
      id: 'merchant_barter',
      name: 'Barter',
      description: '+40 starting gold. 20% off shop card prices.',
    },
    passiveKind: 'merchant_barter',
    stats: {
      maxHp: PVP_MAX_HP - 4,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 40,
      shopDiscountPercent: 20,
    },
    starterDeck: [...MERCHANT_DECK],
    playable: true,
  },
  {
    id: 'vampire',
    name: 'Vampire',
    role: 'Lifesteal',
    tagline: 'Drain HP through sustained attacks.',
    description:
      'Sustain fighter who heals 1 HP whenever an attack deals damage.',
    passive: {
      id: 'vampire_lifesteal',
      name: 'Blood Siphon',
      description: 'Heal 1 HP when an attack card deals damage.',
    },
    passiveKind: 'vampire_lifesteal',
    stats: {
      maxHp: PVP_MAX_HP - 2,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...VAMPIRE_DECK],
    playable: true,
  },
] as const

/** Shown in class select UI — not playable, no unlock grind. */
export const CLASS_TEASERS: readonly ClassTeaser[] = [
  {
    id: 'druid',
    name: 'Druid',
    role: 'Support',
    description: 'Nature heals and growth — coming in a future roster update.',
  },
  {
    id: 'warlock',
    name: 'Warlock',
    role: 'Burn',
    description: 'Pact magic and curses — coming in a future roster update.',
  },
  {
    id: 'samurai',
    name: 'Samurai',
    role: 'Combo',
    description: 'Honor strikes and focus — coming in a future roster update.',
  },
] as const

const CLASS_BY_ID = new Map<ClassId, ClassDefinition>(
  CLASS_REGISTRY.map((c) => [c.id, c]),
)

export function isClassId(value: string): value is ClassId {
  return CLASS_BY_ID.has(value as ClassId)
}

export function parseClassId(raw: unknown): ClassId {
  if (typeof raw === 'string' && isClassId(raw)) return raw
  return DEFAULT_CLASS_ID
}

export function getClassDefinition(classId: ClassId): ClassDefinition {
  const found = CLASS_BY_ID.get(classId)
  if (!found) {
    return CLASS_BY_ID.get(DEFAULT_CLASS_ID)!
  }
  return found
}

export function getPlayableClasses(): ClassDefinition[] {
  return [...CLASS_REGISTRY]
}

export function getClassTeasers(): ClassTeaser[] {
  return [...CLASS_TEASERS]
}

export function getClassStarterDeck(classId: ClassId): CardId[] {
  return [...getClassDefinition(classId).starterDeck]
}

export function getClassMaxHp(classId: ClassId): number {
  return getClassDefinition(classId).stats.maxHp
}

export function getClassTurnEnergy(classId: ClassId): number {
  return getClassDefinition(classId).stats.turnEnergy
}

export function getClassStartingGold(
  classId: ClassId,
  baseGold = 0,
): number {
  return baseGold + getClassDefinition(classId).stats.startingGoldBonus
}

export function getClassShopPrice(
  classId: ClassId,
  basePrice: number = ONLINE_SHOP_CARD_PRICE,
): number {
  const discount = getClassDefinition(classId).stats.shopDiscountPercent
  if (discount <= 0) return basePrice
  const multiplier = Math.max(0, 1 - discount / 100)
  return Math.max(1, Math.floor(basePrice * multiplier))
}

export function formatDeckPreview(
  deckCards: CardId[],
): { cardId: CardId; count: number }[] {
  const counts = new Map<CardId, number>()
  for (const id of deckCards) {
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([cardId, count]) => ({ cardId, count }))
    .sort((a, b) => a.cardId.localeCompare(b.cardId))
}

export function formatClassGoldLabel(classId: ClassId): string | null {
  const bonus = getClassDefinition(classId).stats.startingGoldBonus
  const discount = getClassDefinition(classId).stats.shopDiscountPercent
  const parts: string[] = []
  if (bonus > 0) parts.push(`+${bonus} starting gold`)
  if (discount > 0) parts.push(`${discount}% shop discount`)
  return parts.length > 0 ? parts.join(' · ') : null
}
