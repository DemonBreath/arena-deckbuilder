import { getSupabaseClient } from '../lib/supabaseClient'
import {
  isFinalDuelSeriesComplete,
  resolveArenaPhase,
} from '../game/arenaPhase'
import { PVP_BYE_GOLD } from '../game/arenaConstants'
import { advanceLobbyAfterRound } from './arenaDraftService'
import { fetchLobby, fetchLobbyPlayers } from './lobbyService'
import type { Lobby, LobbyPlayer } from '../types/lobby'
import { isFinalDuelLobby } from '../types/lobby'
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

/** Lock in the two finalists when the lobby reaches 2 active players. */
export async function ensureFinalDuelLobby(
  lobbyId: string,
  players: LobbyPlayer[],
): Promise<Lobby | null> {
  const supabase = getSupabaseClient()
  const active = getActivePlayers(players)
  if (active.length !== 2) return fetchLobby(lobbyId)

  const lobby = await fetchLobby(lobbyId)
  if (!lobby) return null
  if (isFinalDuelLobby(lobby)) return lobby

  const { error } = await supabase
    .from('lobbies')
    .update({
      final_duel_player_1_id: active[0].id,
      final_duel_player_2_id: active[1].id,
      final_duel_p1_wins: 0,
      final_duel_p2_wins: 0,
    })
    .eq('id', lobbyId)

  if (error) throw new Error(error.message)
  return fetchLobby(lobbyId)
}

async function crownChampion(
  lobbyId: string,
  championId: string,
): Promise<void> {
  const supabase = getSupabaseClient()
  await supabase
    .from('lobbies')
    .update({
      status: 'finished',
      champion_player_id: championId,
    })
    .eq('id', lobbyId)
}

async function applyFinalDuelMatchResult(
  match: PvpMatch,
  lobby: Lobby,
  winner: LobbyPlayer,
  loser: LobbyPlayer,
): Promise<void> {
  const supabase = getSupabaseClient()

  const winnerIsP1 = winner.id === lobby.finalDuelPlayer1Id
  const p1Wins = lobby.finalDuelP1Wins + (winnerIsP1 ? 1 : 0)
  const p2Wins = lobby.finalDuelP2Wins + (winnerIsP1 ? 0 : 1)

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
    .update({ ready: false, shop_done: false })
    .eq('id', loser.id)

  if (isFinalDuelSeriesComplete(p1Wins, p2Wins)) {
    await supabase
      .from('lobbies')
      .update({
        final_duel_p1_wins: p1Wins,
        final_duel_p2_wins: p2Wins,
      })
      .eq('id', match.lobbyId)

    await crownChampion(match.lobbyId, winner.id)
    return
  }

  await clearLobbyByes(match.lobbyId)

  await supabase
    .from('lobbies')
    .update({
      status: 'waiting',
      final_duel_p1_wins: p1Wins,
      final_duel_p2_wins: p2Wins,
    })
    .eq('id', match.lobbyId)
}

async function applyStandardMatchResult(
  winner: LobbyPlayer,
  loser: LobbyPlayer,
): Promise<void> {
  const supabase = getSupabaseClient()

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
}

export async function applyMatchArenaProgression(
  match: PvpMatch,
): Promise<void> {
  if (!match.player2Id || !match.winnerPlayerId) return

  const loserId =
    match.winnerPlayerId === match.player1Id
      ? match.player2Id
      : match.player1Id

  const players = await fetchLobbyPlayers(match.lobbyId)
  const winner = players.find((p) => p.id === match.winnerPlayerId)
  const loser = players.find((p) => p.id === loserId)
  if (!winner || !loser) return

  let lobby = await fetchLobby(match.lobbyId)
  if (!lobby) return

  const activeBefore = countActivePlayers(players)
  if (activeBefore === 2 && !isFinalDuelLobby(lobby)) {
    lobby = (await ensureFinalDuelLobby(match.lobbyId, players)) ?? lobby
  }

  if (isFinalDuelLobby(lobby)) {
    await applyFinalDuelMatchResult(match, lobby, winner, loser)
    return
  }

  await applyStandardMatchResult(winner, loser)

  const updatedPlayers = await fetchLobbyPlayers(match.lobbyId)
  const activeAfter = countActivePlayers(updatedPlayers)

  if (activeAfter === 2) {
    await ensureFinalDuelLobby(match.lobbyId, updatedPlayers)
  }

  const champion = findLobbyChampion(updatedPlayers)
  if (champion) {
    await crownChampion(match.lobbyId, champion.id)
    return
  }

  const currentLobby = await fetchLobby(match.lobbyId)
  const nextRound = (currentLobby?.roundNumber ?? 1) + 1

  await clearLobbyByes(match.lobbyId)

  const skipDraft = Boolean(
    currentLobby && isFinalDuelLobby(currentLobby),
  )
  await advanceLobbyAfterRound(match.lobbyId, nextRound, skipDraft)
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
  const lobby = await fetchLobby(lobbyId)
  const active = getActivePlayers(players)

  if (active.length === 0) return fetchLobby(lobbyId)

  if (lobby && isFinalDuelLobby(lobby)) {
    const allDone = active.every((p) => p.shopDone)
    if (!allDone) return lobby

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

/** Arena phase for the lobby based on current active player count. */
export function getLobbyArenaPhase(players: LobbyPlayer[]): ReturnType<
  typeof resolveArenaPhase
> {
  return resolveArenaPhase(countActivePlayers(players))
}
