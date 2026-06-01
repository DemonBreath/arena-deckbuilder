import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient'
import { STARTER_DECK, type CardId } from '../game/cardDatabase'
import type { RelicId } from '../game/relicDatabase'
import {
  isLobbyFull,
  readyStateFromBoolean,
  type Lobby,
  type LobbyPlayer,
  type LobbyStatus,
  type OnlineLobbySession,
} from '../types/lobby'

export function isOnlineLobbyAvailable(): boolean {
  return isSupabaseConfigured()
}

interface LobbyRow {
  id: string
  code: string
  status: string
  round_number?: number
  champion_player_id?: string | null
  created_at: string
}

interface LobbyPlayerRow {
  id: string
  lobby_id: string
  session_id: string
  champion_name: string
  ready: boolean
  lives?: number
  eliminated?: boolean
  gold?: number
  opponents_defeated?: number
  shop_done?: boolean
  deck?: CardId[] | null
  relics?: RelicId[] | null
  joined_at: string
  last_seen_at?: string | null
}

function mapLobby(row: LobbyRow): Lobby {
  return {
    id: row.id,
    code: row.code,
    status: row.status as LobbyStatus,
    roundNumber: typeof row.round_number === 'number' ? row.round_number : 1,
    championPlayerId: row.champion_player_id ?? null,
    createdAt: row.created_at,
  }
}

function parseDeck(raw: unknown): CardId[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null
  return raw as CardId[]
}

function parseRelics(raw: unknown): RelicId[] {
  if (!Array.isArray(raw)) return []
  return raw as RelicId[]
}

function mapLobbyPlayer(row: LobbyPlayerRow): LobbyPlayer {
  return {
    id: row.id,
    lobbyId: row.lobby_id,
    sessionId: row.session_id,
    championName: row.champion_name,
    readyState: readyStateFromBoolean(row.ready),
    lives: typeof row.lives === 'number' ? row.lives : 3,
    eliminated: Boolean(row.eliminated),
    gold: typeof row.gold === 'number' ? row.gold : 0,
    opponentsDefeated:
      typeof row.opponents_defeated === 'number' ? row.opponents_defeated : 0,
    shopDone: Boolean(row.shop_done),
    deck: parseDeck(row.deck),
    relics: parseRelics(row.relics),
    joinedAt: row.joined_at,
    lastSeenAt: row.last_seen_at ?? null,
  }
}

export function normalizeLobbyCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
}

export function isValidLobbyCode(code: string): boolean {
  const normalized = normalizeLobbyCode(code)
  return normalized.length >= 4 && normalized.length <= 8
}

export async function createOrJoinLobby(
  code: string,
  championName: string,
  sessionId: string,
): Promise<{ lobby: Lobby; player: LobbyPlayer; session: OnlineLobbySession }> {
  const supabase = getSupabaseClient()
  const normalizedCode = normalizeLobbyCode(code)
  const trimmedName = championName.trim()

  if (!isValidLobbyCode(normalizedCode)) {
    throw new Error('Lobby code must be 4–8 letters or numbers.')
  }
  if (!trimmedName) {
    throw new Error('Champion name is required.')
  }

  let lobbyRow: LobbyRow | null = null

  const { data: existingLobby, error: findError } = await supabase
    .from('lobbies')
    .select('*')
    .eq('code', normalizedCode)
    .maybeSingle()

  if (findError) {
    throw new Error(findError.message)
  }

  if (existingLobby) {
    lobbyRow = existingLobby as LobbyRow
  } else {
    const { data: created, error: createError } = await supabase
      .from('lobbies')
      .insert({ code: normalizedCode, status: 'waiting' })
      .select()
      .single()

    if (createError) {
      const { data: raced, error: raceError } = await supabase
        .from('lobbies')
        .select('*')
        .eq('code', normalizedCode)
        .single()

      if (raceError || !raced) {
        throw new Error(createError.message)
      }
      lobbyRow = raced as LobbyRow
    } else {
      lobbyRow = created as LobbyRow
    }
  }

  const lobby = mapLobby(lobbyRow)

  const { data: existingPlayer, error: playerFindError } = await supabase
    .from('lobby_players')
    .select('*')
    .eq('lobby_id', lobby.id)
    .eq('session_id', sessionId)
    .maybeSingle()

  if (playerFindError) {
    throw new Error(playerFindError.message)
  }

  let playerRow: LobbyPlayerRow

  if (existingPlayer) {
    const { data: updated, error: updateError } = await supabase
      .from('lobby_players')
      .update({ champion_name: trimmedName })
      .eq('id', existingPlayer.id)
      .select()
      .single()

    if (updateError || !updated) {
      throw new Error(updateError?.message ?? 'Failed to update player.')
    }
    playerRow = updated as LobbyPlayerRow
  } else {
    const currentPlayers = await fetchLobbyPlayers(lobby.id)
    if (isLobbyFull(currentPlayers)) {
      throw new Error('Lobby Full.')
    }

    const { data: inserted, error: insertError } = await supabase
      .from('lobby_players')
      .insert({
        lobby_id: lobby.id,
        session_id: sessionId,
        champion_name: trimmedName,
        ready: false,
        deck: [...STARTER_DECK],
        relics: [],
      })
      .select()
      .single()

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? 'Failed to join lobby.')
    }
    playerRow = inserted as LobbyPlayerRow
  }

  const player = mapLobbyPlayer(playerRow)

  return {
    lobby,
    player,
    session: {
      lobbyId: lobby.id,
      lobbyCode: lobby.code,
      playerId: player.id,
      sessionId,
      championName: trimmedName,
    },
  }
}

