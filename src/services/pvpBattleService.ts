import {
  applyPvpBattleAction,
  createInitialPvpBattleState,
  getWinnerPlayerId,
  normalizePvpBattleState,
  type PvpBattleAction,
  type PvpBattleState,
} from '../game/pvpBattleState'
import { getSupabaseClient } from '../lib/supabaseClient'
import { STARTER_DECK } from '../game/cardDatabase'
import { fetchLobbyPlayers } from './lobbyService'
import { applyMatchArenaProgression } from './arenaService'
import type { PvpMatch } from '../types/match'

export interface MatchBattleRow {
  id: string
  lobby_id: string
  lobby_code: string
  player_1_id: string
  player_2_id: string | null
  player_1_loaded: boolean
  player_2_loaded: boolean
  status: string
  battle_state: PvpBattleState | null
  state_version: number
  winner_player_id: string | null
  created_at: string
  turn_start_at?: string | null
  battle_started_at?: string | null
}

function parseBattleState(raw: unknown): PvpBattleState | null {
  if (!raw || typeof raw !== 'object') return null
  return normalizePvpBattleState(raw as PvpBattleState)
}

export function mapMatchWithBattle(row: MatchBattleRow): PvpMatch {
  return {
    id: row.id,
    lobbyId: row.lobby_id,
    lobbyCode: row.lobby_code,
    player1Id: row.player_1_id,
    player2Id: row.player_2_id,
    player1Loaded: row.player_1_loaded,
    player2Loaded: row.player_2_loaded,
    status: row.status as PvpMatch['status'],
    battleState: parseBattleState(row.battle_state),
    stateVersion: row.state_version ?? 0,
    winnerPlayerId: row.winner_player_id,
    createdAt: row.created_at,
    turnStartAt: row.turn_start_at ?? null,
    battleStartedAt: row.battle_started_at ?? null,
  }
}

export async function fetchMatchWithBattle(
  matchId: string,
): Promise<PvpMatch | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return mapMatchWithBattle(data as MatchBattleRow)
}

export interface PersistMatchOptions {
  expectedVersion: number
  status?: PvpMatch['status']
  winnerPlayerId?: string | null
  turnStartAt?: string | null
  battleStartedAt?: string | null
}

export async function persistMatchBattleState(
  matchId: string,
  nextState: PvpBattleState,
  options: PersistMatchOptions,
): Promise<PvpMatch> {
  const supabase = getSupabaseClient()

  const updates: Record<string, unknown> = {
    battle_state: nextState,
    state_version: nextState.version,
    status: options.status ?? 'active',
  }

  if (options.winnerPlayerId !== undefined) {
    updates.winner_player_id = options.winnerPlayerId
  }
  if (options.turnStartAt !== undefined) {
    updates.turn_start_at = options.turnStartAt
  }
  if (options.battleStartedAt !== undefined) {
    updates.battle_started_at = options.battleStartedAt
  }

  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', matchId)
    .eq('state_version', options.expectedVersion)
    .select()
    .single()

  if (error || !data) {
    const latest = await fetchMatchWithBattle(matchId)
    if (latest?.battleState?.version !== options.expectedVersion) {
      throw new Error('Another player updated the match — state refreshed.')
    }
    throw new Error(error?.message ?? 'Failed to update match.')
  }

  return mapMatchWithBattle(data as MatchBattleRow)
}

function resolveTurnStartAt(
  prev: PvpBattleState,
  next: PvpBattleState,
  currentTurnStartAt: string | null,
): string | null {
  if (next.phase !== 'active') return currentTurnStartAt
  if (prev.activeSlot !== next.activeSlot) {
    return new Date().toISOString()
  }
  if (!currentTurnStartAt) {
    return new Date().toISOString()
  }
  return currentTurnStartAt
}

export async function tryInitializePvpBattle(
  matchId: string,
): Promise<PvpMatch | null> {
  const supabase = getSupabaseClient()
  const match = await fetchMatchWithBattle(matchId)
  if (!match || !match.player2Id || match.battleState) return match

  if (match.status !== 'active') return match

  const players = await fetchLobbyPlayers(match.lobbyId)
  const p1 = players.find((p) => p.id === match.player1Id)
  const p2 = players.find((p) => p.id === match.player2Id)
  if (!p1 || !p2) return match

  const deck1 = p1.deck && p1.deck.length > 0 ? p1.deck : [...STARTER_DECK]
  const deck2 = p2.deck && p2.deck.length > 0 ? p2.deck : [...STARTER_DECK]

  const initial = createInitialPvpBattleState(
    { id: p1.id, championName: p1.championName, deck: deck1 },
    { id: p2.id, championName: p2.championName, deck: deck2 },
  )

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('matches')
    .update({
      battle_state: initial,
      state_version: initial.version,
      battle_started_at: now,
      turn_start_at: now,
    })
    .eq('id', matchId)
    .is('battle_state', null)
    .select()
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (data) return mapMatchWithBattle(data as MatchBattleRow)
  return fetchMatchWithBattle(matchId)
}

export async function submitPvpBattleAction(
  matchId: string,
  playerId: string,
  action: PvpBattleAction,
  expectedVersion: number,
): Promise<PvpMatch> {
  const match = await fetchMatchWithBattle(matchId)
  if (!match?.battleState) {
    throw new Error('Battle has not started yet.')
  }
  if (match.status === 'completed') {
    throw new Error('Match is already completed.')
  }
  if (match.battleState.version !== expectedVersion) {
    throw new Error(
      `State version mismatch (expected ${expectedVersion}, got ${match.battleState.version}). Refresh and try again.`,
    )
  }

  const prevState = match.battleState
  const nextState = applyPvpBattleAction(prevState, playerId, action)
  if (nextState.version === prevState.version) {
    const hint =
      action.type === 'EMOTE'
        ? 'Could not send emote.'
        : 'Invalid action — not your turn or card cannot be played.'
    throw new Error(hint)
  }

  const completed = nextState.phase === 'completed'
  const winnerId = completed ? getWinnerPlayerId(nextState) : null
  const nextTurnStart = resolveTurnStartAt(
    prevState,
    nextState,
    match.turnStartAt,
  )

  const updated = await persistMatchBattleState(matchId, nextState, {
    expectedVersion,
    status: completed ? 'completed' : 'active',
    winnerPlayerId: completed ? winnerId : undefined,
    turnStartAt: nextTurnStart,
  })

  if (updated.status === 'completed' && updated.winnerPlayerId) {
    await applyMatchArenaProgression(updated)
  }

  return updated
}
