import { useMemo, useState } from 'react'
import { getCard } from '../game/cardDatabase'
import {
  formatClassGoldLabel,
  formatDeckPreview,
  getClassComparisonRows,
  getClassDefinition,
  getClassFilterRoles,
  getClassTeasers,
  getPlayableClassCount,
  getPlayableClasses,
  roleToCssSlug,
  type ClassDefinition,
  type ClassId,
  type ClassRole,
} from '../game/classDatabase'
import { getMechanicDefinition } from '../game/classMechanics'

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
type ViewMode = 'compare' | 'detail'

function roleClassName(role: ClassRole): string {
  return `class-role-badge class-role-badge--${roleToCssSlug(role)}`
}

function difficultyClassName(difficulty: string): string {
  return `class-difficulty class-difficulty--${difficulty.toLowerCase()}`
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
      <span className="class-picker-card__stats">
        {definition.stats.maxHp} HP · {definition.stats.turnEnergy} energy
      </span>
      <span className="class-picker-card__passive" title={definition.passive.description}>
        {definition.passive.name}: {definition.passive.description}
      </span>
    </button>
  )
}

function ClassDetailPanel({ definition }: { definition: ClassDefinition }) {
  const preview = formatDeckPreview(definition.starterDeck)
  const goldLabel = formatClassGoldLabel(definition.id)
  const mechanic = getMechanicDefinition(definition.id)

  return (
    <div className="class-detail-panel">
      <div className="class-detail-panel__header">
        <span className={roleClassName(definition.role)}>{definition.role}</span>
        <span className={difficultyClassName(definition.difficulty)}>
          {definition.difficulty}
        </span>
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
          <span>Deck style</span>
          <strong>{definition.deckStyle}</strong>
        </div>
        <div>
          <span>Difficulty</span>
          <strong>{definition.difficulty}</strong>
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

      <div className="class-detail-panel__mechanic">
        <h3>Signature — {mechanic.name}</h3>
        <p>{mechanic.hint}</p>
      </div>

      <div className="class-detail-panel__identity">
        <p>
          <strong>Strength:</strong> {definition.intendedStrength}
        </p>
        <p>
          <strong>Weakness:</strong> {definition.intendedWeakness}
        </p>
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

function ClassComparisonTable({
  selectedClassId,
  onSelectClass,
  roleFilter,
}: {
  selectedClassId: ClassId
  onSelectClass: (classId: ClassId) => void
  roleFilter: RoleFilter
}) {
  const rows = useMemo(() => {
    const all = getClassComparisonRows()
    if (roleFilter === ALL_ROLES) return all
    return all.filter((r) => r.role === roleFilter)
  }, [roleFilter])

  return (
    <div className="class-comparison-wrap">
      <table className="class-comparison-table">
        <thead>
          <tr>
            <th>Class</th>
            <th>Role</th>
            <th>HP</th>
            <th>Energy</th>
            <th>Deck</th>
            <th>Passive</th>
            <th>Difficulty</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={
                row.id === selectedClassId
                  ? 'class-comparison-table__row--selected'
                  : undefined
              }
              onClick={() => onSelectClass(row.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectClass(row.id)
                }
              }}
            >
              <td>
                <strong>{row.name}</strong>
                {row.goldLabel && (
                  <span className="class-comparison-table__gold">{row.goldLabel}</span>
                )}
              </td>
              <td>
                <span className={roleClassName(row.role)}>{row.role}</span>
              </td>
              <td>{row.maxHp}</td>
              <td>{row.turnEnergy}</td>
              <td>{row.deckStyle}</td>
              <td title={row.passiveSummary}>
                <span className="class-comparison-table__passive">
                  {row.passiveName}
                </span>
                <span className="class-comparison-table__passive-hint">
                  {row.passiveSummary}
                </span>
              </td>
              <td>
                <span className={difficultyClassName(row.difficulty)}>
                  {row.difficulty}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  const classCount = getPlayableClassCount()
  const teasers = getClassTeasers()
  const roles = getClassFilterRoles()
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(ALL_ROLES)
  const [viewMode, setViewMode] = useState<ViewMode>('compare')

  const filtered = useMemo(() => {
    if (roleFilter === ALL_ROLES) return playable
    return playable.filter((c) => c.role === roleFilter)
  }, [playable, roleFilter])

  const selected = getClassDefinition(selectedClassId)

  return (
    <section className="screen class-selection-screen">
      <header className="class-selection-screen__hero">
        <p className="class-selection-screen__count">{classCount} playable classes</p>
        <h1>Choose Your Class</h1>
        <p className="class-selection-screen__subtitle">
          Every class changes how you fight, shop, and survive. Compare roles, passives,
          and stats — then commit to one identity for the run.
        </p>
        {championName && (
          <p className="class-selection-screen__champion">
            Champion: <strong>{championName}</strong>
          </p>
        )}
        <p className="class-selection-screen__meta">
          No unlocks · no grind · pick any class every run
        </p>
      </header>

      <div className="class-selection-view-toggle" role="tablist">
        <button
          type="button"
          className={`class-selection-view-btn ${viewMode === 'compare' ? 'class-selection-view-btn--active' : ''}`}
          onClick={() => setViewMode('compare')}
        >
          Compare all ({classCount})
        </button>
        <button
          type="button"
          className={`class-selection-view-btn ${viewMode === 'detail' ? 'class-selection-view-btn--active' : ''}`}
          onClick={() => setViewMode('detail')}
        >
          Class detail
        </button>
      </div>

      <div className="class-selection-filters" role="tablist" aria-label="Filter by role">
        <button
          type="button"
          className={`class-selection-filter ${roleFilter === ALL_ROLES ? 'class-selection-filter--active' : ''}`}
          onClick={() => setRoleFilter(ALL_ROLES)}
        >
          All ({classCount})
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

      {viewMode === 'compare' ? (
        <ClassComparisonTable
          selectedClassId={selectedClassId}
          onSelectClass={onSelectClass}
          roleFilter={roleFilter}
        />
      ) : (
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
      )}

      {viewMode === 'compare' && (
        <div className="class-selection-compare-summary">
          <span className={roleClassName(selected.role)}>{selected.role}</span>
          <strong>{selected.name}</strong>
          <span>
            {selected.stats.maxHp} HP · {selected.stats.turnEnergy} energy ·{' '}
            {selected.deckStyle}
          </span>
          <p title={selected.passive.description}>
            <strong>{selected.passive.name}:</strong> {selected.passive.description}
          </p>
        </div>
      )}

      {teasers.length > 0 && (
        <section className="class-teasers-section" aria-label="Coming later">
          <h2>Class #{classCount + 1}+ coming later</h2>
          <p className="class-teasers-section__hint">
            The roster scales to 30+ classes — these teasers show what is next, not
            locked content.
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
          {confirmLabel} as {selected.name}
        </button>
      </div>
    </section>
  )
}
