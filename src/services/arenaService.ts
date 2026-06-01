import { getSupabaseClient } from '../lib/supabaseClient'
import { PVP_BYE_GOLD } from '../game/arenaConstants'
import { fetchLobby, fetchLobbyPlayers } from './lobbyService'
import type { Lobby, LobbyPlayer } from '../types/lobby'
import type { PvpMatch } from '../types/match'

export function getActivePlayers(players: LobbyPlayer[]): LobbyPlayer[] {
  return players.filter((p) => !p.eliminated)
}

export function countActivePlayers(players: LobbyPlayer[]): number {
  return getActivePlayers(players).length
}

export function findLobbyChampion(
  players: LobbyPlayer[],
): LobbyPlayer | null {
  const active = getActivePlayers(players)
  if (active.length === 1) return active[0]
  return null
}

export async function applyMatchArenaProgression(
  match: PvpMatch,
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!match.player2Id || !match.winnerPlayerId) return

  const loserId =
    match.winnerPlayerId === match.player1Id
      ? match.player2Id
      : match.player1Id

  const players = await fetchLobbyPlayers(match.lobbyId)
  const winner = players.find((p) => p.id === match.winnerPlayerId)
  const loser = players.find((p) => p.id === loserId)
  if (!winner || !loser) return

  const loserLives = Math.max(0, loser.lives - 1)
  const loserEliminated = loserLives <= 0

  await supabase
    .from('lobby_players')
    .update({
      opponents_defeated: winner.opponentsDefeated + 1,
      ready: false,
      shop_done: false,
    })
    .eq('id', winner.id)

  await supabase
    .from('lobby_players')
    .update({
      lives: loserLives,
      eliminated: loserEliminated,
      ready: false,
      shop_done: false,
    })
    .eq('id', loser.id)

  const updatedPlayers = await fetchLobbyPlayers(match.lobbyId)
  const champion = findLobbyChampion(updatedPlayers)

  if (champion) {
    await supabase
      .from('lobbies')
      .update({
        status: 'finished',
        champion_player_id: champion.id,
      })
      .eq('id', match.lobbyId)
    return
  }

  const lobby = await fetchLobby(match.lobbyId)
  const nextRound = (lobby?.roundNumber ?? 1) + 1

  await clearLobbyByes(match.lobbyId)

  await supabase
    .from('lobbies')
    .update({ status: 'shop', round_number: nextRound })
    .eq('id', match.lobbyId)
}

export async function grantByeGold(
  lobbyId: string,
  playerId: string,
): Promise<void> {
  const supabase = getSupabaseClient()
  const players = await fetchLobbyPlayers(lobbyId)
  const player = players.find((p) => p.id === playerId)
  if (!player) return

  await supabase
    .from('lobby_players')
    .update({ gold: player.gold + PVP_BYE_GOLD })
    .eq('id', playerId)
}

export async function clearLobbyByes(lobbyId: string): Promise<void> {
  const supabase = getSupabaseClient()
  await supabase.from('lobby_pairing_byes').delete().eq('lobby_id', lobbyId)
}

export async function syncPlayerDeckToServer(
  playerId: string,
  deck: string[],
  relics: string[],
): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('lobby_players')
    .update({ deck, relics })
    .eq('id', playerId)

  if (error) throw new Error(error.message)
}

export async function markPlayerShopDone(playerId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('lobby_players')
    .update({ shop_done: true, ready: false })
    .eq('id', playerId)

  if (error) throw new Error(error.message)
}

export async function tryAdvanceLobbyFromShop(lobbyId: string): Promise<Lobby | null> {
  const supabase = getSupabaseClient()
  const players = await fetchLobbyPlayers(lobbyId)
  const active = getActivePlayers(players)

  if (active.length === 0) return fetchLobby(lobbyId)

  const allDone = active.every((p) => p.shopDone)
  if (!allDone) return fetchLobby(lobbyId)

  await supabase
    .from('lobby_players')
    .update({ shop_done: false })
    .eq('lobby_id', lobbyId)

  const { error } = await supabase
    .from('lobbies')
    .update({ status: 'waiting' })
    .eq('id', lobbyId)

  if (error) throw new Error(error.message)
  return fetchLobby(lobbyId)
}

export async function updatePlayerGold(
  playerId: string,
  gold: number,
): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('lobby_players')
    .update({ gold })
    .eq('id', playerId)

  if (error) throw new Error(error.message)
}
