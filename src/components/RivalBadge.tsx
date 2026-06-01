interface RivalBadgeProps {
  compact?: boolean
}

export function RivalBadge({ compact = false }: RivalBadgeProps) {
  return (
    <span
      className={`rival-badge ${compact ? 'rival-badge--compact' : ''}`}
      title="Rival — recurring opponent this run"
    >
      Rival
    </span>
  )
}
