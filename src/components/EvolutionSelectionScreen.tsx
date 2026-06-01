import { getClassDefinition, type ClassId } from '../game/classDatabase'
import { getEvolutionRewardOddsLabel } from '../game/classCardPools'
import { createClassIdentity } from '../game/classIdentity'
import {
  EVOLUTION_TRIGGER_AFTER_BATTLES_WON,
  getEvolutionsForBase,
  type EvolutionDefinition,
  type EvolutionId,
} from '../game/classEvolutions'

interface EvolutionSelectionScreenProps {
  baseClassId: ClassId
  championName?: string
  battlesWon?: number
  onPick: (evolutionId: EvolutionId) => void
}

import { roleToCssSlug, type ClassRole } from '../game/classDatabase'

function roleClassName(role: string): string {
  return `class-role-badge class-role-badge--${roleToCssSlug(role as ClassRole)}`
}

function EvolutionCard({
  evolution,
  onPick,
}: {
  evolution: EvolutionDefinition
  onPick: () => void
}) {
  const oddsLabel = getEvolutionRewardOddsLabel(
    createClassIdentity(evolution.baseClassId, evolution.id),
  )

  return (
    <button
      type="button"
      className="evolution-card"
      onClick={onPick}
    >
      <span className={roleClassName(evolution.role)}>{evolution.role}</span>
      <strong className="evolution-card__name">{evolution.name}</strong>
      <p className="evolution-card__tagline">{evolution.tagline}</p>
      <p className="evolution-card__description">{evolution.description}</p>
      <div className="evolution-card__passive">
        <span>Passive — {evolution.passive.name}</span>
        <p>{evolution.passive.description}</p>
      </div>
      {oddsLabel && (
        <p className="evolution-card__rewards">{oddsLabel}</p>
      )}
    </button>
  )
}

export function EvolutionSelectionScreen({
  baseClassId,
  championName,
  battlesWon = EVOLUTION_TRIGGER_AFTER_BATTLES_WON,
  onPick,
}: EvolutionSelectionScreenProps) {
  const base = getClassDefinition(baseClassId)
  const evolutions = getEvolutionsForBase(baseClassId)

  return (
    <section className="screen evolution-screen">
      <header className="evolution-screen__header">
        <p className="evolution-screen__eyebrow">Class evolution</p>
        <h1>
          {championName ? `${championName} — ` : ''}
          {base.name}
        </h1>
        <p className="evolution-screen__intro">
          After {battlesWon} victories, your {base.name} evolves permanently
          for this run. Choose one path — passive, reward odds, and your title
          change for the rest of the arena.
        </p>
      </header>

      <div className="evolution-screen__grid">
        {evolutions.map((evo) => (
          <EvolutionCard
            key={evo.id}
            evolution={evo}
            onPick={() => onPick(evo.id)}
          />
        ))}
      </div>

      <p className="evolution-screen__note">
        Evolution is permanent for this run. Card pools stay tied to your base
        class ({base.name}).
      </p>
    </section>
  )
}
