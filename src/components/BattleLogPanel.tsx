interface BattleLogPanelProps {
  entries: string[]
  title?: string
}

export function BattleLogPanel({
  entries,
  title = 'Battle Log',
}: BattleLogPanelProps) {
  return (
    <aside className="battle-log">
      <h3>{title}</h3>
      <div className="battle-log__scroll">
        {entries.length === 0 ? (
          <p className="battle-log__empty">No events yet.</p>
        ) : (
          <ol className="battle-log__list">
            {entries.map((entry, index) => (
              <li key={`${index}-${entry}`}>{entry}</li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  )
}
