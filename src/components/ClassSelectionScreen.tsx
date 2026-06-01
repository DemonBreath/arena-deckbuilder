import { getCard } from '../game/cardDatabase'
import {
  formatDeckPreview,
  getAllClasses,
  type ClassDefinition,
  type ClassId,
} from '../game/classDatabase'

interface ClassSelectionScreenProps {
  selectedClassId: ClassId
  onSelectClass: (classId: ClassId) => void
  onConfirm: () => void
  onBack: () => void
  confirmLabel?: string
  championName?: string
}

function ClassCard({
  definition,
  selected,
  onSelect,
}: {
  definition: ClassDefinition
  selected: boolean
  onSelect: () => void
}) {
  const preview = formatDeckPreview(definition.starterDeck)

  return (
    <button
      type="button"
      className={`class-card ${selected ? 'class-card--selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="class-card__header">
        <h3 className="class-card__name">{definition.name}</h3>
        <p className="class-card__tagline">{definition.tagline}</p>
      </div>

      <div className="class-card__stats">
        <span>Max HP: {definition.stats.maxHp}</span>
        <span>Energy / turn: {definition.stats.turnEnergy}</span>
        <span>Lives: {definition.stats.arenaLives}</span>
      </div>

      <div className="class-card__passive">
        <span className="class-card__passive-label">Passive — {definition.passive.name}</span>
        <p>{definition.passive.description}</p>
      </div>

      <div className="class-card__deck">
        <span className="class-card__deck-label">Starting deck</span>
        <ul>
          {preview.map(({ cardId, count }) => (
            <li key={cardId}>
              {getCard(cardId).name} ×{count}
            </li>
          ))}
        </ul>
      </div>
    </button>
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
  const classes = getAllClasses()

  return (
    <section className="screen class-selection-screen">
      <h1>Choose Your Class</h1>
      {championName && (
        <p className="class-selection-screen__champion">
          Champion: <strong>{championName}</strong>
        </p>
      )}
      <p className="class-selection-screen__hint">
        All classes are balanced for arena runs. Pick a class before entering a
        lobby or solo run. No unlocks — any class, any time.
      </p>

      <div className="class-selection-grid">
        {classes.map((definition) => (
          <ClassCard
            key={definition.id}
            definition={definition}
            selected={selectedClassId === definition.id}
            onSelect={() => onSelectClass(definition.id)}
          />
        ))}
      </div>

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