export async function fetchLobbyByCode(code: string): Promise<Lobby | null> {
  const supabase = getSupabaseClient()
  const normalizedCode = normalizeLobbyCode(code)
  if (!isValidLobbyCode(normalizedCode)) return null

  const { data, error } = await supabase
    .from('lobbies')
    .select('*')
    .eq('code', normalizedCode)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return mapLobby(data as LobbyRow)
}

export async function fetchLobby(lobbyId: string): Promise<Lobby | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('lobbies')
    .select('*')
    .eq('id', lobbyId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return mapLobby(data as LobbyRow)
}

export async function fetchLobbyPlayers(
  lobbyId: string,
): Promise<LobbyPlayer[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('lobby_players')
    .select('*')
    .eq('lobby_id', lobbyId)
    .order('joined_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data as LobbyPlayerRow[]).map(mapLobbyPlayer)
}

export async function fetchLobbyPlayer(
  playerId: string,
): Promise<LobbyPlayer | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('lobby_players')
    .select('*')
    .eq('id', playerId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return mapLobbyPlayer(data as LobbyPlayerRow)
}

export async function setPlayerReady(
  playerId: string,
  ready: boolean,
): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('lobby_players')
    .update({ ready })
    .eq('id', playerId)

  if (error) throw new Error(error.message)
}

export function subscribeToLobbyPlayers(
  lobbyId: string,
  onPlayersChange: (players: LobbyPlayer[]) => void,
): () => void {
  const supabase = getSupabaseClient()

  const refresh = async () => {
    try {
      const players = await fetchLobbyPlayers(lobbyId)
      onPlayersChange(players)
    } catch {
      /* ignore transient fetch errors during realtime refresh */
    }
  }

  void refresh()

  const channel = supabase
    .channel(`lobby-players:${lobbyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lobby_players',
        filter: `lobby_id=eq.${lobbyId}`,
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

export function subscribeToLobby(
  lobbyId: string,
  onLobbyChange: (lobby: Lobby | null) => void,
): () => void {
  const supabase = getSupabaseClient()

  const refresh = async () => {
    try {
      const lobby = await fetchLobby(lobbyId)
      onLobbyChange(lobby)
    } catch {
      /* ignore transient fetch errors */
    }
  }

  void refresh()

  const channel = supabase
    .channel(`lobby:${lobbyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lobbies',
        filter: `id=eq.${lobbyId}`,
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

export async function touchPlayerPresence(playerId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('lobby_players')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', playerId)

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('last_seen_at') || msg.includes('column')) {
      return
    }
    throw new Error(error.message)
  }
}

export async function leaveLobby(playerId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('lobby_players')
    .delete()
    .eq('id', playerId)

  if (error) throw new Error(error.message)
}

const DISCONNECTED_LAST_SEEN = '1970-01-01T00:00:00.000Z'

/**
 * Before the run starts: remove player from lobby.
 * After the run has started: keep roster row but mark disconnected (no delete).
 */
export async function leaveLobbySmart(
  playerId: string,
  lobbyId: string,
): Promise<'removed' | 'disconnected'> {
  const supabase = getSupabaseClient()
  const lobby = await fetchLobby(lobbyId)

  if (lobby?.status === 'waiting') {
    await leaveLobby(playerId)
    return 'removed'
  }

  const { error } = await supabase
    .from('lobby_players')
    .update({
      ready: false,
      last_seen_at: DISCONNECTED_LAST_SEEN,
    })
    .eq('id', playerId)

  if (error) throw new Error(error.message)
  return 'disconnected'
}
