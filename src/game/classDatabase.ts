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

/** Standard role labels shown in UI and filters. */
export type ClassRole =
  | 'Tank'
  | 'Aggro'
  | 'Combo'
  | 'Control'
  | 'Sustain'
  | 'Economy'
  | 'Utility'

export type ClassDifficulty = 'Easy' | 'Medium' | 'Hard'

export const CLASS_ROLE_FILTERS: readonly ClassRole[] = [
  'Tank',
  'Aggro',
  'Combo',
  'Control',
  'Sustain',
  'Economy',
  'Utility',
] as const

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
  | 'opening_tempo'
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
  difficulty: ClassDifficulty
  deckStyle: string
  tagline: string
  description: string
  passive: ClassPassive
  passiveKind: ClassPassiveKind
  stats: ClassStats
  starterDeck: CardId[]
  intendedStrength: string
  intendedWeakness: string
  playable: true
}

export interface ClassComparisonRow {
  id: ClassId
  name: string
  role: ClassRole
  difficulty: ClassDifficulty
  deckStyle: string
  maxHp: number
  turnEnergy: number
  passiveName: string
  passiveSummary: string
  goldLabel: string | null
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
  'guard',
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
  'strike_plus',
  'heavy_strike',
  'heavy_strike',
  'guard',
  'guard',
)

const GUNSLINGER_DECK = deck(
  'strike',
  'strike',
  'strike',
  'strike',
  'strike',
  'strike_plus',
  'strike_plus',
  'guard',
  'guard',
  'guard',
)

const NECROMANCER_DECK = deck(
  'guard',
  'guard',
  'guard',
  'guard',
  'guard_plus',
  'guard_plus',
  'strike',
  'strike',
  'strike_plus',
  'strike_plus',
)

const PYROMANCER_DECK = deck(
  'strike',
  'strike',
  'strike',
  'strike',
  'strike',
  'strike_plus',
  'heavy_strike',
  'heavy_strike',
  'guard',
  'guard',
)

const CRYOMANCER_DECK = deck(
  'guard',
  'guard',
  'guard',
  'guard',
  'guard',
  'guard_plus',
  'guard_plus',
  'strike',
  'strike',
  'strike_plus',
)

const PALADIN_DECK = deck(
  'guard',
  'guard',
  'guard',
  'guard',
  'guard',
  'guard_plus',
  'guard_plus',
  'strike',
  'strike',
  'strike_plus',
)

const ASSASSIN_DECK = deck(
  'strike',
  'strike',
  'strike',
  'strike',
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
  'strike',
  'guard',
  'strike_plus',
  'guard_plus',
  'strike',
  'guard',
  'guard_plus',
  'strike_plus',
)

const TIMEKEEPER_DECK = deck(
  'strike',
  'strike',
  'strike',
  'strike',
  'guard',
  'guard',
  'guard',
  'strike_plus',
  'guard_plus',
  'heavy_strike',
)

const MERCHANT_DECK = deck(
  'guard',
  'guard',
  'guard',
  'guard',
  'guard',
  'guard',
  'guard',
  'guard',
  'strike',
  'strike',
)

