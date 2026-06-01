import {
  applyTurnTimeoutEnd,
  completeMatchWithReason,
  getWinnerPlayerId,
  normalizePvpBattleState,
  resolveTimeoutWinnerSlot,
  type PlayerSlot,
} from '../game/pvpBattleState'
import {
  isMatchPlayerDisconnected,
  isMatchTimedOut,
  isTurnExpired,
  MATCH_DISCONNECT_FORFEIT_MS,
} from '../game/pvpTimers'
import { fetchLobbyPlayers } from './lobbyService'
import {
  fetchMatchWithBattle,
  persistMatchBattleState,
} from './pvpBattleService'
import { applyMatchArenaProgression } from './arenaService'
import type { LobbyPlayer } from '../types/lobby'
import type { PvpMatch } from '../types/match'

function checkDisconnectForfeitWinner(
  player1: LobbyPlayer | undefined,
  player2: LobbyPlayer | undefined,
  nowMs: number,
): PlayerSlot | null {
  if (!player1 || !player2) return null

  const p1Out = isMatchPlayerDisconnected(player1.lastSeenAt, nowMs)
  const p2Out = isMatchPlayerDisconnected(player2.lastSeenAt, nowMs)

  if (p1Out && !p2Out) return 2
  if (p2Out && !p1Out) return 1
  return null
}

async function forceCompleteMatch(
  match: PvpMatch,
  winnerSlot: PlayerSlot,
  logLine: string,
  message: string,
): Promise<PvpMatch> {
  if (!match.battleState) return match

  const nextState = completeMatchWithReason(
    match.battleState,
    winnerSlot,
    logLine,
    message,
  )
  const winnerId = getWinnerPlayerId(nextState)

  const updated = await persistMatchBattleState(match.id, nextState, {
    expectedVersion: match.battleState.version,
    status: 'completed',
    winnerPlayerId: winnerId,
  })

  if (updated.status === 'completed' && updated.winnerPlayerId) {
    await applyMatchArenaProgression(updated)
  }

  return updated
}

/**
 * Server-authoritative timer checks (turn, match timeout, disconnect forfeit).
 * Safe to call from any connected client on an interval.
 */
export async function processMatchTimers(
  matchId: string,
): Promise<PvpMatch | null> {
  let match = await fetchMatchWithBattle(matchId)
  if (!match?.battleState || match.status === 'completed') return match

  const state = normalizePvpBattleState(match.battleState)
  if (state.phase === 'completed') return match

  const nowMs = Date.now()
  const players = await fetchLobbyPlayers(match.lobbyId)
  const player1 = players.find((p) => p.id === match!.player1Id)
  const player2 = players.find((p) => p.id === match!.player2Id)

  const forfeitSlot = checkDisconnectForfeitWinner(player1, player2, nowMs)
  if (forfeitSlot) {
    const winner = forfeitSlot === 1 ? state.player1 : state.player2
    const loser = forfeitSlot === 1 ? state.player2 : state.player1
    return forceCompleteMatch(
      match,
      forfeitSlot,
      `${winner.championName} wins — ${loser.championName} disconnected (${Math.round(MATCH_DISCONNECT_FORFEIT_MS / 1000)}s).`,
      `${loser.championName} disconnected — ${winner.championName} wins.`,
    )
  }

  if (isMatchTimedOut(match.battleStartedAt, nowMs)) {
    const winnerSlot = resolveTimeoutWinnerSlot(
      state,
      player1?.lives ?? 0,
      player2?.lives ?? 0,
    )
    const winner = winnerSlot === 1 ? state.player1 : state.player2
    return forceCompleteMatch(
      match,
      winnerSlot,
      `Match time limit (20 min) — ${winner.championName} wins on tiebreak.`,
      `Match timed out — ${winner.championName} wins.`,
    )
  }

  if (isTurnExpired(match.turnStartAt, nowMs)) {
    const nextState = applyTurnTimeoutEnd(state)
    if (!nextState || nextState.version === state.version) return match

    const nextTurnStart =
      nextState.activeSlot !== state.activeSlot
        ? new Date().toISOString()
        : match.turnStartAt

    match = await persistMatchBattleState(match.id, nextState, {
      expectedVersion: state.version,
      turnStartAt: nextTurnStart,
    })

    if (match.status === 'completed' && match.winnerPlayerId) {
      await applyMatchArenaProgression(match)
    }
  }

  return match
}
