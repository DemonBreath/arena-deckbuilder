import type { ArenaDraftId } from '../game/arenaDrafts'

export type ArenaDraftSessionStatus = 'voting' | 'resolved'

export interface ArenaDraftVoteSession {
  roundNumber: number
  options: ArenaDraftId[]
  /** playerId → option index (0–2) */
  votes: Record<string, number>
  endsAt: string
  status: ArenaDraftSessionStatus
  winnerId: ArenaDraftId | null
  /** option index → vote count (set when resolved) */
  voteCounts: number[] | null
}

export interface ArenaDraftResultSummary {
  roundNumber: number
  winnerId: ArenaDraftId
  voteCounts: number[]
  options: ArenaDraftId[]
}
