import type { ArenaFeedEntry } from '../types/spectator'

interface ArenaFeedPanelProps {
  entries: ArenaFeedEntry[]
  emptyMessage?: string
}

function feedKindLabel(kind: ArenaFeedEntry['kind']): string {
  switch (kind) {
    case 'match_started':
      return 'Match'
    case 'defeated':
      return 'Fight'
    case 'eliminated':
      return 'Out'
    case 'champion':
      return 'Crown'
    default:
      return 'Arena'
  }
}

export function ArenaFeedPanel({
  entries,
  emptyMessage = 'Arena events will appear here as matches play out.',
}: ArenaFeedPanelProps) {
  return (
    <section className="arena-feed-panel">
      <h3 className="arena-feed-panel__title">Arena Feed</h3>
      {entries.length === 0 ? (
        <p className="arena-feed-panel__empty">{emptyMessage}</p>
      ) : (
        <ul className="arena-feed-list">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={`arena-feed-entry arena-feed-entry--${entry.kind}`}
            >
              <span className="arena-feed-entry__tag">
                {feedKindLabel(entry.kind)}
              </span>
              <span className="arena-feed-entry__message">{entry.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
