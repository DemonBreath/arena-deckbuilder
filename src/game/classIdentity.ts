import {
  getClassDefinition,
  type ClassId,
  type ClassPassive,
  type ClassPassiveKind,
  type ClassRole,
  type ClassStats,
} from './classDatabase'
import {
  getEvolutionDefinition,
  type EvolutionId,
} from './classEvolutions'

/** Player identity for a run: base class chosen at start + optional evolution. */
export interface PlayerClassIdentity {
  baseClassId: ClassId
  evolutionId: EvolutionId | null
}

export interface ResolvedClassProfile {
  baseClassId: ClassId
  evolutionId: EvolutionId | null
  /** Short label: evolution name if evolved, else base name. */
  displayName: string
  /** Full title for headers: "Guardian · Warden" or "Guardian". */
  displayTitle: string
  baseName: string
  evolutionName: string | null
  role: ClassRole
  passive: ClassPassive
  passiveKind: ClassPassiveKind
  stats: ClassStats
}

export function createClassIdentity(
  baseClassId: ClassId,
  evolutionId: EvolutionId | null = null,
): PlayerClassIdentity {
  return { baseClassId, evolutionId }
}

export function identityFromClassId(classId: ClassId): PlayerClassIdentity {
  return { baseClassId: classId, evolutionId: null }
}

export function mergeClassStats(
  base: ClassStats,
  modifiers: Partial<ClassStats>,
): ClassStats {
  return {
    maxHp: base.maxHp + (modifiers.maxHp ?? 0),
    turnEnergy: base.turnEnergy + (modifiers.turnEnergy ?? 0),
    arenaLives: base.arenaLives + (modifiers.arenaLives ?? 0),
    startingGoldBonus:
      base.startingGoldBonus + (modifiers.startingGoldBonus ?? 0),
    shopDiscountPercent: Math.min(
      90,
      base.shopDiscountPercent + (modifiers.shopDiscountPercent ?? 0),
    ),
  }
}

export function resolveClassIdentity(
  identity: PlayerClassIdentity,
): ResolvedClassProfile {
  const base = getClassDefinition(identity.baseClassId)
  if (!identity.evolutionId) {
    return {
      baseClassId: identity.baseClassId,
      evolutionId: null,
      displayName: base.name,
      displayTitle: base.name,
      baseName: base.name,
      evolutionName: null,
      role: base.role,
      passive: base.passive,
      passiveKind: base.passiveKind,
      stats: { ...base.stats },
    }
  }

  const evo = getEvolutionDefinition(identity.evolutionId)
  const stats = mergeClassStats(base.stats, evo.statModifiers)

  return {
    baseClassId: identity.baseClassId,
    evolutionId: identity.evolutionId,
    displayName: evo.name,
    displayTitle: `${base.name} · ${evo.name}`,
    baseName: base.name,
    evolutionName: evo.name,
    role: evo.role,
    passive: evo.passive,
    passiveKind: evo.passiveKind,
    stats,
  }
}

export function formatPlayerClassTitle(identity: PlayerClassIdentity): string {
  return resolveClassIdentity(identity).displayTitle
}

export function getPlayerMaxHp(identity: PlayerClassIdentity): number {
  return resolveClassIdentity(identity).stats.maxHp
}

export function getPlayerTurnEnergy(identity: PlayerClassIdentity): number {
  return resolveClassIdentity(identity).stats.turnEnergy
}

export function getPlayerPassiveKind(
  identity: PlayerClassIdentity,
): ClassPassiveKind {
  return resolveClassIdentity(identity).passiveKind
}

export function getPlayerPassive(identity: PlayerClassIdentity): ClassPassive {
  return resolveClassIdentity(identity).passive
}
