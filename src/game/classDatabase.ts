import type { CardId } from './cardDatabase'
import { PVP_MAX_HP, PVP_STARTING_ENERGY } from './pvpBattleState'

/** Add new class IDs here — registry supports 30+ entries. */
export type ClassId =
  | 'guardian'
  | 'berserker'
  | 'gunslinger'
  | 'necromancer'

export const DEFAULT_CLASS_ID: ClassId = 'guardian'

export interface ClassStats {
  maxHp: number
  turnEnergy: number
  arenaLives: number
}

export interface ClassPassive {
  id: string
  name: string
  description: string
}

export interface ClassDefinition {
  id: ClassId
  name: string
  tagline: string
  passive: ClassPassive
  stats: ClassStats
  /** Starting deck for this run (PvP-legal cards for online). */
  starterDeck: CardId[]
}

const GUARDIAN_DECK: CardId[] = [
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
]

const BERSERKER_DECK: CardId[] = [
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
]

const GUNSLINGER_DECK: CardId[] = [
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
]

const NECROMANCER_DECK: CardId[] = [
  'guard',
  'guard',
  'guard',
  'guard',
  'strike',
  'strike',
  'strike',
  'guard_plus',
  'guard_plus',
  'strike_plus',
]

/**
 * Master class registry — append new classes to this array only.
 * UI, lobby join, solo runs, and PvP battles all read from here.
 */
export const CLASS_REGISTRY: readonly ClassDefinition[] = [
  {
    id: 'guardian',
    name: 'Guardian',
    tagline: 'Hold the line with extra health and defense.',
    passive: {
      id: 'fortify',
      name: 'Fortify',
      description: '+10 Max HP. Start each turn with 2 Block.',
    },
    stats: {
      maxHp: PVP_MAX_HP + 10,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
    },
    starterDeck: [...GUARDIAN_DECK],
  },
  {
    id: 'berserker',
    name: 'Berserker',
    tagline: 'Trade durability for relentless offense.',
    passive: {
      id: 'bloodlust',
      name: 'Bloodlust',
      description: 'Lower Max HP. Strike and Heavy Strike deal +2 damage.',
    },
    stats: {
      maxHp: PVP_MAX_HP - 6,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
    },
    starterDeck: [...BERSERKER_DECK],
  },
  {
    id: 'gunslinger',
    name: 'Gunslinger',
    tagline: 'Extra energy and combo pressure.',
    passive: {
      id: 'combo_shot',
      name: 'Combo Shot',
      description:
        'Start each turn with +1 Energy. Second Strike each turn deals +3 damage.',
    },
    stats: {
      maxHp: PVP_MAX_HP,
      turnEnergy: PVP_STARTING_ENERGY + 1,
      arenaLives: 3,
    },
    starterDeck: [...GUNSLINGER_DECK],
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    tagline: 'Sacrifice tempo to recover with Guards.',
    passive: {
      id: 'life_drain',
      name: 'Life Drain',
      description:
        'Slightly lower Max HP. Heal 2 HP when you play a Guard card.',
    },
    stats: {
      maxHp: PVP_MAX_HP - 2,
      turnEnergy: PVP_STARTING_ENERGY,
      arenaLives: 3,
    },
    starterDeck: [...NECROMANCER_DECK],
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

export function getAllClasses(): ClassDefinition[] {
  return [...CLASS_REGISTRY]
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

export function formatDeckPreview(deck: CardId[]): { cardId: CardId; count: number }[] {
  const counts = new Map<CardId, number>()
  for (const id of deck) {
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return [...counts.entries()].map(([cardId, count]) => ({ cardId, count }))
}
