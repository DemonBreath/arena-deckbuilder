import { getOpponentRivalRecord, shouldBeRival } from '../game/rivalIntel'
import { getSupabaseClient } from '../lib/supabaseClient'
import type { PvpMatch } from '../types/match'
import type {
  OpponentRivalRecord,
  RivalHistoryMap,
} from '../types/rivals'
import { fetchLobbyPlayer } from './lobbyService'

function parseOpponentRecord(
  opponentId: string,
  raw: unknown,
): OpponentRivalRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const opponentName =
    typeof row.opponentName === 'string' ? row.opponentName : 'Unknown'
  return {
    opponentId,
    opponentName,
    wins: typeof row.wins === 'number' ? Math.max(0, row.wins) : 0,
    losses: typeof row.losses === 'number' ? Math.max(0, row.losses) : 0,
    eliminatedYou: Boolean(row.eliminatedYou),
    youEliminatedThem: Boolean(row.youEliminatedThem),
    lastMatchId:
      typeof row.lastMatchId === 'string' ? row.lastMatchId : null,
    lastMatchAt:
      typeof row.lastMatchAt === 'string' ? row.lastMatchAt : null,
    lastMatchYouWon:
      typeof row.lastMatchYouWon === 'boolean' ? row.lastMatchYouWon : null,
    isRival: Boolean(row.isRival),
  }
}

export function parseRivalHistory(raw: unknown): RivalHistoryMap {
  if (!raw || typeof raw !== 'object') return {}
  const out: RivalHistoryMap = {}
  for (const [opponentId, value] of Object.entries(raw)) {
    const record = parseOpponentRecord(opponentId, value)
    if (record) out[opponentId] = record
  }
  return out
}

function applyMatchToRecord(
  record: OpponentRivalRecord,
  youWon: boolean,
  match: PvpMatch,
  options: {
    opponentName: string
    eliminatedYou?: boolean
    youEliminatedThem?: boolean
  },
): OpponentRivalRecord {
  const next: OpponentRivalRecord = {
    ...record,
    opponentName: options.opponentName,
    wins: record.wins + (youWon ? 1 : 0),
    losses: record.losses + (youWon ? 0 : 1),
    lastMatchId: match.id,
    lastMatchAt: new Date().toISOString(),
    lastMatchYouWon: youWon,
    eliminatedYou: record.eliminatedYou || Boolean(options.eliminatedYou),
    youEliminatedThem:
      record.youEliminatedThem || Boolean(options.youEliminatedThem),
  }
  next.isRival = shouldBeRival(next)
  return next
}

export async function persistPlayerRivalHistory(
  playerId: string,
  history: RivalHistoryMap,
): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('lobby_players')
    .update({ rival_history: history })
    .eq('id', playerId)

  if (error) throw new Error(error.message)
}

/**
 * Update head-to-head records after arena progression (so elimination is known).
 * Information only — no gameplay effects.
 */
export async function recordMatchRivalHistory(
  match: PvpMatch,
): Promise<void> {
  if (!match.player2Id || !match.winnerPlayerId) return

  const loserId =
    match.winnerPlayerId === match.player1Id
      ? match.player2Id
      : match.player1Id

  const [winnerRow, loserRow] = await Promise.all([
    fetchLobbyPlayer(match.winnerPlayerId),
    fetchLobbyPlayer(loserId),
  ])
  if (!winnerRow || !loserRow) return

  const loserEliminated = loserRow.eliminated

  const winnerHistory = { ...winnerRow.rivalHistory }
  const loserHistory = { ...loserRow.rivalHistory }

  const winnerVsLoser = getOpponentRivalRecord(
    winnerHistory,
    loserRow.id,
    loserRow.championName,
  )
  const loserVsWinner = getOpponentRivalRecord(
    loserHistory,
    winnerRow.id,
    winnerRow.championName,
  )

  winnerHistory[loserRow.id] = applyMatchToRecord(
    winnerVsLoser,
    true,
    match,
    {
      opponentName: loserRow.championName,
      youEliminatedThem: loserEliminated,
    },
  )

  loserHistory[winnerRow.id] = applyMatchToRecord(
    loserVsWinner,
    false,
    match,
    {
      opponentName: winnerRow.championName,
      eliminatedYou: loserEliminated,
    },
  )

  await Promise.all([
    persistPlayerRivalHistory(match.winnerPlayerId, winnerHistory),
    persistPlayerRivalHistory(loserId, loserHistory),
  ])
}
