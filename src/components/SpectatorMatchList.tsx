import type { SpectatorMatchSummary } from '../types/spectator'

interface SpectatorMatchListProps {
  matches: SpectatorMatchSummary[]
  selectedMatchId: string | null
  onSelectMatch: (matchId: string) => void
  loading?: boolean
}

function statusLabel(status: SpectatorMatchSummary['status']): string {
  switch (status) {
    case 'waiting':
      return 'Waiting'
    case 'active':
      return 'In progress'
    case 'completed':
      return 'Completed'
    default:
      return status
  }
}

export function SpectatorMatchList({
  matches,
  selectedMatchId,
  onSelectMatch,
  loading = false,
}: SpectatorMatchListProps) {
  return (
    <section className="spectator-matches-panel">
      <h3 className="spectator-matches-panel__title">Active Matches</h3>
      {loading && <p className="spectator-matches-panel__hint">Loading matches…</p>}
      {!loading && matches.length === 0 && (
        <p className="spectator-matches-panel__hint">
          No active matches right now. Check back when the host starts a round.
        </p>
      )}
      {!loading && matches.length > 0 && (
        <ul className="spectator-match-list">
          {matches.map((match) => (
            <li key={match.matchId}>
              <button
                type="button"
                className={`spectator-match-card ${
                  selectedMatchId === match.matchId
                    ? 'spectator-match-card--selected'
                    : ''
                }`}
                onClick={() => onSelectMatch(match.matchId)}
              >
                <div className="spectator-match-card__fighters">
                  <strong>{match.player1Name}</strong>
                  <span className="spectator-match-card__vs">vs</span>
                  <strong>{match.player2Name}</strong>
                </div>
                <div className="spectator-match-card__stats">
                  <span>
                    HP {match.player1Hp} / {match.player2Hp}
                  </span>
                  <span className="spectator-match-card__turn">
                    {match.turnLabel}
                  </span>
                </div>
                <span
                  className={`spectator-match-card__status spectator-match-card__status--${match.status}`}
                >
                  {statusLabel(match.status)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
