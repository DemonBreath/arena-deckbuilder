import { useCallback, useEffect, useMemo, useState } from 'react'
import { getArenaDraftDefinition } from '../game/arenaDrafts'
import {
  castArenaDraftVote,
  getDraftSecondsRemaining,
  tryResolveArenaDraft,
} from '../services/arenaDraftService'
import { fetchLobby, subscribeToLobby } from '../services/lobbyService'
import { fetchLobbyPlayers, subscribeToLobbyPlayers } from '../services/lobbyService'
import { countActivePlayers } from '../services/arenaService'
import type { Lobby, LobbyPlayer } from '../types/lobby'
import type { OnlineLobbySession } from '../types/lobby'

const RESOLVE_POLL_MS = 2000

export function useArenaDraft(session: OnlineLobbySession | null) {
  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [players, setPlayers] = useState<LobbyPlayer[]>([])
  const [nowMs, setNowMs] = useState(Date.now())
  const [error, setError] = useState<string | null>(null)
  const [votePending, setVotePending] = useState(false)

  useEffect(() => {
    if (!session) {
      setLobby(null)
      setPlayers([])
      return
    }

    const load = async () => {
      try {
        const [l, p] = await Promise.all([
          fetchLobby(session.lobbyId),
          fetchLobbyPlayers(session.lobbyId),
        ])
        setLobby(l)
        setPlayers(p)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load draft.')
      }
    }

    void load()
    const unsubLobby = subscribeToLobby(session.lobbyId, setLobby)
    const unsubPlayers = subscribeToLobbyPlayers(session.lobbyId, setPlayers)
    return () => {
      unsubLobby()
      unsubPlayers()
    }
  }, [session?.lobbyId])

  useEffect(() => {
    if (lobby?.status !== 'arena_draft') return
    const interval = window.setInterval(() => setNowMs(Date.now()), 500)
    return () => window.clearInterval(interval)
  }, [lobby?.status])

  useEffect(() => {
    if (!session || lobby?.status !== 'arena_draft') return
    if (lobby.draftSession?.status !== 'voting') return

    const tick = () => {
      void tryResolveArenaDraft(session.lobbyId).catch(() => {
        /* another client may resolve first */
      })
    }

    tick()
    const interval = window.setInterval(tick, RESOLVE_POLL_MS)
    return () => window.clearInterval(interval)
  }, [session, lobby?.status, lobby?.draftSession?.status])

  const myPlayer = useMemo(
    () => players.find((p) => p.id === session?.playerId) ?? null,
    [players, session?.playerId],
  )

  const draftSession = lobby?.draftSession ?? null
  const secondsRemaining = draftSession
    ? getDraftSecondsRemaining(draftSession.endsAt, nowMs)
    : null

  const activeSurvivors = useMemo(() => countActivePlayers(players), [players])

  const myVoteIndex =
    session && draftSession
      ? draftSession.votes[session.playerId]
      : undefined

  const voteCounts = useMemo(() => {
    if (!draftSession?.options) return []
    if (draftSession.voteCounts) return draftSession.voteCounts
    return draftSession.options.map((_, index) =>
      Object.values(draftSession.votes).filter((v) => v === index).length,
    )
  }, [draftSession])

  const castVote = useCallback(
    async (optionIndex: number) => {
      if (!session || votePending || !draftSession) return
      setVotePending(true)
      setError(null)
      try {
        await castArenaDraftVote(session.lobbyId, session.playerId, optionIndex)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Vote failed.')
      } finally {
        setVotePending(false)
      }
    },
    [session, votePending, draftSession],
  )

  const winnerDefinition = draftSession?.winnerId
    ? getArenaDraftDefinition(draftSession.winnerId)
    : null

  return {
    lobby,
    players,
    draftSession,
    myPlayer,
    myVoteIndex,
    voteCounts,
    secondsRemaining,
    activeSurvivors,
    votePending,
    error,
    castVote,
    winnerDefinition,
    isResolved: draftSession?.status === 'resolved',
    canVote: Boolean(
      myPlayer &&
        !myPlayer.eliminated &&
        draftSession?.status === 'voting' &&
        myVoteIndex === undefined,
    ),
  }
}
