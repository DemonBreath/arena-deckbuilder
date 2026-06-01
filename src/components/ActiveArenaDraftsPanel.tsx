import {
  countDraftStacks,
  formatActiveDraftsSummary,
  type ArenaDraftId,
} from '../game/arenaDrafts'

interface ActiveArenaDraftsPanelProps {
  activeDraftIds: ArenaDraftId[]
  title?: string
  compact?: boolean
}

export function ActiveArenaDraftsPanel({
  activeDraftIds,
  title = 'Active Arena Drafts',
  compact = false,
}: ActiveArenaDraftsPanelProps) {
  const stacks = countDraftStacks(activeDraftIds)

  if (stacks.length === 0) {
    return (
      <section
        className={`active-drafts-panel active-drafts-panel--empty ${
          compact ? 'active-drafts-panel--compact' : ''
        }`}
      >
        <h3>{title}</h3>
        <p className="active-drafts-panel__empty">No lobby drafts yet — vote every 2 rounds.</p>
      </section>
    )
  }

  return (
    <section
      className={`active-drafts-panel ${
        compact ? 'active-drafts-panel--compact' : ''
      }`}
    >
      <h3>{title}</h3>
      <p className="active-drafts-panel__summary">
        {formatActiveDraftsSummary(activeDraftIds)}
      </p>
      <ul className="active-drafts-panel__list">
        {stacks.map(({ id, count, definition }) => (
          <li key={`${id}-${count}`} className="active-drafts-panel__item">
            <strong>{definition.name}</strong>
            {count > 1 && (
              <span className="active-drafts-panel__stack">×{count}</span>
            )}
            <span className="active-drafts-panel__desc">
              {definition.description}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
