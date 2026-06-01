import { useEffect, useMemo, useState } from 'react'
import {
  formatFinalDuelSeriesScore,
  getArenaPhaseConfigForPlayerCount,
  resolveArenaPhase,
} from '../game/arenaPhase'
import type { ArenaPhase } from '../game/arenaPhase'
import type { ArenaDraftId } from '../game/arenaDrafts'
import { countActivePlayers } from '../services/arenaService'
import {
  fetchLobby,
  fetchLobbyPlayers,
  subscribeToLobbyPlayers,
} from '../services/lobbyService'
import { isFinalDuelLobby, type Lobby, type LobbyPlayer } from '../types/lobby'

/** Lobby or match session — both include lobbyId, playerId, championName, lobbyCode */
export type OnlineRunSession = {
  lobbyId: string
  lobbyCode: string
  playerId: string
  championName: string
}

export interface OnlineRunStatus {
  championName: string
  lobbyCode: string
  lives: number
  gold: number
  opponentsDefeated: number
  activePlayersRemaining: number
  eliminated: boolean
  arenaPhase: ArenaPhase
  arenaPhaseLabel: string
  suddenDeathWarning: string | null
  finalDuelSeriesLabel: string | null
  activeDraftIds: ArenaDraftId[]
}

export function useOnlineRunStatus(
  session: OnlineRunSession | null,
): OnlineRunStatus | null {
  const [players, setPlayers] = useState<LobbyPlayer[]>([])
  const [lobby, setLobby] = useState<Lobby | null>(null)

  useEffect(() => {
    if (!session) {
      setPlayers([])
      setLobby(null)
      return
    }

    const load = async () => {
      try {
        const [data, lobbyRow] = await Promise.all([
          fetchLobbyPlayers(session.lobbyId),
          fetchLobby(session.lobbyId),
        ])
        setPlayers(data)
        setLobby(lobbyRow)
      } catch {
        setPlayers([])
        setLobby(null)
      }
    }

    void load()
    const unsubPlayers = subscribeToLobbyPlayers(session.lobbyId, setPlayers)

    const refreshLobby = () => {
      void fetchLobby(session.lobbyId).then(setLobby)
    }
    refreshLobby()
    const lobbyInterval = window.setInterval(refreshLobby, 4000)

    return () => {
      unsubPlayers()
      window.clearInterval(lobbyInterval)
    }
  }, [session])

  return useMemo(() => {
    if (!session) return null

    const me = players.find((p) => p.id === session.playerId)
    const activeCount = countActivePlayers(players)
    const phase = resolveArenaPhase(activeCount)
    const phaseConfig = getArenaPhaseConfigForPlayerCount(activeCount)

    let finalDuelSeriesLabel: string | null = null
    if (lobby && isFinalDuelLobby(lobby)) {
      finalDuelSeriesLabel = formatFinalDuelSeriesScore(
        session.playerId,
        lobby.finalDuelPlayer1Id!,
        lobby.finalDuelPlayer2Id!,
        lobby.finalDuelP1Wins,
        lobby.finalDuelP2Wins,
      )
    }

    return {
      championName: session.championName,
      lobbyCode: session.lobbyCode,
      lives: me?.lives ?? 3,
      gold: me?.gold ?? 0,
      opponentsDefeated: me?.opponentsDefeated ?? 0,
      activePlayersRemaining: activeCount,
      eliminated: Boolean(me?.eliminated),
      arenaPhase: phase,
      arenaPhaseLabel: phaseConfig.label,
      suddenDeathWarning: phaseConfig.warningMessage,
      finalDuelSeriesLabel,
      activeDraftIds: lobby?.activeDraftIds ?? [],
    }
  }, [session, players, lobby])
}
