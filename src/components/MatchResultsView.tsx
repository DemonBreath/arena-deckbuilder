import { useEffect, useState } from 'react'
import { PVP_LOSS_GOLD, PVP_WIN_GOLD } from '../game/arenaConstants'
import { buildPvpMatchSummary } from '../game/pvpBattleState'
import { useOnlineRunStatus } from '../hooks/useOnlineRunStatus'
import { fetchLobbyPlayer } from '../services/lobbyService'
import type { OnlineLobbySession } from '../types/lobby'
import type { PvpMatch } from '../types/match'
import { PvpRunStatusHeader } from './PvpRunStatusHeader'

interface MatchResultsViewProps {
  session: OnlineLobbySession
  match: PvpMatch
  onContinue: () => void
}

export function MatchResultsView({
  session,
  match,
  onContinue,
}: MatchResultsViewProps) {
  const runStatus = useOnlineRunStatus(session)
  const [lives, setLives] = useState(3)

  useEffect(() => {
    const load = async () => {
      const player = await fetchLobbyPlayer(session.playerId)
      if (player) setLives(player.lives)
    }
    void load()
  }, [session.playerId])

  if (!match.battleState || !runStatus) {
    return (
      <section className="screen match-results-screen">
        <p>Loading match results…</p>
      </section>
    )
  }

  const won = match.winnerPlayerId === session.playerId
  const goldEarned = won ? PVP_WIN_GOLD : PVP_LOSS_GOLD
  const summary = buildPvpMatchSummary(
    match.battleState,
    session.playerId,
    goldEarned,
    lives,
  )

  if (!summary) {
    return (
      <section className="screen match-results-screen">
        <p>Match results unavailable.</p>
        <button type="button" className="primary-button" onClick={onContinue}>
          Continue
        </button>
      </section>
    )
  }

  return (
    <section className="screen match-results-screen">
      <PvpRunStatusHeader status={runStatus} title="Match Results" />

      <div
        className={`match-results-banner ${
          summary.didIWin
            ? 'match-results-banner--win'
            : 'match-results-banner--loss'
        }`}
      >
        <h1>{summary.didIWin ? 'Victory' : 'Defeat'}</h1>
        <p>
          <strong>{summary.winnerName}</strong> defeated{' '}
          <strong>{summary.loserName}</strong>
        </p>
      </div>

      <div className="match-results-grid">
        <div className="match-results-stat">
          <span>Winner</span>
          <strong>{summary.winnerName}</strong>
        </div>
        <div className="match-results-stat">
          <span>Loser</span>
          <strong>{summary.loserName}</strong>
        </div>
        <div className="match-results-stat">
          <span>Your damage dealt</span>
          <strong>{summary.myDamageDealt}</strong>
        </div>
        <div className="match-results-stat">
          <span>Opponent damage dealt</span>
          <strong>{summary.opponentDamageDealt}</strong>
        </div>
        <div className="match-results-stat">
          <span>Your cards played</span>
          <strong>{summary.myCardsPlayed}</strong>
        </div>
        <div className="match-results-stat">
          <span>Opponent cards played</span>
          <strong>{summary.opponentCardsPlayed}</strong>
        </div>
        <div className="match-results-stat">
          <span>Gold earned</span>
          <strong className="match-results-stat--gold">+{summary.goldEarned}</strong>
        </div>
        <div className="match-results-stat">
          <span>Lives remaining</span>
          <strong className="match-results-stat--lives">
            {summary.livesRemaining}
          </strong>
        </div>
      </div>

      <button type="button" className="primary-button" onClick={onContinue}>
        Continue to Shop
      </button>
    </section>
  )
}
