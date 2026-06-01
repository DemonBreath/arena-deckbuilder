/**
 * Arena Draft registry — lobby-wide modifiers voted on every N rounds.
 * Add new drafts to ARENA_DRAFT_REGISTRY (scales to tournaments / formats).
 */

export type ArenaDraftId = string

/** Rounds between draft votes (after round 2, 4, 6, …). */
export const ARENA_DRAFT_EVERY_N_ROUNDS = 2

/** Surviving players must vote within this window. */
export const ARENA_DRAFT_VOTE_DURATION_MS = 45_000

export type ArenaDraftEffectKind =
  | 'max_hp'
  | 'turn_energy'
  | 'remove_card'
  | 'turn_one_draw'
  | 'turn_start_block'

export interface ArenaDraftDefinition {
  id: ArenaDraftId
  name: string
  tagline: string
  description: string
  effectKind: ArenaDraftEffectKind
  /** Per stack when this draft wins again. */
  magnitude: number
}

export interface StackedArenaDraftEffects {
  maxHpBonus: number
  turnEnergyBonus: number
  turnOneExtraCards: number
  turnStartBlockBonus: number
}

const ARENA_DRAFT_REGISTRY: ArenaDraftDefinition[] = [
  {
    id: 'iron_arena',
    name: 'Iron Arena',
    tagline: 'Hardened bodies.',
    description: 'All players gain +5 max HP.',
    effectKind: 'max_hp',
    magnitude: 5,
  },
  {
    id: 'battle_frenzy',
    name: 'Battle Frenzy',
    tagline: 'Relentless tempo.',
    description: 'All players gain +1 energy per turn.',
    effectKind: 'turn_energy',
    magnitude: 1,
  },
  {
    id: 'thin_decks',
    name: 'Thin Decks',
    tagline: 'Lean and lethal.',
    description: 'All players remove 1 random card from their deck.',
    effectKind: 'remove_card',
    magnitude: 1,
  },
  {
    id: 'quick_draw',
    name: 'Quick Draw',
    tagline: 'Opening burst.',
    description: 'All players draw +1 card on turn 1.',
    effectKind: 'turn_one_draw',
    magnitude: 1,
  },
  {
    id: 'heavy_armor',
    name: 'Heavy Armor',
    tagline: 'Fortified openings.',
    description: 'All players start combat with +5 block.',
    effectKind: 'turn_start_block',
    magnitude: 5,
  },
]

const DRAFT_BY_ID = new Map<ArenaDraftId, ArenaDraftDefinition>()
for (const draft of ARENA_DRAFT_REGISTRY) {
  DRAFT_BY_ID.set(draft.id, draft)
}

export function isArenaDraftId(value: string): value is ArenaDraftId {
  return DRAFT_BY_ID.has(value)
}

export function parseArenaDraftId(raw: unknown): ArenaDraftId | null {
  if (typeof raw === 'string' && isArenaDraftId(raw)) return raw
  return null
}

export function getArenaDraftDefinition(id: ArenaDraftId): ArenaDraftDefinition {
  return DRAFT_BY_ID.get(id)!
}

export function getAllArenaDrafts(): ArenaDraftDefinition[] {
  return [...ARENA_DRAFT_REGISTRY]
}

/** True after rounds 2, 4, 6, … when a draft vote should run. */
export function shouldTriggerArenaDraft(roundNumber: number): boolean {
  return (
    roundNumber >= ARENA_DRAFT_EVERY_N_ROUNDS &&
    roundNumber % ARENA_DRAFT_EVERY_N_ROUNDS === 0
  )
}

/** Pick N distinct random draft options for a vote. */
export function rollArenaDraftOptions(count = 3): ArenaDraftId[] {
  const pool = [...ARENA_DRAFT_REGISTRY]
  const picked: ArenaDraftId[] = []

  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length)
    const [draft] = pool.splice(index, 1)
    picked.push(draft.id)
  }

  return picked
}

export function stackArenaDraftEffects(
  activeDraftIds: ArenaDraftId[],
): StackedArenaDraftEffects {
  const stacked: StackedArenaDraftEffects = {
    maxHpBonus: 0,
    turnEnergyBonus: 0,
    turnOneExtraCards: 0,
    turnStartBlockBonus: 0,
  }

  for (const id of activeDraftIds) {
    const def = getArenaDraftDefinition(id)
    switch (def.effectKind) {
      case 'max_hp':
        stacked.maxHpBonus += def.magnitude
        break
      case 'turn_energy':
        stacked.turnEnergyBonus += def.magnitude
        break
      case 'turn_one_draw':
        stacked.turnOneExtraCards += def.magnitude
        break
      case 'turn_start_block':
        stacked.turnStartBlockBonus += def.magnitude
        break
      case 'remove_card':
        break
    }
  }

  return stacked
}

export function countDraftStacks(
  activeDraftIds: ArenaDraftId[],
): { id: ArenaDraftId; count: number; definition: ArenaDraftDefinition }[] {
  const counts = new Map<ArenaDraftId, number>()
  for (const id of activeDraftIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([id, count]) => ({
      id,
      count,
      definition: getArenaDraftDefinition(id),
    }))
    .sort((a, b) => a.definition.name.localeCompare(b.definition.name))
}

export function formatActiveDraftsSummary(activeDraftIds: ArenaDraftId[]): string {
  const stacks = countDraftStacks(activeDraftIds)
  if (stacks.length === 0) return 'No arena drafts yet.'
  return stacks
    .map(({ definition, count }) =>
      count > 1 ? `${definition.name} ×${count}` : definition.name,
    )
    .join(' · ')
}
