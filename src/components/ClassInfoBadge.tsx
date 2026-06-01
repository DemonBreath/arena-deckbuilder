import {
  getClassDefinition,
  type ClassId,
} from '../game/classDatabase'
import {
  createClassIdentity,
  resolveClassIdentity,
} from '../game/classIdentity'
import type { EvolutionId } from '../game/classEvolutions'

interface ClassInfoBadgeProps {
  classId: ClassId
  evolutionId?: EvolutionId | null
  /** Show role chip beside the name. */
  showRole?: boolean
  /** Show passive name + description in a tooltip title. */
  showPassiveTooltip?: boolean
  compact?: boolean
}

import { roleToCssSlug, type ClassRole } from '../game/classDatabase'

function roleClassName(role: string): string {
  return `class-role-badge class-role-badge--${roleToCssSlug(role as ClassRole)}`
}

export function ClassInfoBadge({
  classId,
  evolutionId = null,
  showRole = true,
  showPassiveTooltip = true,
  compact = false,
}: ClassInfoBadgeProps) {
  const profile = resolveClassIdentity(createClassIdentity(classId, evolutionId))
  const base = getClassDefinition(classId)
  const tooltip = showPassiveTooltip
    ? `${profile.passive.name}: ${profile.passive.description}`
    : undefined

  return (
    <span
      className={`class-info-badge ${compact ? 'class-info-badge--compact' : ''}`}
      title={tooltip}
    >
      <strong className="class-info-badge__name">{profile.displayTitle}</strong>
      {showRole && (
        <span className={roleClassName(profile.role)}>{profile.role}</span>
      )}
      {showPassiveTooltip && !compact && (
        <span className="class-info-badge__passive">{profile.passive.name}</span>
      )}
      {!compact && profile.evolutionName && (
        <span className="class-info-badge__base" title={`Base class: ${base.name}`}>
          {base.name}
        </span>
      )}
    </span>
  )
}
