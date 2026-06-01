import type { CardId } from '../game/cardDatabase'
import { parseEvolutionId, type EvolutionId } from '../game/classEvolutions'
import {
  getPlayerSlot,
  type PvpBattleState,
  type PvpPlayerMatchStats,
} from '../game/pvpBattleState'
import { getSupabaseClient } from '../lib/supabaseClient'
import type { PvpMatch } from '../types/match'
import {
  EMPTY_SCOUTING_STATS,
  type PlayerScoutingStats,
} from '../types/scouting'
import { fetchLobbyPlayer } from './lobbyService'

function parseCardPlayCounts(
  raw: unknown,
): Partial<Record<CardId, number>> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Partial<Record<CardId, number>> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'number' && value > 0) {
      out[key as CardId] = value
    }
  }
  return out
}

export function parsePlayerScoutingStats(raw: unknown): PlayerScoutingStats {
  if (!raw || typeof raw !== 'object') {
    return { ...EMPTY_SCOUTING_STATS, cardPlayCounts: {} }
  }
  const row = raw as Record<string, unknown>
  return {
    matchesWon:
      typeof row.matchesWon === 'number'
        ? Math.max(0, row.matchesWon)
        : 0,
    damageDealt:
      typeof row.damageDealt === 'number'
        ? Math.max(0, row.damageDealt)
        : 0,
    damageTaken:
      typeof row.damageTaken === 'number'
        ? Math.max(0, row.damageTaken)
        : 0,
    cardsPlayed:
      typeof row.cardsPlayed === 'number'
        ? Math.max(0, row.cardsPlayed)
        : 0,
    cardPlayCounts: parseCardPlayCounts(row.cardPlayCounts),
  }
}

function mergeCardPlayCounts(
  base: Partial<Record<CardId, number>>,
  delta: Partial<Record<CardId, number>>,
): Partial<Record<CardId, number>> {
  const merged = { ...base }
  for (const [cardId, count] of Object.entries(delta)) {
    if (typeof count !== 'number' || count <= 0) continue
    const key = cardId as CardId
    merged[key] = (merged[key] ?? 0) + count
  }
  return merged
}

function accumulateMatchStats(
  current: PlayerScoutingStats,
  matchStats: PvpPlayerMatchStats,
  won: boolean,
): PlayerScoutingStats {
  return {
    matchesWon: current.matchesWon + (won ? 1 : 0),
    damageDealt: current.damageDealt + matchStats.damageDealt,
    damageTaken: current.damageTaken + matchStats.damageTaken,
    cardsPlayed: current.cardsPlayed + matchStats.cardsPlayed,
    cardPlayCounts: mergeCardPlayCounts(
      current.cardPlayCounts,
      matchStats.cardPlayCounts ?? {},
    ),
  }
}

function slotStatsFromBattle(
  state: PvpBattleState,
  slot: 1 | 2,
): PvpPlayerMatchStats {
  const raw = slot === 1 ? state.stats.player1 : state.stats.player2
  const opponentSlot = slot === 1 ? 2 : 1
  const oppRaw =
    opponentSlot === 1 ? state.stats.player1 : state.stats.player2
  return {
    damageDealt: raw.damageDealt,
    damageTaken: oppRaw.damageDealt,
    cardsPlayed: raw.cardsPlayed,
    cardPlayCounts: raw.cardPlayCounts ?? {},
  }
}

export async function syncPlayerEvolution(
  playerId: string,
  evolutionId: EvolutionId | null,
): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('lobby_players')
    .update({ evolution_id: evolutionId })
    .eq('id', playerId)

  if (error) throw new Error(error.message)
}

export async function persistPlayerScoutingStats(
  playerId: string,
  stats: PlayerScoutingStats,
): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('lobby_players')
    .update({ scouting_stats: stats })
    .eq('id', playerId)

  if (error) throw new Error(error.message)
}

/** Merge completed-match stats into both lobby players (information only). */
export async function recordMatchScoutingStats(
  match: PvpMatch,
): Promise<void> {
  if (!match.battleState || !match.player2Id || !match.winnerPlayerId) {
    return
  }

  const state = match.battleState
  const p1Slot = getPlayerSlot(state, match.player1Id)
  const p2Slot = getPlayerSlot(state, match.player2Id)
  if (!p1Slot || !p2Slot) return

  const p1MatchStats = slotStatsFromBattle(state, p1Slot)
  const p2MatchStats = slotStatsFromBattle(state, p2Slot)

  const [row1, row2] = await Promise.all([
    fetchLobbyPlayer(match.player1Id),
    fetchLobbyPlayer(match.player2Id),
  ])
  if (!row1 || !row2) return

  const p1Won = match.winnerPlayerId === match.player1Id
  const p2Won = match.winnerPlayerId === match.player2Id

  const next1 = accumulateMatchStats(
    row1.scoutingStats ?? EMPTY_SCOUTING_STATS,
    p1MatchStats,
    p1Won,
  )
  const next2 = accumulateMatchStats(
    row2.scoutingStats ?? EMPTY_SCOUTING_STATS,
    p2MatchStats,
    p2Won,
  )

  await Promise.all([
    persistPlayerScoutingStats(match.player1Id, next1),
    persistPlayerScoutingStats(match.player2Id, next2),
  ])
}

/** Re-sync evolution from local run when entering a match (self only). */
export async function ensurePlayerEvolutionSynced(
  playerId: string,
  evolutionId: EvolutionId | null,
): Promise<void> {
  const row = await fetchLobbyPlayer(playerId)
  if (!row) return
  const parsed = parseEvolutionId(evolutionId)
  if (row.evolutionId === parsed) return
  await syncPlayerEvolution(playerId, parsed)
}
