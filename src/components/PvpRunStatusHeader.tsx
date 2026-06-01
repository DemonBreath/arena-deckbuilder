import type { OnlineRunStatus } from '../hooks/useOnlineRunStatus'

interface PvpRunStatusHeaderProps {
  status: OnlineRunStatus
  title?: string
}

export function PvpRunStatusHeader({ status, title }: PvpRunStatusHeaderProps) {
  return (
    <header className="pvp-run-header">
      <div className="pvp-run-header__main">
        {title && <h2 className="pvp-run-header__title">{title}</h2>}
        <p className="pvp-run-header__champion">{status.championName}</p>
        <p className="pvp-run-header__lobby">
          Lobby <strong>{status.lobbyCode}</strong>
        </p>
      </div>
      <div className="pvp-run-header__stats">
        <div className="pvp-run-stat">
          <span className="pvp-run-stat__label">Lives</span>
          <strong className="pvp-run-stat__value pvp-run-stat__value--lives">
            {status.eliminated ? 0 : status.lives}
          </strong>
        </div>
        <div className="pvp-run-stat">
          <span className="pvp-run-stat__label">Gold</span>
          <strong className="pvp-run-stat__value pvp-run-stat__value--gold">
            {status.gold}
          </strong>
        </div>
        <div className="pvp-run-stat">
          <span className="pvp-run-stat__label">Defeated</span>
          <strong className="pvp-run-stat__value">{status.opponentsDefeated}</strong>
        </div>
        <div className="pvp-run-stat">
          <span className="pvp-run-stat__label">Active</span>
          <strong className="pvp-run-stat__value">
            {status.activePlayersRemaining}
          </strong>
        </div>
      </div>
    </header>
  )
}
