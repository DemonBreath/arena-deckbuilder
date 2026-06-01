import { getRelic } from '../game/relicDatabase'
import {
  getOpponentsDefeatedProgress,
  getRoundsSurvived,
  type GameState,
} from '../game/gameState'

interface GameOverViewProps {
  state: GameState
  onRestart: () => void
  onViewChampions: () => void
}

export function GameOverView({
  state,
  onRestart,
  onViewChampions,
}: GameOverViewProps) {
  const roundsSurvived = getRoundsSurvived(state)
  const progress = getOpponentsDefeatedProgress(state)

  return (
    <section className="screen game-over-screen">
      <h1>Game Over</h1>
      <p className="game-over-champion">{state.championName}</p>
      <p className="game-over-tagline">Your run has ended.</p>

      <div className="game-over-stats">
        <div className="game-over-stat">
          <span className="game-over-stat__label">Rounds survived</span>
          <strong className="game-over-stat__value">{roundsSurvived}</strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Opponents defeated</span>
          <strong className="game-over-stat__value">
            {progress.defeated} / {progress.total}
          </strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Gold earned</span>
          <strong className="game-over-stat__value">{state.gold}</strong>
        </div>
      </div>

      <section className="game-over-relics">
        <h2>Relics owned</h2>
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

      <div className="victory-actions">
        <button type="button" className="primary-button" onClick={onRestart}>
          Restart
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onViewChampions}
        >
          View Daily Champions
        </button>
      </div>
    </section>
  )
}
