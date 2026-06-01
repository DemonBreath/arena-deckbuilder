import { getSupabaseClient } from '../lib/supabaseClient'
import { grantByeGold } from './arenaService'
import { fetchLobby, fetchLobbyPlayers } from './lobbyService'
import {
  fetchMatchWithBattle,
  mapMatchWithBattle,
  tryInitializePvpBattle,
} from './pvpBattleService'
import type { LobbyPlayer } from '../types/lobby'
import {
  bothPlayersLoaded,
  type MatchPairingResult,
  type OnlineMatchSession,
  type PvpMatch,
} from '../types/match'

interface MatchRow {
  id: string
  lobby_id: string
  lobby_code: string
  player_1_id: string
  player_2_id: string | null
  player_1_loaded: boolean
  player_2_loaded: boolean
  status: string
  battle_state?: unknown
  state_version?: number
  winner_player_id?: string | null
  created_at: string
}

function mapMatch(row: MatchRow): PvpMatch {
  return mapMatchWithBattle(row as Parameters<typeof mapMatchWithBattle>[0])
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pairReadyPlayers(
  readyPlayers: LobbyPlayer[],
): { pairs: [LobbyPlayer, LobbyPlayer][]; bye: LobbyPlayer | null } {
  const shuffled = shuffle(readyPlayers)
  const pairs: [LobbyPlayer, LobbyPlayer][] = []
  let bye: LobbyPlayer | null = null

  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      pairs.push([shuffled[i], shuffled[i + 1]])
    } else {
      bye = shuffled[i]
    }
  }

  return { pairs, bye }
}

export async function createMatchPairingsFromLobby(
  lobbyId: string,
  lobbyCode: string,
): Promise<MatchPairingResult> {
  const supabase = getSupabaseClient()
  const players = await fetchLobbyPlayers(lobbyId)
  const readyPlayers = players.filter(
    (p) => p.readyState === 'ready' && !p.eliminated,
  )

  if (readyPlayers.length < 2) {
    throw new Error('At least 2 ready players are required to start a match.')
  }

  const { pairs, bye } = pairReadyPlayers(readyPlayers)

  await supabase.from('lobby_pairing_byes').delete().eq('lobby_id', lobbyId)

  const matchInserts = pairs.map(([p1, p2]) => ({
    lobby_id: lobbyId,
    lobby_code: lobbyCode,
    player_1_id: p1.id,
    player_2_id: p2.id,
    player_1_loaded: false,
    player_2_loaded: false,
    status: 'waiting',
    battle_state: null,
    state_version: 0,
  }))

  let matches: PvpMatch[] = []

  if (matchInserts.length > 0) {
    const { data, error } = await supabase
      .from('matches')
      .insert(matchInserts)
      .select()

    if (error) throw new Error(error.message)
    matches = (data as MatchRow[]).map(mapMatch)
  }

  const byePlayerIds: string[] = []

  if (bye) {
    byePlayerIds.push(bye.id)
    const { error: byeError } = await supabase.from('lobby_pairing_byes').insert({
      lobby_id: lobbyId,
      player_id: bye.id,
    })
    if (byeError) throw new Error(byeError.message)
    await grantByeGold(lobbyId, bye.id)
  }

  const matchedIds = new Set<string>()
  for (const match of matches) {
    matchedIds.add(match.player1Id)
    if (match.player2Id) matchedIds.add(match.player2Id)
  }

  for (const player of players) {
    if (matchedIds.has(player.id) || byePlayerIds.includes(player.id)) {
      await supabase
        .from('lobby_players')
        .update({ ready: false })
        .eq('id', player.id)
    }
  }

  const { error: lobbyError } = await supabase
    .from('lobbies')
    .update({ status: 'in_match' })
    .eq('id', lobbyId)

  if (lobbyError) throw new Error(lobbyError.message)

  return { matches, byePlayerIds }
}

export async function fetchLobbyActiveMatches(
  lobbyId: string,
): Promise<PvpMatch[]> {
  const all = await fetchLobbySpectatorMatches(lobbyId)
  return all.filter((m) => m.status === 'waiting' || m.status === 'active')
}

/** Recent matches for spectator feed + active list (includes completed for event diff). */
export async function fetchLobbySpectatorMatches(
  lobbyId: string,
): Promise<PvpMatch[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('lobby_id', lobbyId)
    .in('status', ['waiting', 'active', 'completed'])
    .order('created_at', { ascending: false })
    .limit(32)

  if (error) throw new Error(error.message)
  if (!data?.length) return []

  return (data as MatchRow[]).map(mapMatch)
}

