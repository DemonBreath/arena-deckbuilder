import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { logOnlineError } from '../lib/onlineLog'
import {
  fetchLobby,
  fetchLobbyPlayers,
  setPlayerReady,
  subscribeToLobby,
  subscribeToLobbyPlayers,
} from '../services/lobbyService'
import {

  createMatchPairingsFromLobby,

  resolvePlayerAssignment,

  subscribeToLobbyMatches,

} from '../services/matchService'

import { countActivePlayers } from '../services/arenaService'

import {

  canStartLobbyRound,

  countReadyPlayers,

  isLobbyHost,

  type Lobby,

  type LobbyPlayer,

  type OnlineLobbySession,

} from '../types/lobby'

import type { OnlineMatchSession } from '../types/match'



interface UseOnlineLobbyOptions {

  onEnterMatch: (session: OnlineMatchSession) => void

  onBye: () => void

  onSpectator: () => void

  onEnterShop: () => void

  onEnterArenaDraft: () => void

  onChampion: () => void

}



export function useOnlineLobby(

  session: OnlineLobbySession | null,

  options: UseOnlineLobbyOptions,

) {

  const optionsRef = useRef(options)

  optionsRef.current = options



  const [lobby, setLobby] = useState<Lobby | null>(null)

  const [players, setPlayers] = useState<LobbyPlayer[]>([])

  const [error, setError] = useState<string | null>(null)

  const [actionPending, setActionPending] = useState(false)

  const [pairingSummary, setPairingSummary] = useState<string | null>(null)



  const checkAssignment = useCallback(async () => {

    if (!session) return



    const {

      onEnterMatch,

      onBye,

      onSpectator,

      onEnterShop,

      onEnterArenaDraft,

      onChampion,

    } = optionsRef.current



    try {

      const assignment = await resolvePlayerAssignment(session)

      if (assignment.type === 'match') {

        onEnterMatch(assignment.session)

      } else if (assignment.type === 'bye') {

        onBye()

      } else if (assignment.type === 'spectator') {

        onSpectator()

      } else if (assignment.type === 'shop') {

        onEnterShop()

      } else if (assignment.type === 'arena_draft') {

        onEnterArenaDraft()

      } else if (assignment.type === 'champion') {

        onChampion()

      }

    } catch (err) {
      logOnlineError('lobby:assignment', err)
    }
  }, [session])



  useEffect(() => {

    if (!session) {

      setLobby(null)

      setPlayers([])

      setPairingSummary(null)

      return

    }



    setError(null)



    const loadInitial = async () => {

      try {

        const [lobbyData, playerData] = await Promise.all([

          fetchLobby(session.lobbyId),

          fetchLobbyPlayers(session.lobbyId),

        ])

        setLobby(lobbyData)

        setPlayers(playerData)

        await checkAssignment()

      } catch (err) {

        setError(err instanceof Error ? err.message : 'Failed to load lobby.')

      }

    }



    void loadInitial()



    const unsubPlayers = subscribeToLobbyPlayers(session.lobbyId, setPlayers)

    const unsubLobby = subscribeToLobby(session.lobbyId, (next) => {

      setLobby(next)

      void checkAssignment()

    })

    const unsubMatches = subscribeToLobbyMatches(session.lobbyId, () => {

      void checkAssignment()

    })



    return () => {

      unsubPlayers()

      unsubLobby()

      unsubMatches()

    }

  }, [session?.lobbyId, session?.playerId, checkAssignment])



  const myPlayer = useMemo(

    () => players.find((p) => p.id === session?.playerId) ?? null,

    [players, session?.playerId],

  )



  useEffect(() => {

    if (myPlayer?.eliminated && lobby?.status !== 'finished') {

      optionsRef.current.onSpectator()

    }

  }, [myPlayer?.eliminated, lobby?.status])



  const readyCount = useMemo(() => countReadyPlayers(players), [players])

  const activeCount = useMemo(() => countActivePlayers(players), [players])

  const canStartRound = useMemo(() => canStartLobbyRound(players), [players])

  const isHost = useMemo(

    () =>

      session ? isLobbyHost(players, session.playerId) : false,

    [players, session],

  )

  const isInMatchPhase = lobby?.status === 'in_match'

  const isShopPhase = lobby?.status === 'shop'

  const canHostStart =

    isHost &&

    canStartRound &&

    lobby?.status === 'waiting' &&

    !actionPending &&

    activeCount >= 2



  const toggleReady = useCallback(async () => {

    if (

      !session ||

      !myPlayer ||

      actionPending ||

      isInMatchPhase ||

      isShopPhase ||

      myPlayer.eliminated

    ) {

      return

    }



    const nextReady = myPlayer.readyState !== 'ready'

    setActionPending(true)

    setError(null)



    try {

      await setPlayerReady(session.playerId, nextReady)

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to update ready status.')

    } finally {

      setActionPending(false)

    }

  }, [session, myPlayer, actionPending, isInMatchPhase, isShopPhase])



  const startRound = useCallback(async () => {

    if (!session || !canHostStart) return



    setActionPending(true)

    setError(null)

    setPairingSummary(null)



    try {

      const result = await createMatchPairingsFromLobby(

        session.lobbyId,

        session.lobbyCode,

      )

      const matchCount = result.matches.length

      const byeCount = result.byePlayerIds.length

      setPairingSummary(

        `Round ${lobby?.roundNumber ?? 1}: ${matchCount} match${matchCount === 1 ? '' : 'es'}` +

          (byeCount > 0 ? `, ${byeCount} bye` : '') +

          '.',

      )



      const [lobbyData] = await Promise.all([

        fetchLobby(session.lobbyId),

        checkAssignment(),

      ])

      setLobby(lobbyData)

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to start round.')

    } finally {

      setActionPending(false)

    }

  }, [session, canHostStart, checkAssignment, lobby?.roundNumber])



  return {

    lobby,

    players,

    myPlayer,

    readyCount,

    activeCount,

    canStartRound,

    canHostStart,

    isHost,

    isInMatchPhase,

    isShopPhase,

    pairingSummary,

    error,

    actionPending,

    toggleReady,

    startRound,

  }

}


