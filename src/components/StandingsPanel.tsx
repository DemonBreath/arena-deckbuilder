import {
  getDefeatedOpponentCount,
  getRankedContestants,
  getStatusLabel,
  OPPONENT_COUNT,
  type Contestant,
} from '../game/tournamentDatabase'

interface StandingsPanelProps {
  contestants: Contestant[]
}

export function StandingsPanel({ contestants }: StandingsPanelProps) {
  const ranked = getRankedContestants(contestants)
  const defeated = getDefeatedOpponentCount(contestants)

  return (
    <section className="standings-panel">
      <div className="standings-panel__header">
        <h3>Arena Roster</h3>
        <p className="standings-panel__meta">
          Opponents defeated: {defeated} / {OPPONENT_COUNT}
        </p>
      </div>

      <div className="standings-table-wrap">
        <table className="standings-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Lives</th>
              <th>Gold</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((contestant) => (
              <tr
                key={contestant.id}
                className={
                  contestant.isPlayer
                    ? 'standings-table__row--player'
                    : contestant.status === 'defeated' ||
                        contestant.status === 'eliminated'
                      ? 'standings-table__row--eliminated'
                      : undefined
                }
              >
                <td>{contestant.rank}</td>
                <td>
                  {contestant.name}
                  {contestant.isPlayer && (
                    <span className="standings-table__you"> (you)</span>
                  )}
                </td>
                <td>{contestant.isPlayer ? contestant.lives : '—'}</td>
                <td>{contestant.isPlayer ? contestant.gold : '—'}</td>
                <td>
                  <span
                    className={`standings-status standings-status--${contestant.status}`}
                  >
                    {getStatusLabel(contestant.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