const VAMPIRE_DECK = deck(
  'strike',
  'strike',
  'strike',
  'guard',
  'guard',
  'guard',
  'strike_plus',
  'guard_plus',
  'strike_plus',
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
    difficulty: 'Easy',
    deckStyle: 'Defensive',
    tagline: 'Hold the line with extra health and defense.',
    description:
      'A front-line defender built to outlast burst damage with block and high HP.',
    passive: {
      id: 'fortify',
      name: 'Fortify',
      description: '+8 Max HP. Start each turn with 1 Block.',
    },
    passiveKind: 'fortify',
    stats: {
      maxHp: PVP_MAX_HP + 8,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...GUARDIAN_DECK],
    intendedStrength: 'High HP and steady block each turn.',
    intendedWeakness: 'Low damage output; struggles to close fights quickly.',
    playable: true,
  },
  {
    id: 'berserker',
    name: 'Berserker',
    role: 'Aggro',
    difficulty: 'Hard',
    deckStyle: 'Aggressive',
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
    intendedStrength: 'High burst damage on core attack cards.',
    intendedWeakness: 'Fragile HP; punished if fights drag on.',
    playable: true,
  },
  {
    id: 'gunslinger',
    name: 'Gunslinger',
    role: 'Combo',
    difficulty: 'Medium',
    deckStyle: 'Combo chains',
    tagline: 'Chain quick shots for combo spikes.',
    description:
      'Fires many low-cost attacks and spikes damage when chaining Strikes.',
    passive: {
      id: 'combo_shot',
      name: 'Combo Shot',
      description: 'Second Strike each turn deals +2 bonus damage.',
    },
    passiveKind: 'combo_shot',
    stats: {
      maxHp: PVP_MAX_HP - 2,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...GUNSLINGER_DECK],
    intendedStrength: 'Strong multi-Strike turns with lean deck.',
    intendedWeakness: 'Average HP; weak if Strikes are blocked.',
    playable: true,
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    role: 'Sustain',
    difficulty: 'Medium',
    deckStyle: 'Sustain mix',
    tagline: 'Sacrifice durability to drain life from defense.',
    description:
      'Death-themed fighter who recovers HP while playing Guard cards.',
    passive: {
      id: 'life_drain',
      name: 'Life Drain',
      description: 'Lower Max HP. Heal 1 HP when you play a Guard card.',
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
    intendedStrength: 'Healing while defending extends fights.',
    intendedWeakness: 'Lower HP; heal requires spending a turn on Guard.',
    playable: true,
  },
  {
    id: 'pyromancer',
    name: 'Pyromancer',
    role: 'Aggro',
    difficulty: 'Hard',
    deckStyle: 'Aggressive',
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
    intendedStrength: 'Consistent attack pressure and damage uptick.',
    intendedWeakness: 'Thin defenses; vulnerable to burst.',
    playable: true,
  },
  {
    id: 'cryomancer',
    name: 'Cryomancer',
    role: 'Control',
    difficulty: 'Medium',
    deckStyle: 'Defensive control',
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
      maxHp: PVP_MAX_HP + 2,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...CRYOMANCER_DECK],
    intendedStrength: 'Stalls opponents with block and HP.',
    intendedWeakness: 'Low kill pressure; long fights favor burst classes.',
    playable: true,
  },
  {
    id: 'paladin',
    name: 'Paladin',
    role: 'Sustain',
    difficulty: 'Easy',
    deckStyle: 'Defensive sustain',
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
      maxHp: PVP_MAX_HP + 4,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...PALADIN_DECK],
    intendedStrength: 'Reliable defense and chip healing.',
    intendedWeakness: 'Slow damage; struggles vs economy snowball.',
    playable: true,
  },
  {
    id: 'assassin',
    name: 'Assassin',
    role: 'Aggro',
    difficulty: 'Hard',
    deckStyle: 'Burst aggressive',
    tagline: 'First strike each turn hits hardest.',
    description:
      'Burst specialist who opens every turn with a punishing attack.',
    passive: {
      id: 'assassin_burst',
      name: 'Opening Strike',
      description: 'First attack card each turn deals +2 bonus damage.',
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
    intendedStrength: 'Strong openers every turn.',
    intendedWeakness: 'Follow-up attacks are weaker; needs good timing.',
    playable: true,
  },
  {
    id: 'alchemist',
    name: 'Alchemist',
    role: 'Utility',
    difficulty: 'Medium',
    deckStyle: 'Balanced utility',
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
    intendedStrength: 'Flexible deck with situational damage bumps.',
    intendedWeakness: 'Passive is inconsistent; no standout stat line.',
    playable: true,
  },
  {
    id: 'timekeeper',
    name: 'Timekeeper',
    role: 'Control',
    difficulty: 'Hard',
    deckStyle: 'Balanced tempo',
    tagline: 'Burst of tempo on turn one.',
    description:
      'Bends time for a strong opening turn, then plays a balanced game.',
    passive: {
      id: 'opening_tempo',
      name: 'Borrowed Moment',
      description: '+2 Energy on the first turn of each battle only.',
    },
    passiveKind: 'opening_tempo',
    stats: {
      maxHp: PVP_MAX_HP - 2,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 0,
      shopDiscountPercent: 0,
    },
    starterDeck: [...TIMEKEEPER_DECK],
    intendedStrength: 'Powerful first-turn plays to seize initiative.',
    intendedWeakness: 'Average HP; weaker after the opening spike.',
    playable: true,
  },
  {
    id: 'merchant',
    name: 'Merchant',
    role: 'Economy',
    difficulty: 'Easy',
    deckStyle: 'Defensive economy',
    tagline: 'Rich start, weaker combat deck.',
    description:
      'Starts with bonus gold and shop discounts — wins through economy.',
    passive: {
      id: 'merchant_barter',
      name: 'Barter',
      description: '+30 starting gold. 15% off shop card prices.',
    },
    passiveKind: 'merchant_barter',
    stats: {
      maxHp: PVP_MAX_HP - 4,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
      startingGoldBonus: 30,
      shopDiscountPercent: 15,
    },
    starterDeck: [...MERCHANT_DECK],
    intendedStrength: 'Gold lead and cheaper shop upgrades.',
    intendedWeakness: 'Weak combat deck; loses direct fights early.',
    playable: true,
  },
  {
    id: 'vampire',
    name: 'Vampire',
    role: 'Sustain',
    difficulty: 'Medium',
    deckStyle: 'Sustain mix',
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
    intendedStrength: 'Grinds down opponents with chip heal on hits.',
    intendedWeakness: 'Needs to land attacks; weak vs heavy block.',
    playable: true,
  },
] as const

/** Shown in class select UI — not playable, no unlock grind. */
export const CLASS_TEASERS: readonly ClassTeaser[] = [
  {
    id: 'druid',
    name: 'Druid',
    role: 'Sustain',
    description: 'Nature heals and growth — coming in a future roster update.',
  },
  {
    id: 'warlock',
    name: 'Warlock',
    role: 'Aggro',
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

export function getClassFilterRoles(): ClassRole[] {
  return [...CLASS_ROLE_FILTERS]
}

export function getClassComparisonRows(): ClassComparisonRow[] {
  return getPlayableClasses().map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    difficulty: c.difficulty,
    deckStyle: c.deckStyle,
    maxHp: c.stats.maxHp,
    turnEnergy: c.stats.turnEnergy,
    passiveName: c.passive.name,
    passiveSummary: c.passive.description,
    goldLabel: formatClassGoldLabel(c.id),
  }))
}
