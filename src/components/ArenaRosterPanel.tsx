import { ARENA_MAX_PLAYERS } from '../game/arenaConstants'
import { getClassDefinition } from '../game/classDatabase'
import { countActivePlayers } from '../services/arenaService'
import {
  getRosterStatusClass,
  getRosterStatusLabel,
} from '../lib/playerPresence'
import { getRankedLobbyPlayers, type LobbyPlayer } from '../types/lobby'

interface ArenaRosterPanelProps {
  players: LobbyPlayer[]
  myPlayerId: string
  roundNumber?: number
}

export function ArenaRosterPanel({
  players,
  myPlayerId,
  roundNumber,
}: ArenaRosterPanelProps) {
  const ranked = getRankedLobbyPlayers(players)
  const activeCount = countActivePlayers(players)

  return (
    <section className="standings-panel arena-roster-panel">
      <div className="standings-panel__header">
        <h3>Arena Roster</h3>
        <p className="standings-panel__meta">
          {activeCount} active / {players.length} joined (max {ARENA_MAX_PLAYERS})
          {roundNumber !== undefined && ` — Round ${roundNumber}`}
        </p>
      </div>

      <div className="standings-table-wrap">
        <table className="standings-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Champion</th>
              <th>Class</th>
              <th>Lives</th>
              <th>Gold</th>
              <th>Defeated</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((player) => {
              const isMe = player.id === myPlayerId
              const statusLabel = getRosterStatusLabel(player)
              const statusClass = getRosterStatusClass(player)
              return (
                <tr
                  key={player.id}
                  className={
                    isMe
                      ? 'standings-table__row--player'
                      : player.eliminated
                        ? 'standings-table__row--eliminated'
                        : undefined
                  }
                >
                  <td>{player.rank}</td>
                  <td>
                    {player.championName}
                    {isMe && (
                      <span className="standings-table__you"> (you)</span>
                    )}
                  </td>
                  <td>{getClassDefinition(player.classId).name}</td>
                  <td>{player.eliminated ? '—' : player.lives}</td>
                  <td>{player.gold}</td>
                  <td>{player.opponentsDefeated}</td>
                  <td>
                    <span
                      className={`standings-status standings-status--${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
