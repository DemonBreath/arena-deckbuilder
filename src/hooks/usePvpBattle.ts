import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildPvpBattleView,
  serializePvpBattleState,
  type PvpBattleView,
  type PvpEmoteId,
} from '../game/pvpBattleState'
import { TIMER_POLL_MS } from '../game/pvpTimers'
import {
  fetchMatch,
  markPlayerLoadedInMatch,
  subscribeToMatch,
} from '../services/matchService'
import { fetchLobbyPlayers } from '../services/lobbyService'
import {
  submitPvpBattleAction,
  tryInitializePvpBattle,
} from '../services/pvpBattleService'
import { processMatchTimers } from '../services/pvpTimerService'
import {
  getConnectionStatus,
  getOpponentId,
  type ConnectionStatus,
  type OnlineMatchSession,
  type PvpMatch,
} from '../types/match'
import type { LobbyPlayer } from '../types/lobby'

export function usePvpBattle(
  session: OnlineMatchSession | null,
  options?: { onMatchComplete?: (match: PvpMatch) => void },
) {
  const { onMatchComplete } = options ?? {}
  const [match, setMatch] = useState<PvpMatch | null>(null)
  const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([])
  const [error, setError] = useState<string | null>(null)
  const [actionPending, setActionPending] = useState(false)
  const [timerPending, setTimerPending] = useState(false)
  const [selfLoaded, setSelfLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const markedRef = useRef(false)
  const initRef = useRef(false)
  const completedRef = useRef(false)
  const timerRunningRef = useRef(false)

  const handleMatchUpdate = useCallback(
    (next: PvpMatch | null) => {
      setMatch(next)
      if (next?.status === 'completed' && !completedRef.current) {
        completedRef.current = true
        onMatchComplete?.(next)
      }
    },
    [onMatchComplete],
  )

  useEffect(() => {
    if (!session) {
      setMatch(null)
      setLobbyPlayers([])
      setSelfLoaded(false)
      markedRef.current = false
      initRef.current = false
      completedRef.current = false
      setLocalPreview(null)
      return
    }

    setError(null)
    markedRef.current = false
    initRef.current = false
    completedRef.current = false

    const load = async () => {
      try {
        const [data, players] = await Promise.all([
          fetchMatch(session.matchId),
          fetchLobbyPlayers(session.lobbyId),
        ])
        setMatch(data)
        setLobbyPlayers(players)
        if (data && session.playerId) {
          const already =
            session.playerId === data.player1Id
              ? data.player1Loaded
              : data.player2Loaded
          if (already) {
            setSelfLoaded(true)
            markedRef.current = true
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load match.')
      }
    }

    void load()

    const unsub = subscribeToMatch(session.matchId, (next) => {
      handleMatchUpdate(next)
      if (next && session.playerId) {
        const already =
          session.playerId === next.player1Id
            ? next.player1Loaded
            : next.player2Loaded
        if (already) {
          setSelfLoaded(true)
          markedRef.current = true
        }
      }
    })

    const unsubPlayers = () => {
      /* refreshed on interval with timers */
    }

    void fetchLobbyPlayers(session.lobbyId).then(setLobbyPlayers)

    const playerRefresh = window.setInterval(() => {
      void fetchLobbyPlayers(session.lobbyId).then(setLobbyPlayers)
    }, TIMER_POLL_MS)

    return () => {
      unsub()
      unsubPlayers()
      window.clearInterval(playerRefresh)
    }
  }, [session, handleMatchUpdate])

  useEffect(() => {
    if (!session || !match || markedRef.current || match.player2Id === null) {
      return
    }

    const confirm = async () => {
      markedRef.current = true
      setLoading(true)
      try {
        const updated = await markPlayerLoadedInMatch(
          session.matchId,
          session.playerId,
        )
        handleMatchUpdate(updated)
        setSelfLoaded(true)
      } catch (err) {
        markedRef.current = false
        setError(
          err instanceof Error ? err.message : 'Failed to confirm presence.',
        )
      } finally {
        setLoading(false)
      }
    }

    void confirm()
  }, [session, match, handleMatchUpdate])

  useEffect(() => {
    if (!session || !match || initRef.current) return
    if (match.status !== 'active' || match.battleState) return
    if (!match.player1Loaded || !match.player2Loaded) return

    initRef.current = true
    const init = async () => {
      try {
        const initialized = await tryInitializePvpBattle(session.matchId)
        if (initialized) handleMatchUpdate(initialized)
      } catch (err) {
        initRef.current = false
        setError(
          err instanceof Error ? err.message : 'Failed to start battle.',
        )
      }
    }
    void init()
  }, [session, match, handleMatchUpdate])

  useEffect(() => {
    if (!session || !match) return
    if (match.status !== 'active' || !match.battleState) return

    const tick = async () => {
      if (timerRunningRef.current) return
      timerRunningRef.current = true
      setTimerPending(true)
      try {
        const updated = await processMatchTimers(session.matchId)
        if (updated) handleMatchUpdate(updated)
      } catch {
        /* ignore timer race errors */
      } finally {
        timerRunningRef.current = false
        setTimerPending(false)
      }
    }

    void tick()
    const interval = window.setInterval(() => void tick(), TIMER_POLL_MS)
    return () => window.clearInterval(interval)
  }, [session, match?.id, match?.status, match?.battleState?.version, handleMatchUpdate])

  const connectionStatus: ConnectionStatus = match
    ? getConnectionStatus(match, session?.playerId ?? '', selfLoaded)
    : 'connecting'

  const bothConnected = match?.status === 'active' || match?.status === 'completed'

  const battleView: PvpBattleView | null = useMemo(() => {
    if (!match?.battleState || !session) return null
    return buildPvpBattleView(match.battleState, session.playerId)
  }, [match?.battleState, session])

  const opponentPlayer = useMemo(() => {
    if (!session || !match) return null
    const oppId = getOpponentId(match, session.playerId)
    return lobbyPlayers.find((p) => p.id === oppId) ?? null
  }, [session, match, lobbyPlayers])

  const remoteStateJson = useMemo(
    () =>
      match?.battleState ? serializePvpBattleState(match.battleState) : null,
    [match?.battleState],
  )

  const playCard = useCallback(
    async (handIndex: number) => {
      if (!session || !match?.battleState || actionPending || timerPending) {
        return
      }
      if (match.battleState.phase === 'completed') return

      setActionPending(true)
      setError(null)
      setLocalPreview(
        serializePvpBattleState({
          ...match.battleState,
          message: `Local preview: playing card ${handIndex}`,
        }),
      )

      try {
        const updated = await submitPvpBattleAction(
          session.matchId,
          session.playerId,
          { type: 'PLAY_CARD', handIndex },
          match.battleState.version,
        )
        handleMatchUpdate(updated)
        setLocalPreview(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to play card.')
        const latest = await fetchMatch(session.matchId)
        if (latest) handleMatchUpdate(latest)
        setLocalPreview(null)
      } finally {
        setActionPending(false)
      }
    },
    [session, match, actionPending, timerPending, handleMatchUpdate],
  )

  const sendEmote = useCallback(
    async (emoteId: PvpEmoteId) => {
      if (!session || !match?.battleState || actionPending) return

      setActionPending(true)
      setError(null)

      try {
        const updated = await submitPvpBattleAction(
          session.matchId,
          session.playerId,
          { type: 'EMOTE', emoteId },
          match.battleState.version,
        )
        handleMatchUpdate(updated)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send emote.')
        const latest = await fetchMatch(session.matchId)
        if (latest) handleMatchUpdate(latest)
      } finally {
        setActionPending(false)
      }
    },
    [session, match, actionPending, handleMatchUpdate],
  )

  const endTurn = useCallback(async () => {
    if (!session || !match?.battleState || actionPending || timerPending) {
      return
    }
    if (match.battleState.phase === 'completed') return

    setActionPending(true)
    setError(null)
    setLocalPreview(
      serializePvpBattleState({
        ...match.battleState,
        message: 'Local preview: end turn',
      }),
    )

    try {
      const updated = await submitPvpBattleAction(
        session.matchId,
        session.playerId,
        { type: 'END_TURN' },
        match.battleState.version,
      )
      handleMatchUpdate(updated)
      setLocalPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end turn.')
      const latest = await fetchMatch(session.matchId)
      if (latest) handleMatchUpdate(latest)
      setLocalPreview(null)
    } finally {
      setActionPending(false)
    }
  }, [session, match, actionPending, timerPending, handleMatchUpdate])

  const retryLoad = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)
    try {
      const updated = await markPlayerLoadedInMatch(
        session.matchId,
        session.playerId,
      )
      handleMatchUpdate(updated)
      setSelfLoaded(true)
      markedRef.current = true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm presence.')
    } finally {
      setLoading(false)
    }
  }, [session, handleMatchUpdate])

  return {
    match,
    battleView,
    error,
    loading,
    actionPending: actionPending || timerPending,
    connectionStatus,
    bothConnected,
    selfLoaded,
    playCard,
    sendEmote,
    endTurn,
    retryLoad,
    remoteStateJson,
    localStateJson: localPreview,
    stateVersion: match?.stateVersion ?? match?.battleState?.version ?? 0,
    turnStartAt: match?.turnStartAt ?? null,
    opponentLastSeenAt: opponentPlayer?.lastSeenAt ?? null,
  }
}
