import { useState } from 'react'
import {
  getClassDefinition,
  getPlayableClasses,
  type ClassId,
} from '../game/classDatabase'

interface ClassTestScreenProps {
  selectedClassId: ClassId
  onSelectClass: (classId: ClassId) => void
  onStartTest: (championName: string) => void
  onBack: () => void
}

function roleClassName(role: string): string {
  return `class-role-badge class-role-badge--${role.toLowerCase()}`
}

export function ClassTestScreen({
  selectedClassId,
  onSelectClass,
  onStartTest,
  onBack,
}: ClassTestScreenProps) {
  const classes = getPlayableClasses()
  const selected = getClassDefinition(selectedClassId)
  const [championName, setChampionName] = useState('Test Fighter')

  return (
    <section className="screen class-test-screen">
      <header className="class-test-screen__hero">
        <h1>Class Test Lab</h1>
        <p className="class-test-screen__subtitle">
          Dev tool — pick a class and jump into a training fight vs a dummy.
          Reset instantly to iterate on balance.
        </p>
      </header>

      <label className="champion-name-field">
        <span>Test champion name</span>
        <input
          type="text"
          className="champion-name-input"
          value={championName}
          maxLength={20}
          onChange={(e) => setChampionName(e.target.value)}
        />
      </label>

      <div className="class-test-picker">
        {classes.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`class-picker-card ${selectedClassId === c.id ? 'class-picker-card--selected' : ''}`}
            onClick={() => onSelectClass(c.id)}
          >
            <span className={roleClassName(c.role)}>{c.role}</span>
            <strong className="class-picker-card__name">{c.name}</strong>
            <span className="class-picker-card__hp">
              {c.stats.maxHp} HP · {c.passive.name}
            </span>
          </button>
        ))}
      </div>

      <div className="class-test-summary">
        <span className={roleClassName(selected.role)}>{selected.role}</span>
        <h2>{selected.name}</h2>
        <p>{selected.passive.description}</p>
        <p>
          {selected.stats.maxHp} HP · {selected.stats.turnEnergy} energy ·{' '}
          {selected.deckStyle} deck
        </p>
      </div>

      <div className="class-test-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          Back to Title
        </button>
        <button
          type="button"
          className="primary-button"
          disabled={!championName.trim()}
          onClick={() => {
            onSelectClass(selectedClassId)
            onStartTest(championName.trim())
          }}
        >
          Start Test Battle
        </button>
      </div>
    </section>
  )
}
