import type { PersistedOnlineSession } from '../services/persistedSessionService'

interface RejoinPromptProps {
  persisted: PersistedOnlineSession
  rejoining: boolean
  error: string | null
  onRejoin: () => void
  onStartFresh: () => void
}

export function RejoinPrompt({
  persisted,
  rejoining,
  error,
  onRejoin,
  onStartFresh,
}: RejoinPromptProps) {
  return (
    <section className="rejoin-prompt">
      <h2 className="rejoin-prompt__title">Resume your arena run?</h2>
      <p className="rejoin-prompt__detail">
        We found a saved session for{' '}
        <strong>{persisted.championName}</strong> in lobby{' '}
        <strong>{persisted.lobbyCode}</strong>.
        {persisted.matchId && (
          <>
            {' '}
            You were in an active match — rejoin will restore it if still running.
          </>
        )}
      </p>
      {error && <p className="online-lobby-error">{error}</p>}
      <div className="rejoin-prompt__actions">
        <button
          type="button"
          className="primary-button"
          disabled={rejoining}
          onClick={onRejoin}
        >
          {rejoining ? 'Rejoining…' : 'Rejoin Lobby'}
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={rejoining}
          onClick={onStartFresh}
        >
          Start Fresh
        </button>
      </div>
    </section>
  )
}
