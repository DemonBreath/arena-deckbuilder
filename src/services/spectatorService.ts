import { PVP_MAX_HP, normalizePvpBattleState } from '../game/pvpBattleState'
import type { LobbyPlayer } from '../types/lobby'
import type { PvpMatch } from '../types/match'
import type { SpectatorMatchSummary } from '../types/spectator'

export function buildPlayerNameMap(
  players: LobbyPlayer[],
): Map<string, string> {
  return new Map(players.map((p) => [p.id, p.championName]))
}

export function buildSpectatorMatchSummary(
  match: PvpMatch,
  nameById: Map<string, string>,
): SpectatorMatchSummary | null {
  if (!match.player2Id) return null

  const player1Name =
    nameById.get(match.player1Id) ?? 'Player 1'
  const player2Name =
    nameById.get(match.player2Id) ?? 'Player 2'

  let player1Hp = PVP_MAX_HP
  let player2Hp = PVP_MAX_HP
  let turnLabel = 'Connecting…'

  if (match.battleState) {
    const state = normalizePvpBattleState(match.battleState)
    player1Hp = Math.max(0, state.player1.hp)
    player2Hp = Math.max(0, state.player2.hp)

    if (state.phase === 'completed' && state.winnerSlot) {
      const winner =
        state.winnerSlot === 1
          ? state.player1.championName
          : state.player2.championName
      turnLabel = `${winner} won`
    } else if (state.phase === 'active') {
      const active =
        state.activeSlot === 1 ? state.player1 : state.player2
      turnLabel = `${active.championName}'s turn`
    } else {
      turnLabel = 'Starting…'
    }
  } else if (match.status === 'waiting') {
    turnLabel = 'Waiting for players'
  }

  return {
    matchId: match.id,
    player1Name,
    player2Name,
    player1Hp,
    player2Hp,
    turnLabel,
    status: match.status,
  }
}

export function buildSpectatorMatchSummaries(
  matches: PvpMatch[],
  players: LobbyPlayer[],
): SpectatorMatchSummary[] {
  const nameById = buildPlayerNameMap(players)
  return matches
    .map((m) => buildSpectatorMatchSummary(m, nameById))
    .filter((s): s is SpectatorMatchSummary => s !== null)
}
