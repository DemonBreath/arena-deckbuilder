import type { Lobby, LobbyStatus } from '../types/lobby'

export type LobbyDisplayStatus =
  | 'waiting'
  | 'in_progress'
  | 'champion_crowned'
  | 'closed'

export function getLobbyDisplayStatus(lobby: Lobby | null): LobbyDisplayStatus {
  if (!lobby) return 'closed'

  switch (lobby.status) {
    case 'waiting':
      return 'waiting'
    case 'finished':
      return 'champion_crowned'
    case 'starting':
    case 'in_match':
    case 'shop':
      return 'in_progress'
    default:
      return 'closed'
  }
}

export function getLobbyDisplayStatusLabel(status: LobbyDisplayStatus): string {
  switch (status) {
    case 'waiting':
      return 'Waiting'
    case 'in_progress':
      return 'In Progress'
    case 'champion_crowned':
      return 'Champion Crowned'
    case 'closed':
      return 'Closed'
    default:
      return 'Closed'
  }
}

export function isLobbyRunInProgress(status: LobbyStatus | undefined): boolean {
  return (
    status === 'starting' ||
    status === 'in_match' ||
    status === 'shop' ||
    status === 'finished'
  )
}
