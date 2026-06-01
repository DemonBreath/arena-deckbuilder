import { isSupabaseConfigured } from '../lib/supabaseClient'
import {
  loadOnlineRun,
  saveOnlineRun,
  type OnlineRunState,
} from './onlineRunService'
import {
  createOrJoinLobby,
  fetchLobby,
  fetchLobbyPlayer,
  isValidLobbyCode,
} from './lobbyService'
import {
  buildOnlineMatchSession,
  fetchMatch,
  resolvePlayerAssignment,
} from './matchService'
import type { PersistedOnlineSession } from './persistedSessionService'
import type { LobbyPlayer, OnlineLobbySession } from '../types/lobby'
import type { OnlineMatchSession } from '../types/match'
import { isPlayerInMatch } from '../types/match'

export type PlayerAssignment = Awaited<
  ReturnType<typeof resolvePlayerAssignment>
>

export type RejoinResult =
  | {
      success: true
      session: OnlineLobbySession
      player: LobbyPlayer
      assignment: PlayerAssignment
      matchSession: OnlineMatchSession | null
    }
  | { success: false; error: string }

function syncLocalDeckFromServer(
  player: LobbyPlayer,
  lobbyId: string,
  sessionId: string,
): void {
  const local = loadOnlineRun(lobbyId, sessionId)
  const next: OnlineRunState = {
    ...local,
    relics: player.relics.length > 0 ? player.relics : local.relics,
  }
  if (player.deck && player.deck.length > 0) {
    next.deck = player.deck
  }
  saveOnlineRun(lobbyId, sessionId, next)
}

async function tryRestoreActiveMatch(
  persisted: PersistedOnlineSession,
  lobbySession: OnlineLobbySession,
): Promise<OnlineMatchSession | null> {
  if (!persisted.matchId) return null

  const match = await fetchMatch(persisted.matchId)
  if (!match || !match.player2Id) return null
  if (match.status !== 'waiting' && match.status !== 'active') return null
  if (!isPlayerInMatch(match, lobbySession.playerId)) return null

  return buildOnlineMatchSession(match, lobbySession)
}

export async function rejoinFromPersisted(
  persisted: PersistedOnlineSession,
): Promise<RejoinResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Online lobby unavailable — Supabase is not configured.',
    }
  }

  if (!isValidLobbyCode(persisted.lobbyCode)) {
    return { success: false, error: 'Saved lobby code is invalid.' }
  }

  const existingLobby = await fetchLobby(persisted.lobbyId)
  if (!existingLobby) {
    return {
      success: false,
      error: 'Lobby no longer exists. Start fresh or join a new code.',
    }
  }

  try {
    const { session, player } = await createOrJoinLobby(
      persisted.lobbyCode,
      persisted.championName,
      persisted.sessionId,
    )

    syncLocalDeckFromServer(player, session.lobbyId, session.sessionId)

    const matchSession = await tryRestoreActiveMatch(persisted, session)

    if (matchSession) {
      return {
        success: true,
        session,
        player,
        assignment: { type: 'match', session: matchSession },
        matchSession,
      }
    }

    const assignment = await resolvePlayerAssignment(session)

    if (assignment.type === 'none') {
      const me = await fetchLobbyPlayer(session.playerId)
      if (!me) {
        return {
          success: false,
          error: 'Could not restore your lobby player record.',
        }
      }
    }

    return {
      success: true,
      session,
      player,
      assignment,
      matchSession: null,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to rejoin lobby.',
    }
  }
}
