import { useEffect, useMemo, useRef, useState } from 'react'
import {
  type ArenaSnapshot,
  deriveArenaFeedEvents,
  mergeFeedEntries,
} from '../services/arenaFeedService'
import {
  fetchLobby,
  fetchLobbyPlayers,
  subscribeToLobby,
  subscribeToLobbyPlayers,
} from '../services/lobbyService'
import {
  fetchLobbySpectatorMatches,
  subscribeToLobbyMatches,
} from '../services/matchService'
import { buildSpectatorMatchSummaries } from '../services/spectatorService'
import type { Lobby, LobbyPlayer } from '../types/lobby'
import type { PvpMatch } from '../types/match'
import type { ArenaFeedEntry, SpectatorMatchSummary } from '../types/spectator'
import type { OnlineRunSession } from './useOnlineRunStatus'

export function useSpectatorArena(session: OnlineRunSession | null) {
  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [players, setPlayers] = useState<LobbyPlayer[]>([])
  const [matches, setMatches] = useState<PvpMatch[]>([])
  const [feed, setFeed] = useState<ArenaFeedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const snapshotRef = useRef<ArenaSnapshot | null>(null)

  const commitSnapshot = (next: ArenaSnapshot) => {
    const events = deriveArenaFeedEvents(snapshotRef.current, next)
    snapshotRef.current = next
    setLobby(next.lobby)
    setPlayers(next.players)
    setMatches(next.matches)
    if (events.length > 0) {
      setFeed((prev) => mergeFeedEntries(prev, events))
    }
  }

  useEffect(() => {
    if (!session) {
      snapshotRef.current = null
      setLobby(null)
      setPlayers([])
      setMatches([])
      setFeed([])
      setLoading(false)
      return
    }

    const lobbyId = session.lobbyId
    setLoading(true)
    setError(null)
    snapshotRef.current = null

    const load = async () => {
      try {
        const [lobbyData, playerData, matchData] = await Promise.all([
          fetchLobby(lobbyId),
          fetchLobbyPlayers(lobbyId),
          fetchLobbySpectatorMatches(lobbyId),
        ])
        commitSnapshot({
          lobby: lobbyData,
          players: playerData,
          matches: matchData,
        })
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load spectator data.',
        )
      } finally {
        setLoading(false)
      }
    }

    void load()

    const unsubPlayers = subscribeToLobbyPlayers(lobbyId, (nextPlayers) => {
      const snap = snapshotRef.current
      if (!snap) return
      commitSnapshot({ ...snap, players: nextPlayers })
    })

    const unsubLobby = subscribeToLobby(lobbyId, (nextLobby) => {
      const snap = snapshotRef.current
      if (!snap) return
      commitSnapshot({ ...snap, lobby: nextLobby })
    })

    const unsubMatches = subscribeToLobbyMatches(lobbyId, () => {
      void fetchLobbySpectatorMatches(lobbyId)
        .then((matchData) => {
          const snap = snapshotRef.current
          if (!snap) return
          commitSnapshot({ ...snap, matches: matchData })
        })
        .catch(() => {
          /* ignore transient errors */
        })
    })

    return () => {
      unsubPlayers()
      unsubLobby()
      unsubMatches()
    }
  }, [session?.lobbyId])

  const activeMatches = useMemo(
    () =>
      matches.filter(
        (m) => m.status === 'waiting' || m.status === 'active',
      ),
    [matches],
  )

  const matchSummaries = useMemo(
    (): SpectatorMatchSummary[] =>
      buildSpectatorMatchSummaries(activeMatches, players),
    [activeMatches, players],
  )

  const isArenaFinished = lobby?.status === 'finished'

  return {
    lobby,
    players,
    matches,
    matchSummaries,
    feed,
    loading,
    error,
    isArenaFinished,
  }
}
