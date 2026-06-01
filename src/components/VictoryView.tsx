import { getRelic } from '../game/relicDatabase'
import {
  getOpponentsDefeatedProgress,
  type GameState,
} from '../game/gameState'
import { OPPONENT_COUNT } from '../game/tournamentDatabase'

interface VictoryViewProps {
  state: GameState
  submitted: boolean
  submitting: boolean
  submitMessage: string | null
  submitError: string | null
  onSubmit: () => void
  onViewChampions: () => void
  onRestart: () => void
}

export function VictoryView({
  state,
  submitted,
  submitting,
  submitMessage,
  submitError,
  onSubmit,
  onViewChampions,
  onRestart,
}: VictoryViewProps) {
  const progress = getOpponentsDefeatedProgress(state)

  return (
    <section className="screen victory-screen">
      <h1>Champion Crowned</h1>
      <p className="victory-champion-name">{state.championName}</p>
      <p className="victory-tagline">
        Every opponent has been defeated. The arena is yours.
      </p>

      <div className="game-over-stats">
        <div className="game-over-stat">
          <span className="game-over-stat__label">Opponents defeated</span>
          <strong className="game-over-stat__value">
            {progress.defeated} / {OPPONENT_COUNT}
          </strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Final deck size</span>
          <strong className="game-over-stat__value">{state.deck.length}</strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Total gold earned</span>
          <strong className="game-over-stat__value">{state.gold}</strong>
        </div>
      </div>

      <section className="game-over-relics">
        <h2>Relics owned ({state.relics.length})</h2>
        {state.relics.length === 0 ? (
          <p className="game-over-relics__empty">None</p>
        ) : (
          <ul className="game-over-relics__list">
            {state.relics.map((relicId) => {
              const relic = getRelic(relicId)
              return (
                <li key={relicId}>
                  <strong>{relic.name}</strong> — {relic.description}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {submitted ? (
        <p className="victory-submitted">
          {submitMessage ?? 'Submitted to Daily Champions! Your name is on the board.'}
        </p>
      ) : (
        <button
          type="button"
          className="primary-button"
          disabled={submitting}
          onClick={onSubmit}
        >
          {submitting ? 'Submitting…' : 'Submit to Daily Champions'}
        </button>
      )}

      {submitError && <p className="online-lobby-error">{submitError}</p>}

      <div className="victory-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onViewChampions}
        >
          View Daily Champions
        </button>
        <button type="button" className="secondary-button" onClick={onRestart}>
          Restart
        </button>
      </div>
    </section>
  )
}
