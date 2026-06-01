import type { MatchStatus } from './match'

export type ArenaFeedKind =
  | 'match_started'
  | 'defeated'
  | 'eliminated'
  | 'champion'

export interface ArenaFeedEntry {
  id: string
  kind: ArenaFeedKind
  message: string
  at: number
}

export interface SpectatorMatchSummary {
  matchId: string
  player1Name: string
  player2Name: string
  player1Hp: number
  player2Hp: number
  turnLabel: string
  status: MatchStatus
}
