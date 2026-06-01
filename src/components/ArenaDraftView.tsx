import { getArenaDraftDefinition } from '../game/arenaDrafts'
import { useArenaDraft } from '../hooks/useArenaDraft'
import { useOnlineRunStatus } from '../hooks/useOnlineRunStatus'
import type { OnlineLobbySession } from '../types/lobby'
import { ActiveArenaDraftsPanel } from './ActiveArenaDraftsPanel'
import { PvpRunStatusHeader } from './PvpRunStatusHeader'

interface ArenaDraftViewProps {
  session: OnlineLobbySession
  onContinueToShop: () => void
}

function formatTimer(seconds: number | null): string {
  if (seconds === null) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ArenaDraftView({
  session,
  onContinueToShop,
}: ArenaDraftViewProps) {
  const runStatus = useOnlineRunStatus(session)
  const {
    lobby,
    draftSession,
    myVoteIndex,
    voteCounts,
    secondsRemaining,
    activeSurvivors,
    votePending,
    error,
    castVote,
    winnerDefinition,
    isResolved,
    canVote,
  } = useArenaDraft(session)

  if (!draftSession || !lobby) {
    return (
      <section className="screen arena-draft-screen">
        <p>Loading arena draft…</p>
      </section>
    )
  }

  const votedCount = Object.keys(draftSession.votes).length

  return (
    <section className="screen arena-draft-screen">
      {runStatus && (
        <PvpRunStatusHeader status={runStatus} title="Arena Draft Vote" />
      )}

      <header className="arena-draft-screen__header">
        <h1>Arena Draft — Round {draftSession.roundNumber}</h1>
        <p>
          Surviving players shape the lobby. Effects apply equally to everyone
          and stack for the rest of the run.
        </p>
      </header>

      <ActiveArenaDraftsPanel
        activeDraftIds={lobby.activeDraftIds}
        title="Currently active (before this vote)"
        compact
      />

      {!isResolved && (
        <div className="arena-draft-timer" role="timer" aria-live="polite">
          <span>Voting ends in</span>
          <strong>{formatTimer(secondsRemaining)}</strong>
          <span className="arena-draft-timer__meta">
            {votedCount} / {activeSurvivors} survivors voted
          </span>
        </div>
      )}

      {isResolved && winnerDefinition && (
        <div className="arena-draft-results arena-draft-results--winner">
          <h2>Winner — {winnerDefinition.name}</h2>
          <p>{winnerDefinition.description}</p>
          <p className="arena-draft-results__note">
            This modifier is now active for every surviving player (stacks with
            prior drafts).
          </p>
        </div>
      )}

      <div className="arena-draft-options">
        {draftSession.options.map((draftId, index) => {
          const def = getArenaDraftDefinition(draftId)
          const selected = myVoteIndex === index
          const count = voteCounts[index] ?? 0
          const isWinner =
            isResolved && draftSession.winnerId === draftId

          return (
            <div
              key={draftId}
              className={`arena-draft-option ${
                selected ? 'arena-draft-option--selected' : ''
              } ${isWinner ? 'arena-draft-option--winner' : ''}`}
            >
              <div className="arena-draft-option__header">
                <strong>{def.name}</strong>
                {(isResolved || votedCount > 0) && (
                  <span className="arena-draft-option__votes">
                    {count} vote{count === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <p className="arena-draft-option__tagline">{def.tagline}</p>
              <p className="arena-draft-option__description">{def.description}</p>
              {canVote && (
                <button
                  type="button"
                  className="primary-button"
                  disabled={votePending}
                  onClick={() => void castVote(index)}
                >
                  Vote for {def.name}
                </button>
              )}
              {selected && !isResolved && (
                <p className="arena-draft-option__you-voted">Your vote</p>
              )}
              {isWinner && (
                <p className="arena-draft-option__winner-badge">Chosen by the lobby</p>
              )}
            </div>
          )
        })}
      </div>

      {myVoteIndex !== undefined && !isResolved && (
        <p className="arena-draft-waiting">
          Vote recorded — waiting for other survivors…
        </p>
      )}

      {error && <p className="online-lobby-error">{error}</p>}

      {isResolved && (
        <div className="arena-draft-actions">
          <button
            type="button"
            className="primary-button primary-button--large"
            onClick={onContinueToShop}
          >
            Continue to Shop
          </button>
        </div>
      )}
    </section>
  )
}