export async function fetchActiveMatchForPlayer(
  lobbyId: string,
  playerId: string,
): Promise<PvpMatch | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('lobby_id', lobbyId)
    .or(`player_1_id.eq.${playerId},player_2_id.eq.${playerId}`)
    .in('status', ['waiting', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return mapMatch(data as MatchRow)
}

export async function fetchByeForPlayer(
  lobbyId: string,
  playerId: string,
): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('lobby_pairing_byes')
    .select('id')
    .eq('lobby_id', lobbyId)
    .eq('player_id', playerId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return Boolean(data)
}

export async function fetchMatch(matchId: string): Promise<PvpMatch | null> {
  return fetchMatchWithBattle(matchId)
}

export async function buildOnlineMatchSession(
  match: PvpMatch,
  session: {
    playerId: string
    sessionId: string
    championName: string
    lobbyId: string
  },
): Promise<OnlineMatchSession> {
  const players = await fetchLobbyPlayers(session.lobbyId)
  const opponentId =
    match.player1Id === session.playerId ? match.player2Id : match.player1Id
  const opponent = players.find((p) => p.id === opponentId)

  return {
    matchId: match.id,
    lobbyId: match.lobbyId,
    lobbyCode: match.lobbyCode,
    playerId: session.playerId,
    sessionId: session.sessionId,
    championName: session.championName,
    opponentPlayerId: opponentId,
    opponentChampionName: opponent?.championName ?? null,
  }
}

export async function markPlayerLoadedInMatch(
  matchId: string,
  playerId: string,
): Promise<PvpMatch> {
  const supabase = getSupabaseClient()
  const match = await fetchMatch(matchId)
  if (!match) throw new Error('Match not found.')

  const updates: Partial<MatchRow> = {}

  if (match.player1Id === playerId) {
    updates.player_1_loaded = true
  } else if (match.player2Id === playerId) {
    updates.player_2_loaded = true
  } else {
    throw new Error('You are not part of this match.')
  }

  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', matchId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to confirm presence.')
  }

  let updated = mapMatch(data as MatchRow)

  if (bothPlayersLoaded(updated) && updated.status === 'waiting') {
    const { data: activeData, error: activeError } = await supabase
      .from('matches')
      .update({ status: 'active' })
      .eq('id', matchId)
      .select()
      .single()

    if (activeError || !activeData) {
      throw new Error(activeError?.message ?? 'Failed to activate match.')
    }
    updated = mapMatch(activeData as MatchRow)
  }

  if (updated.status === 'active' && !updated.battleState) {
    const initialized = await tryInitializePvpBattle(matchId)
    if (initialized) updated = initialized
  }

  return updated
}

export function subscribeToMatch(
  matchId: string,
  onMatchChange: (match: PvpMatch | null) => void,
): () => void {
  const supabase = getSupabaseClient()

  const refresh = async () => {
    try {
      const match = await fetchMatch(matchId)
      onMatchChange(match)
    } catch {
      /* ignore transient errors */
    }
  }

  void refresh()

  const channel = supabase
    .channel(`match:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      },
      () => {
        void refresh()
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function subscribeToLobbyMatches(
  lobbyId: string,
  onChange: () => void,
): () => void {
  const supabase = getSupabaseClient()

  const channel = supabase
    .channel(`lobby-matches:${lobbyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `lobby_id=eq.${lobbyId}`,
      },
      () => onChange(),
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lobby_pairing_byes',
        filter: `lobby_id=eq.${lobbyId}`,
      },
      () => onChange(),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export async function resolvePlayerAssignment(
  lobbySession: {
    lobbyId: string
    lobbyCode: string
    playerId: string
    sessionId: string
    championName: string
  },
): Promise<
  | { type: 'match'; session: OnlineMatchSession }
  | { type: 'bye' }
  | { type: 'none' }
  | { type: 'spectator' }
  | { type: 'shop' }
  | { type: 'champion' }
> {
  const lobby = await fetchLobby(lobbySession.lobbyId)
  const players = await fetchLobbyPlayers(lobbySession.lobbyId)
  const me = players.find((p) => p.id === lobbySession.playerId)

  if (!me) return { type: 'none' }

  if (lobby?.status === 'finished') {
    if (lobby.championPlayerId === me.id) return { type: 'champion' }
    return { type: 'spectator' }
  }

  if (me.eliminated) return { type: 'spectator' }

  if (lobby?.status === 'shop' && !me.shopDone) {
    return { type: 'shop' }
  }

  const hasBye = await fetchByeForPlayer(
    lobbySession.lobbyId,
    lobbySession.playerId,
  )
  if (hasBye) return { type: 'bye' }

  const match = await fetchActiveMatchForPlayer(
    lobbySession.lobbyId,
    lobbySession.playerId,
  )
  if (!match || !match.player2Id) return { type: 'none' }

  const onlineSession = await buildOnlineMatchSession(match, lobbySession)
  return { type: 'match', session: onlineSession }
}

export async function clearByeForPlayer(
  lobbyId: string,
  playerId: string,
): Promise<void> {
  const supabase = getSupabaseClient()
  await supabase
    .from('lobby_pairing_byes')
    .delete()
    .eq('lobby_id', lobbyId)
    .eq('player_id', playerId)
}
