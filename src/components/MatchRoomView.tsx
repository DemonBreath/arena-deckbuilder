import { useOnlineConnectivity } from '../hooks/useOnlineConnectivity'
import { usePvpBattle } from '../hooks/usePvpBattle'
import { useOnlineRunStatus } from '../hooks/useOnlineRunStatus'
import { ConnectionStatusBanner } from './ConnectionStatusBanner'
import { OnlineErrorPanel } from './OnlineErrorPanel'
import type { OnlineMatchSession, PvpMatch } from '../types/match'
import { PvpCombatView } from './PvpCombatView'
import { PvpRunStatusHeader } from './PvpRunStatusHeader'

interface MatchRoomViewProps {
  session: OnlineMatchSession
  onLeave: () => void
  onMatchComplete: (match: PvpMatch) => void
}

function connectionLabel(
  status: ReturnType<typeof usePvpBattle>['connectionStatus'],
): string {
  switch (status) {
    case 'connecting':
      return 'Connecting…'
    case 'waiting_opponent':
      return 'Waiting for opponent…'
    case 'opponent_connected':
      return 'Opponent connected'
    case 'both_connected':
      return 'Both players connected'
    default:
      return 'Unknown'
  }
}

export function MatchRoomView({
  session,
  onLeave,
  onMatchComplete,
}: MatchRoomViewProps) {
  const runStatus = useOnlineRunStatus(session)
  const { connectionStatus: realtimeStatus } = useOnlineConnectivity(
    session.playerId,
    session.lobbyId,
  )
  const {
    match,
    battleView,
    battleViewError,
    error,
    loading,
    actionPending,
    connectionStatus: matchConnectionStatus,
    bothConnected,
    retryLoad,
    playCard,
    sendEmote,
    endTurn,
    remoteStateJson,
    localStateJson,
    stateVersion,
    turnStartAt,
    opponentLastSeenAt,
    opponentChampionName,
  } = usePvpBattle(session, { onMatchComplete })

  const opponentName =
    opponentChampionName ??
    session.opponentChampionName ??
    'Waiting for opponent…'

  if (battleView && bothConnected) {
    return (
      <PvpCombatView
        session={session}
        view={battleView}
        actionPending={actionPending}
        error={error}
        localStateJson={localStateJson}
        remoteStateJson={remoteStateJson}
        stateVersion={stateVersion}
        turnStartAt={turnStartAt}
        opponentLastSeenAt={opponentLastSeenAt}
        onPlayCard={(index) => void playCard(index)}
        onSendEmote={(id) => void sendEmote(id)}
        onEndTurn={() => void endTurn()}
        onLeave={onLeave}
      />
    )
  }

  if (bothConnected && match?.battleState && battleViewError) {
    return (
      <section className="screen match-room-screen">
        <ConnectionStatusBanner status={realtimeStatus} />
        {runStatus && <PvpRunStatusHeader status={runStatus} title="Match Room" />}
        <OnlineErrorPanel
          title="Battle could not load"
          message={battleViewError}
          onRetry={() => void retryLoad()}
          onDismiss={onLeave}
        />
      </section>
    )
  }

  return (
    <section className="screen match-room-screen">
      <ConnectionStatusBanner status={realtimeStatus} />
      {runStatus && <PvpRunStatusHeader status={runStatus} title="Match Room" />}

      <p className="match-room-screen__tagline">
        Connecting players — battle starts when both are loaded.
      </p>

      <div className="match-room-fighters">
        <div className="match-room-fighter match-room-fighter--you">
          <span className="match-room-fighter__role">You</span>
          <strong>{session.championName}</strong>
          <span className="match-room-fighter__status">
            {loading ? 'Confirming…' : 'Connected'}
          </span>
        </div>
        <div className="match-room-vs">VS</div>
        <div className="match-room-fighter match-room-fighter--opponent">
          <span className="match-room-fighter__role">Opponent</span>
          <strong>{opponentName}</strong>
          <span
            className={`match-room-fighter__status match-room-fighter__status--${matchConnectionStatus}`}
          >
            {matchConnectionStatus === 'waiting_opponent'
              ? 'Waiting for opponent…'
              : matchConnectionStatus === 'both_connected'
                ? 'Connected'
                : connectionLabel(matchConnectionStatus)}
          </span>
        </div>
      </div>

      <div
        className={`match-room-connection match-room-connection--${matchConnectionStatus}`}
      >
        <span>Match pairing</span>
        <strong>{connectionLabel(matchConnectionStatus)}</strong>
      </div>

      {bothConnected && !battleView && !battleViewError && (
        <p className="match-room-ready-banner">
          Both players connected — starting battle…
        </p>
      )}

      {error && (
        <p className="online-lobby-error">
          {error}
          <button
            type="button"
            className="link-button"
            onClick={() => void retryLoad()}
          >
            Retry
          </button>
        </p>
      )}

      {match && (
        <p className="match-room-status-line">
          Match status: <strong>{match.status}</strong>
        </p>
      )}

      <button type="button" className="secondary-button" onClick={onLeave}>
        Back to Lobby
      </button>
    </section>
  )
}
