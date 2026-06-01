/**
 * Rival system types (Milestone 26) — informational run-long opponent stories.
 * Designed for future season / cross-lobby extensions via RivalHistoryMap keys.
 */

/** Head-to-head record vs one opponent during the current lobby run. */
export interface OpponentRivalRecord {
  opponentId: string
  opponentName: string
  wins: number
  losses: number
  /** Opponent eliminated you from the run (took your last life). */
  eliminatedYou: boolean
  /** You eliminated the opponent from the run. */
  youEliminatedThem: boolean
  lastMatchId: string | null
  lastMatchAt: string | null
  /** Null until at least one match has been played. */
  lastMatchYouWon: boolean | null
  isRival: boolean
}

export type RivalHistoryMap = Record<string, OpponentRivalRecord>

/** Aggregate rivalry statistics for the current run (information only). */
export interface PlayerRivalRunStats {
  rivalsDefeated: number
  rivalLosses: number
  longestRivalryMatches: number
  longestRivalryOpponentName: string | null
}

export const EMPTY_RIVAL_RUN_STATS: PlayerRivalRunStats = {
  rivalsDefeated: 0,
  rivalLosses: 0,
  longestRivalryMatches: 0,
  longestRivalryOpponentName: null,
}

/** Shown on match introduction when facing a rival. */
export interface RivalMatchIntro {
  isRivalMatch: boolean
  opponentName: string
  previousResultLine: string | null
  recordWins: number
  recordLosses: number
  recordLine: string
  eliminatedYou: boolean
  youEliminatedThem: boolean
}

/** Champion screen summary for one overcome rival. */
export interface RivalChampionSummary {
  opponentName: string
  wins: number
  losses: number
  recordLine: string
  youEliminatedThem: boolean
  eliminatedYou: boolean
}
