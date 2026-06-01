import { useEffect, useMemo, useState } from 'react'
import { countActivePlayers } from '../services/arenaService'
import {
  fetchLobbyPlayers,
  subscribeToLobbyPlayers,
} from '../services/lobbyService'
import type { LobbyPlayer } from '../types/lobby'

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
}

export function useOnlineRunStatus(
  session: OnlineRunSession | null,
): OnlineRunStatus | null {
  const [players, setPlayers] = useState<LobbyPlayer[]>([])

  useEffect(() => {
    if (!session) {
      setPlayers([])
      return
    }

    const load = async () => {
      try {
        const data = await fetchLobbyPlayers(session.lobbyId)
        setPlayers(data)
      } catch {
        setPlayers([])
      }
    }

    void load()
    return subscribeToLobbyPlayers(session.lobbyId, setPlayers)
  }, [session])

  return useMemo(() => {
    if (!session) return null

    const me = players.find((p) => p.id === session.playerId)

    return {
      championName: session.championName,
      lobbyCode: session.lobbyCode,
      lives: me?.lives ?? 3,
      gold: me?.gold ?? 0,
      opponentsDefeated: me?.opponentsDefeated ?? 0,
      activePlayersRemaining: countActivePlayers(players),
      eliminated: Boolean(me?.eliminated),
    }
  }, [session, players])
}
