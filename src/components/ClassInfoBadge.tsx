import {
  getClassDefinition,
  type ClassId,
} from '../game/classDatabase'

interface ClassInfoBadgeProps {
  classId: ClassId
  /** Show role chip beside the name. */
  showRole?: boolean
  /** Show passive name + description in a tooltip title. */
  showPassiveTooltip?: boolean
  compact?: boolean
}

function roleClassName(role: string): string {
  return `class-role-badge class-role-badge--${role.toLowerCase()}`
}

export function ClassInfoBadge({
  classId,
  showRole = true,
  showPassiveTooltip = true,
  compact = false,
}: ClassInfoBadgeProps) {
  const def = getClassDefinition(classId)
  const tooltip = showPassiveTooltip
    ? `${def.passive.name}: ${def.passive.description}`
    : undefined

  return (
    <span
      className={`class-info-badge ${compact ? 'class-info-badge--compact' : ''}`}
      title={tooltip}
    >
      <strong className="class-info-badge__name">{def.name}</strong>
      {showRole && (
        <span className={roleClassName(def.role)}>{def.role}</span>
      )}
      {showPassiveTooltip && !compact && (
        <span className="class-info-badge__passive">{def.passive.name}</span>
      )}
    </span>
  )
}
