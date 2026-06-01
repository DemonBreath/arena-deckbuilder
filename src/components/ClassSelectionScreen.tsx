import { useMemo, useState } from 'react'
import { getCard } from '../game/cardDatabase'
import {
  formatClassGoldLabel,
  formatDeckPreview,
  getClassDefinition,
  getClassTeasers,
  getPlayableClasses,
  type ClassDefinition,
  type ClassId,
  type ClassRole,
} from '../game/classDatabase'

interface ClassSelectionScreenProps {
  selectedClassId: ClassId
  onSelectClass: (classId: ClassId) => void
  onConfirm: () => void
  onBack: () => void
  confirmLabel?: string
  championName?: string
}

const ALL_ROLES = 'All' as const
type RoleFilter = typeof ALL_ROLES | ClassRole

function roleClassName(role: ClassRole): string {
  return `class-role-badge class-role-badge--${role.toLowerCase()}`
}

function ClassPickerCard({
  definition,
  selected,
  onSelect,
}: {
  definition: ClassDefinition
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`class-picker-card ${selected ? 'class-picker-card--selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className={roleClassName(definition.role)}>{definition.role}</span>
      <strong className="class-picker-card__name">{definition.name}</strong>
      <span className="class-picker-card__hp">{definition.stats.maxHp} HP</span>
    </button>
  )
}

function ClassDetailPanel({ definition }: { definition: ClassDefinition }) {
  const preview = formatDeckPreview(definition.starterDeck)
  const goldLabel = formatClassGoldLabel(definition.id)

  return (
    <div className="class-detail-panel">
      <div className="class-detail-panel__header">
        <span className={roleClassName(definition.role)}>{definition.role}</span>
        <h2>{definition.name}</h2>
        <p className="class-detail-panel__tagline">{definition.tagline}</p>
        <p className="class-detail-panel__description">{definition.description}</p>
      </div>

      <div className="class-detail-panel__stats">
        <div>
          <span>Max HP</span>
          <strong>{definition.stats.maxHp}</strong>
        </div>
        <div>
          <span>Energy / turn</span>
          <strong>{definition.stats.turnEnergy}</strong>
        </div>
        <div>
          <span>Arena lives</span>
          <strong>{definition.stats.arenaLives}</strong>
        </div>
        {goldLabel && (
          <div className="class-detail-panel__gold">
            <span>Economy</span>
            <strong>{goldLabel}</strong>
          </div>
        )}
      </div>

      <div className="class-detail-panel__passive">
        <h3>Passive — {definition.passive.name}</h3>
        <p>{definition.passive.description}</p>
      </div>

      <div className="class-detail-panel__deck">
        <h3>Starting deck</h3>
        <ul>
          {preview.map(({ cardId, count }) => (
            <li key={cardId}>
              {getCard(cardId).name} ×{count}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function ClassSelectionScreen({
  selectedClassId,
  onSelectClass,
  onConfirm,
  onBack,
  confirmLabel = 'Continue',
  championName,
}: ClassSelectionScreenProps) {
  const playable = getPlayableClasses()
  const teasers = getClassTeasers()
  const roles = useMemo(
    () => [...new Set(playable.map((c) => c.role))].sort(),
    [playable],
  )
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(ALL_ROLES)

  const filtered = useMemo(() => {
    if (roleFilter === ALL_ROLES) return playable
    return playable.filter((c) => c.role === roleFilter)
  }, [playable, roleFilter])

  const selected = getClassDefinition(selectedClassId)

  return (
    <section className="screen class-selection-screen">
      <header className="class-selection-screen__hero">
        <h1>Choose Your Class</h1>
        <p className="class-selection-screen__subtitle">
          Your class is your arena identity — deck, stats, and passive travel with
          you for the whole run.
        </p>
        {championName && (
          <p className="class-selection-screen__champion">
            Champion: <strong>{championName}</strong>
          </p>
        )}
        <p className="class-selection-screen__meta">
          {playable.length} playable classes · no unlocks · pick any time
        </p>
      </header>

      <div className="class-selection-filters" role="tablist" aria-label="Filter by role">
        <button
          type="button"
          className={`class-selection-filter ${roleFilter === ALL_ROLES ? 'class-selection-filter--active' : ''}`}
          onClick={() => setRoleFilter(ALL_ROLES)}
        >
          All
        </button>
        {roles.map((role) => (
          <button
            key={role}
            type="button"
            className={`class-selection-filter ${roleFilter === role ? 'class-selection-filter--active' : ''}`}
            onClick={() => setRoleFilter(role)}
          >
            {role}
          </button>
        ))}
      </div>

      <div className="class-selection-layout">
        <div className="class-picker-grid">
          {filtered.map((definition) => (
            <ClassPickerCard
              key={definition.id}
              definition={definition}
              selected={selectedClassId === definition.id}
              onSelect={() => onSelectClass(definition.id)}
            />
          ))}
        </div>

        <ClassDetailPanel definition={selected} />
      </div>

      {teasers.length > 0 && (
        <section className="class-teasers-section" aria-label="Coming later">
          <h2>Coming later</h2>
          <p className="class-teasers-section__hint">
            More classes will join the roster in future updates — not locked behind
            progression.
          </p>
          <div className="class-teasers-grid">
            {teasers.map((teaser) => (
              <div key={teaser.id} className="class-teaser-card">
                <span className={roleClassName(teaser.role)}>{teaser.role}</span>
                <strong>{teaser.name}</strong>
                <p>{teaser.description}</p>
                <span className="class-teaser-card__badge">Coming later</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="class-selection-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          Back
        </button>
        <button type="button" className="primary-button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </section>
  )
}
