import { useMemo } from 'react'
import { useSpectatorMatch } from '../hooks/useSpectatorMatch'
import type { OnlineLobbySession } from '../types/lobby'
import { SpectatorCombatView } from './SpectatorCombatView'

interface SpectatorMatchWatchProps {
  session: OnlineLobbySession
  matchId: string
  matchLabel: string
  onBack: () => void
}

export function SpectatorMatchWatch({
  session,
  matchId,
  matchLabel,
  onBack,
}: SpectatorMatchWatchProps) {
  const { match, battleView, loading, error, stateVersion, turnStartAt } =
    useSpectatorMatch(matchId)

  const waitingMessage = useMemo(() => {
    if (!match) return null
    if (match.battleState) return null
    if (match.status === 'waiting') {
      return 'Players are connecting — battle will appear when both are loaded.'
    }
    return 'Battle state loading…'
  }, [match])

  if (loading && !battleView) {
    return (
      <section className="screen spectator-screen">
        <p>Loading match…</p>
        <button type="button" className="secondary-button" onClick={onBack}>
          Back to Spectator Hub
        </button>
      </section>
    )
  }

  if (error && !battleView) {
    return (
      <section className="screen spectator-screen">
        <p className="online-lobby-error">{error}</p>
        <button type="button" className="secondary-button" onClick={onBack}>
          Back to Spectator Hub
        </button>
      </section>
    )
  }

  if (battleView) {
    return (
      <SpectatorCombatView
        session={session}
        view={battleView}
        stateVersion={stateVersion}
        turnStartAt={turnStartAt}
        matchLabel={matchLabel}
        onBack={onBack}
      />
    )
  }

  return (
    <section className="screen spectator-screen">
      <p className="spectator-placeholder__message">{waitingMessage}</p>
      <p className="spectator-match-watch__label">{matchLabel}</p>
      <button type="button" className="secondary-button" onClick={onBack}>
        Back to Spectator Hub
      </button>
    </section>
  )
}
