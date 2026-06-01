/**
 * Rival intelligence — pure logic for rivalry creation, records, and display copy.
 * Extend RIVAL_INTEL_EXTENSIONS for future seasons / cross-lobby rivals.
 */

import type { LobbyPlayer } from '../types/lobby'
import type {
  OpponentRivalRecord,
  PlayerRivalRunStats,
  RivalChampionSummary,
  RivalHistoryMap,
  RivalMatchIntro,
} from '../types/rivals'
import { EMPTY_RIVAL_RUN_STATS } from '../types/rivals'

/** Wins against the same opponent required to become a rival (multiple defeats). */
export const RIVAL_WINS_AGAINST_OPPONENT = 2

export function createEmptyOpponentRecord(
  opponentId: string,
  opponentName: string,
): OpponentRivalRecord {
  return {
    opponentId,
    opponentName,
    wins: 0,
    losses: 0,
    eliminatedYou: false,
    youEliminatedThem: false,
    lastMatchId: null,
    lastMatchAt: null,
    lastMatchYouWon: null,
    isRival: false,
  }
}

export function getOpponentRivalRecord(
  history: RivalHistoryMap,
  opponentId: string,
  opponentName: string,
): OpponentRivalRecord {
  return (
    history[opponentId] ??
    createEmptyOpponentRecord(opponentId, opponentName)
  )
}

/** A rivalry forms when they beat you once, or you beat them multiple times. */
export function shouldBeRival(record: OpponentRivalRecord): boolean {
  if (record.isRival) return true
  if (record.losses > 0) return true
  if (record.wins >= RIVAL_WINS_AGAINST_OPPONENT) return true
  return false
}

export function formatRivalRecordLine(wins: number, losses: number): string {
  return `${wins} - ${losses}`
}

export function formatPreviousMatchResult(
  opponentName: string,
  lastMatchYouWon: boolean | null,
): string | null {
  if (lastMatchYouWon === null) return null
  return lastMatchYouWon
    ? `You defeated ${opponentName}`
    : `${opponentName} defeated you`
}

export function buildRivalMatchIntro(
  selfPlayer: LobbyPlayer,
  opponent: LobbyPlayer,
): RivalMatchIntro | null {
  const record = getOpponentRivalRecord(
    selfPlayer.rivalHistory,
    opponent.id,
    opponent.championName,
  )

  if (!record.isRival) return null

  const totalMatches = record.wins + record.losses
  if (totalMatches === 0 && !record.eliminatedYou && !record.youEliminatedThem) {
    return null
  }

  return {
    isRivalMatch: true,
    opponentName: opponent.championName,
    previousResultLine: formatPreviousMatchResult(
      opponent.championName,
      record.lastMatchYouWon,
    ),
    recordWins: record.wins,
    recordLosses: record.losses,
    recordLine: formatRivalRecordLine(record.wins, record.losses),
    eliminatedYou: record.eliminatedYou,
    youEliminatedThem: record.youEliminatedThem,
  }
}

export function computeRivalRunStats(
  history: RivalHistoryMap,
): PlayerRivalRunStats {
  const rivals = Object.values(history).filter((r) => r.isRival)
  if (rivals.length === 0) return { ...EMPTY_RIVAL_RUN_STATS }

  let rivalsDefeated = 0
  let rivalLosses = 0
  let longestRivalryMatches = 0
  let longestRivalryOpponentName: string | null = null

  for (const record of rivals) {
    const total = record.wins + record.losses
    rivalLosses += record.losses

    if (record.wins > record.losses) {
      rivalsDefeated += 1
    }

    if (total > longestRivalryMatches) {
      longestRivalryMatches = total
      longestRivalryOpponentName = record.opponentName
    }
  }

  return {
    rivalsDefeated,
    rivalLosses,
    longestRivalryMatches,
    longestRivalryOpponentName,
  }
}

export function getRivalSummariesForChampion(
  history: RivalHistoryMap,
): RivalChampionSummary[] {
  return Object.values(history)
    .filter((r) => r.isRival && r.wins + r.losses > 0)
    .sort((a, b) => b.wins + b.losses - (a.wins + a.losses))
    .map((record) => ({
      opponentName: record.opponentName,
      wins: record.wins,
      losses: record.losses,
      recordLine: formatRivalRecordLine(record.wins, record.losses),
      youEliminatedThem: record.youEliminatedThem,
      eliminatedYou: record.eliminatedYou,
    }))
}

export function getRivalsOvercome(
  history: RivalHistoryMap,
): RivalChampionSummary[] {
  return getRivalSummariesForChampion(history).filter(
    (r) => r.wins > r.losses || r.youEliminatedThem,
  )
}

/** Future season hooks can enrich intro copy or add cross-lobby badges. */
export interface RivalIntelExtension {
  id: string
  enrichIntro: (
    intro: RivalMatchIntro,
    self: LobbyPlayer,
    opponent: LobbyPlayer,
  ) => RivalMatchIntro
}

export const RIVAL_INTEL_EXTENSIONS: RivalIntelExtension[] = []

export function applyRivalIntroExtensions(
  intro: RivalMatchIntro,
  self: LobbyPlayer,
  opponent: LobbyPlayer,
): RivalMatchIntro {
  return RIVAL_INTEL_EXTENSIONS.reduce(
    (acc, ext) => ext.enrichIntro(acc, self, opponent),
    intro,
  )
}
