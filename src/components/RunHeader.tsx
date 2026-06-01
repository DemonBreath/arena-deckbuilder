import { formatPlayerClassTitle } from '../game/classIdentity'
import {
  formatRound,
  getOpponentsDefeatedProgress,
  runIdentity,
  type GameState,
} from '../game/gameState'

interface RunHeaderProps {
  state: GameState
  title?: string
}

export function RunHeader({ state, title }: RunHeaderProps) {
  const progress = getOpponentsDefeatedProgress(state)
  const classTitle = formatPlayerClassTitle(runIdentity(state))

  return (
    <header className="run-header">
      <div className="run-header__titles">
        {title && <h2>{title}</h2>}
        <p className="run-header__champion">
          {state.championName} — {classTitle}
        </p>
        <p className="run-header__round">{formatRound(state.battleNumber)}</p>
      </div>
      <div className="run-header__stats">
        <p className="progress-display">
          Opponents defeated: {progress.defeated} / {progress.total}
        </p>
        <p className="lives-display">Lives: {state.lives}</p>
        <p className="gold-display">Gold: {state.gold}</p>
      </div>
    </header>
  )
}
