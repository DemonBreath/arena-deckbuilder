import { useEffect, useState } from 'react'
import { PVP_LOSS_GOLD, PVP_WIN_GOLD } from '../game/arenaConstants'
import { buildPvpMatchSummary } from '../game/pvpBattleState'
import { useOnlineRunStatus } from '../hooks/useOnlineRunStatus'
import {
  fetchLobbyPlayer,
  subscribeToLobbyPlayers,
} from '../services/lobbyService'
import type { OnlineLobbySession } from '../types/lobby'
import type { PvpMatch } from '../types/match'
import { OnlineErrorPanel } from './OnlineErrorPanel'
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
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const player = await fetchLobbyPlayer(session.playerId)
        if (player) setLives(player.lives)
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : 'Failed to load results.',
        )
      }
    }
    void load()

    const unsub = subscribeToLobbyPlayers(session.lobbyId, (players) => {
      const me = players.find((p) => p.id === session.playerId)
      if (me) setLives(me.lives)
    })

    return unsub
  }, [session.playerId, session.lobbyId, match.winnerPlayerId])

  if (loadError) {
    return (
      <section className="screen match-results-screen">
        <OnlineErrorPanel
          title="Results unavailable"
          message={loadError}
          onDismiss={onContinue}
        />
      </section>
    )
  }

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
        <OnlineErrorPanel
          title="Results unavailable"
          message="Match summary could not be built from battle data."
          onDismiss={onContinue}
        />
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
