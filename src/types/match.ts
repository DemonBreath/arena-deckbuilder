import type { PvpBattleState } from '../game/pvpBattleState'

export type MatchStatus = 'waiting' | 'active' | 'completed'

export interface PvpMatch {
  id: string
  lobbyId: string
  lobbyCode: string
  player1Id: string
  player2Id: string | null
  player1Loaded: boolean
  player2Loaded: boolean
  status: MatchStatus
  battleState: PvpBattleState | null
  stateVersion: number
  winnerPlayerId: string | null
  createdAt: string
  turnStartAt: string | null
  battleStartedAt: string | null
}

export interface OnlineMatchSession {
  matchId: string
  lobbyId: string
  lobbyCode: string
  playerId: string
  sessionId: string
  championName: string
  opponentPlayerId: string | null
  opponentChampionName: string | null
}

export interface MatchPairingResult {
  matches: PvpMatch[]
  byePlayerIds: string[]
}

export type ConnectionStatus =
  | 'connecting'
  | 'waiting_opponent'
  | 'opponent_connected'
  | 'both_connected'

export function getOpponentId(
  match: PvpMatch,
  myPlayerId: string,
): string | null {
  if (match.player1Id === myPlayerId) return match.player2Id
  if (match.player2Id === myPlayerId) return match.player1Id
  return null
}

export function isPlayerInMatch(match: PvpMatch, playerId: string): boolean {
  return match.player1Id === playerId || match.player2Id === playerId
}

export function isPlayerLoaded(match: PvpMatch, playerId: string): boolean {
  if (match.player1Id === playerId) return match.player1Loaded
  if (match.player2Id === playerId) return match.player2Loaded
  return false
}

export function isOpponentLoaded(match: PvpMatch, myPlayerId: string): boolean {
  const opponentId = getOpponentId(match, myPlayerId)
  if (!opponentId) return false
  return isPlayerLoaded(match, opponentId)
}

export function bothPlayersLoaded(match: PvpMatch): boolean {
  if (!match.player2Id) return false
  return match.player1Loaded && match.player2Loaded
}

export function getConnectionStatus(
  match: PvpMatch,
  myPlayerId: string,
  selfMarkedLoaded: boolean,
): ConnectionStatus {
  if (!match.player2Id) return 'connecting'
  if (!selfMarkedLoaded) return 'connecting'
  if (!isOpponentLoaded(match, myPlayerId)) return 'waiting_opponent'
  if (bothPlayersLoaded(match)) return 'both_connected'
  return 'opponent_connected'
}
