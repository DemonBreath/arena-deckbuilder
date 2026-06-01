import {
  getLobbyDisplayStatus,
  getLobbyDisplayStatusLabel,
  type LobbyDisplayStatus,
} from '../lib/lobbyDisplay'
import type { Lobby } from '../types/lobby'

interface LobbyStatusBadgeProps {
  lobby: Lobby | null
  /** Override when lobby row is missing but we know display state */
  overrideStatus?: LobbyDisplayStatus
}

export function LobbyStatusBadge({
  lobby,
  overrideStatus,
}: LobbyStatusBadgeProps) {
  const status = overrideStatus ?? getLobbyDisplayStatus(lobby)
  const label = getLobbyDisplayStatusLabel(status)

  return (
    <div
      className={`lobby-status-badge lobby-status-badge--${status}`}
      role="status"
    >
      <span className="lobby-status-badge__label">Lobby status</span>
      <strong>{label}</strong>
    </div>
  )
}
