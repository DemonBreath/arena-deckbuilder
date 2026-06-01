import { useMemo, useState } from 'react'
import { useOnlineConnectivity } from '../hooks/useOnlineConnectivity'
import { useOnlineRunStatus } from '../hooks/useOnlineRunStatus'
import { useSpectatorArena } from '../hooks/useSpectatorArena'
import { ConnectionStatusBanner } from './ConnectionStatusBanner'
import type { OnlineLobbySession } from '../types/lobby'
import { ArenaFeedPanel } from './ArenaFeedPanel'
import { ArenaRosterPanel } from './ArenaRosterPanel'
import { PvpRunStatusHeader } from './PvpRunStatusHeader'
import { SpectatorMatchList } from './SpectatorMatchList'
import { SpectatorMatchWatch } from './SpectatorMatchWatch'

interface SpectatorViewProps {
  session: OnlineLobbySession
  onLeave: () => void
  onViewChampions: () => void
}

export function SpectatorView({
  session,
  onLeave,
  onViewChampions,
}: SpectatorViewProps) {
  const runStatus = useOnlineRunStatus(session)
  const { connectionStatus } = useOnlineConnectivity(
    session.playerId,
    session.lobbyId,
  )
  const {
    lobby,
    players,
    matchSummaries,
    feed,
    loading,
    error,
    isArenaFinished,
  } = useSpectatorArena(session)

  const [watchMatchId, setWatchMatchId] = useState<string | null>(null)

  const watchLabel = useMemo(() => {
    if (!watchMatchId) return ''
    const summary = matchSummaries.find((m) => m.matchId === watchMatchId)
    if (!summary) return 'Watching match'
    return `${summary.player1Name} vs ${summary.player2Name}`
  }, [watchMatchId, matchSummaries])

  if (watchMatchId) {
    return (
      <SpectatorMatchWatch
        session={session}
        matchId={watchMatchId}
        matchLabel={watchLabel}
        onBack={() => setWatchMatchId(null)}
      />
    )
  }

  return (
    <section className="screen spectator-screen spectator-hub">
      <ConnectionStatusBanner status={connectionStatus} />
      {runStatus && (
        <PvpRunStatusHeader status={runStatus} title="Spectator Mode" />
      )}

      <div className="spectator-hub__intro">
        <h2 className="spectator-hub__heading">You&apos;re eliminated</h2>
        <p className="spectator-hub__tagline">
          {isArenaFinished
            ? 'The arena has crowned a champion. Browse results or leave the lobby.'
            : 'Watch live matches and follow the arena feed while fighters continue.'}
        </p>
      </div>

      {error && <p className="online-lobby-error">{error}</p>}

      <div className="spectator-hub__grid">
        <SpectatorMatchList
          matches={matchSummaries}
          selectedMatchId={null}
          onSelectMatch={setWatchMatchId}
          loading={loading}
        />
        <ArenaFeedPanel entries={feed} />
      </div>

      {players.length > 0 && (
        <ArenaRosterPanel
          players={players}
          myPlayerId={session.playerId}
          roundNumber={lobby?.roundNumber}
        />
      )}

      <div className="spectator-hub__actions">
        <button
          type="button"
          className="primary-button"
          onClick={onViewChampions}
        >
          Daily Champions
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onLeave}
        >
          Leave Lobby
        </button>
      </div>
    </section>
  )
}
