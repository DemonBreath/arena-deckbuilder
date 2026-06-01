import { getRelic, type RelicId } from '../game/relicDatabase'

interface RelicsPanelProps {
  relics: RelicId[]
}

export function RelicsPanel({ relics }: RelicsPanelProps) {
  return (
    <section className="relics-panel">
      <h3>Relics</h3>
      {relics.length === 0 ? (
        <p className="relics-panel__empty">None yet</p>
      ) : (
        <ul className="relics-panel__list">
          {relics.map((relicId) => {
            const relic = getRelic(relicId)
            return (
              <li key={relicId} className="relic-chip" title={relic.description}>
                <span className="relic-chip__name">{relic.name}</span>
                <span className="relic-chip__desc">{relic.description}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
