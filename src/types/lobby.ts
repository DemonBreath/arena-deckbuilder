import type { CardId } from '../game/cardDatabase'
import type { ClassId } from '../game/classDatabase'
import type { RelicId } from '../game/relicDatabase'
import { ARENA_MAX_PLAYERS } from '../game/arenaConstants'

export type LobbyStatus =
  | 'waiting'
  | 'starting'
  | 'in_match'
  | 'shop'
  | 'finished'

export type ReadyState = 'not_ready' | 'ready'

export interface Lobby {
  id: string
  code: string
  status: LobbyStatus
  roundNumber: number
  championPlayerId: string | null
  createdAt: string
}

export interface LobbyPlayer {
  id: string
  lobbyId: string
  sessionId: string
  championName: string
  classId: ClassId
  readyState: ReadyState
  lives: number
  eliminated: boolean
  gold: number
  opponentsDefeated: number
  shopDone: boolean
  deck: CardId[] | null
  relics: RelicId[]
  joinedAt: string
  lastSeenAt: string | null
}

export interface OnlineLobbySession {
  lobbyId: string
  lobbyCode: string
  playerId: string
  sessionId: string
  championName: string
  classId: ClassId
}

export function readyStateFromBoolean(ready: boolean): ReadyState {
  return ready ? 'ready' : 'not_ready'
}

export function countReadyPlayers(players: LobbyPlayer[]): number {
  return players.filter(
    (p) => p.readyState === 'ready' && !p.eliminated,
  ).length
}

export function countActiveReadyPlayers(players: LobbyPlayer[]): number {
  return countReadyPlayers(players)
}

export function canStartLobbyRound(players: LobbyPlayer[]): boolean {
  return countReadyPlayers(players) >= 2
}

export function isLobbyHost(
  players: LobbyPlayer[],
  playerId: string,
): boolean {
  if (players.length === 0) return false
  const sorted = [...players].sort((a, b) =>
    a.joinedAt.localeCompare(b.joinedAt),
  )
  return sorted[0].id === playerId
}

export function isLobbyFull(players: LobbyPlayer[]): boolean {
  return players.length >= ARENA_MAX_PLAYERS
}

export function getRankedLobbyPlayers(players: LobbyPlayer[]): Array<
  LobbyPlayer & { rank: number }
> {
  const sorted = [...players].sort((a, b) => {
    if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1
    if (b.opponentsDefeated !== a.opponentsDefeated) {
      return b.opponentsDefeated - a.opponentsDefeated
    }
    if (b.gold !== a.gold) return b.gold - a.gold
    return a.joinedAt.localeCompare(b.joinedAt)
  })
  return sorted.map((p, i) => ({ ...p, rank: i + 1 }))
}
