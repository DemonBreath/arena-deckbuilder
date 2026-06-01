import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { RejoinPrompt } from './components/RejoinPrompt'
import { LobbyInviteJoinView } from './components/LobbyInviteJoinView'
import { BattleView } from './components/BattleView'
import { ByeView } from './components/ByeView'
import { DailyChampionsView } from './components/DailyChampionsView'
import { GameOverView } from './components/GameOverView'
import { MatchResultsView } from './components/MatchResultsView'
import { MatchRoomView } from './components/MatchRoomView'
import { OnlineChampionView } from './components/OnlineChampionView'
import { OnlineLobbyView } from './components/OnlineLobbyView'
import { OnlineShopView } from './components/OnlineShopView'
import { RewardView } from './components/RewardView'
import { ShopView } from './components/ShopView'
import { SpectatorView } from './components/SpectatorView'
import { VictoryView } from './components/VictoryView'
import { getOrCreateSessionId } from './lib/sessionId'
import {
  canStartRun,
  gameReducer,
  getOpponentsDefeatedProgress,
  INITIAL_STATE,
} from './game/gameState'
import {
  buildChampionSubmission,
  submitChampionPublic,
} from './services/championService'
import {
  clearLobbyPath,
  getLobbyCodeFromPath,
  replaceLobbyPath,
  subscribeToLobbyPath,
} from './lib/lobbyRouting'
import {
  createOrJoinLobby,
  fetchLobbyPlayer,
  fetchLobbyPlayers,
  isOnlineLobbyAvailable,
  isValidLobbyCode,
  leaveLobbySmart,
} from './services/lobbyService'
import { PVP_BYE_GOLD, PVP_LOSS_GOLD, PVP_WIN_GOLD } from './game/arenaConstants'
import {
  clearPersistedSession,
  loadPersistedSession,
  persistFromLobbySession,
  updatePersistedMatchId,
  type PersistedOnlineSession,
} from './services/persistedSessionService'
import { rejoinFromPersisted } from './services/reconnectService'
import { clearOnlineRun, setLastRoundGold } from './services/onlineRunService'
import type { OnlineLobbySession } from './types/lobby'
import type { OnlineMatchSession, PvpMatch } from './types/match'
import type { PlayerAssignment } from './services/reconnectService'
import './styles.css'

function formatLobbyJoinError(err: unknown): string {
  const message =
    err instanceof Error ? err.message : 'Failed to join lobby.'
  if (message.toLowerCase().includes('full')) return 'Lobby Full.'
  return message
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE)
  const [onlineSession, setOnlineSession] = useState<OnlineLobbySession | null>(
    null,
  )
  const [matchSession, setMatchSession] = useState<OnlineMatchSession | null>(
    null,
  )
  const [showBye, setShowBye] = useState(false)
  const [showSpectator, setShowSpectator] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [showChampion, setShowChampion] = useState(false)
  const [showMatchResults, setShowMatchResults] = useState(false)
  const [completedMatch, setCompletedMatch] = useState<PvpMatch | null>(null)
  const [pathLobbyCode, setPathLobbyCode] = useState<string | null>(() =>
    getLobbyCodeFromPath(),
  )
  const [lobbyCode, setLobbyCode] = useState(() =>
    getLobbyCodeFromPath() ?? '',
  )
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [pendingRejoin, setPendingRejoin] =
    useState<PersistedOnlineSession | null>(null)
  const [rejoining, setRejoining] = useState(false)
  const [rejoinError, setRejoinError] = useState<string | null>(null)
  const [showDailyChampionsBoard, setShowDailyChampionsBoard] = useState(false)
  const [soloSubmitting, setSoloSubmitting] = useState(false)
  const [soloSubmitMessage, setSoloSubmitMessage] = useState<string | null>(null)
  const [soloSubmitError, setSoloSubmitError] = useState<string | null>(null)
  const soloSubmitAttemptedRef = useRef(false)

  const canStart = canStartRun(state)
  const onlineAvailable = isOnlineLobbyAvailable()
  const canJoinLobby =
    onlineAvailable &&
    canStart &&
    isValidLobbyCode(lobbyCode) &&
    !joining &&
    !rejoining

  useEffect(() => {
    return subscribeToLobbyPath((code) => {
      setPathLobbyCode(code)
      if (code) setLobbyCode(code)
    })
  }, [])

  useEffect(() => {
    if (onlineSession) {
      replaceLobbyPath(onlineSession.lobbyCode)
    }
  }, [onlineSession?.lobbyCode])

  useEffect(() => {
    if (!onlineAvailable || onlineSession) return
    const saved = loadPersistedSession()
    if (saved) {
      setPendingRejoin(saved)
      setLobbyCode(saved.lobbyCode)
      if (!state.championName.trim()) {
        dispatch({ type: 'SET_CHAMPION_NAME', name: saved.championName })
      }
    }
  }, [onlineAvailable, onlineSession, state.championName])

  const resetOnlineScreens = useCallback(() => {
    setShowBye(false)
    setShowSpectator(false)
    setShowShop(false)
    setShowChampion(false)
    setShowMatchResults(false)
    setCompletedMatch(null)
  }, [])

  const applyPlayerAssignment = useCallback(
    (assignment: PlayerAssignment, playerEliminated: boolean) => {
      resetOnlineScreens()

      if (assignment.type === 'match') {
        setMatchSession(assignment.session)
        updatePersistedMatchId(assignment.session.matchId)
        return
      }

      updatePersistedMatchId(null)

      if (assignment.type === 'bye') {
        setShowBye(true)
      } else if (assignment.type === 'spectator' || playerEliminated) {
        setShowSpectator(true)
      } else if (assignment.type === 'shop') {
        setShowShop(true)
      } else if (assignment.type === 'champion') {
        setShowChampion(true)
      }
    },
    [resetOnlineScreens],
  )

  const handleJoinLobby = async () => {
    if (!canJoinLobby) return

    setJoining(true)
    setJoinError(null)

    try {
      const { session } = await createOrJoinLobby(
        lobbyCode,
        state.championName,
        getOrCreateSessionId(),
      )
      setOnlineSession(session)
      setMatchSession(null)
      resetOnlineScreens()
      setPendingRejoin(null)
      persistFromLobbySession(session, null)

      const players = await fetchLobbyPlayers(session.lobbyId)
      const me = players.find((p) => p.id === session.playerId)
      if (me?.eliminated) setShowSpectator(true)
      replaceLobbyPath(session.lobbyCode)
    } catch (err) {
      setJoinError(formatLobbyJoinError(err))
    } finally {
      setJoining(false)
    }
  }

  const handleLeaveLobby = async () => {
    if (onlineSession) {
      try {
        await leaveLobbySmart(onlineSession.playerId, onlineSession.lobbyId)
        clearOnlineRun(onlineSession.lobbyId, onlineSession.sessionId)
      } catch {
        /* leaving UI even if server update fails */
      }
    }
    setOnlineSession(null)
    setMatchSession(null)
    resetOnlineScreens()
    setJoinError(null)
    setPendingRejoin(null)
    clearPersistedSession()
    clearLobbyPath()
    setPathLobbyCode(null)
  }

  const handleBackToHome = () => {
    clearLobbyPath()
    setPathLobbyCode(null)
    setJoinError(null)
    dispatch({ type: 'GO_TITLE' })
  }

  const handleStartFresh = () => {
    clearPersistedSession()
    setPendingRejoin(null)
    setRejoinError(null)
  }

  const handleRejoinLobby = async () => {
    if (!pendingRejoin || rejoining) return

    setRejoining(true)
    setRejoinError(null)
    setJoinError(null)

    try {
      const result = await rejoinFromPersisted(pendingRejoin)

      if (!result.success) {
        setRejoinError(result.error)
        return
      }

      dispatch({
        type: 'SET_CHAMPION_NAME',
        name: result.session.championName,
      })
      setLobbyCode(result.session.lobbyCode)
      setOnlineSession(result.session)
      setPendingRejoin(null)
      persistFromLobbySession(
        result.session,
        result.matchSession?.matchId ?? null,
      )

      replaceLobbyPath(result.session.lobbyCode)

      if (result.matchSession) {
        setMatchSession(result.matchSession)
        resetOnlineScreens()
      } else {
        applyPlayerAssignment(result.assignment, result.player.eliminated)
      }
    } catch (err) {
      setRejoinError(formatLobbyJoinError(err))
    } finally {
      setRejoining(false)
    }
  }

  const handleStartSoloFromLobby = () => {
    void handleLeaveLobby()
    dispatch({ type: 'START_RUN' })
  }

  const handleEnterMatch = useCallback(
    (match: OnlineMatchSession) => {
      setMatchSession(match)
      resetOnlineScreens()
      updatePersistedMatchId(match.matchId)
      setOnlineSession((lobbySession) => {
        if (lobbySession) {
          persistFromLobbySession(lobbySession, match.matchId)
        }
        return lobbySession
      })
    },
    [resetOnlineScreens],
  )

  const handleBye = useCallback(() => {
    setShowBye(true)
    setMatchSession(null)
    setShowShop(false)
    setShowChampion(false)
    setShowSpectator(false)
  }, [])

  const handleSpectator = useCallback(() => {
    setMatchSession(null)
    setShowBye(false)
    setShowShop(false)
    setShowChampion(false)
    setShowSpectator(true)
  }, [])

  const handleEnterShop = useCallback(() => {
    if (onlineSession && showBye) {
      setLastRoundGold(
        onlineSession.lobbyId,
        onlineSession.sessionId,
        PVP_BYE_GOLD,
      )
    }
    setShowShop(true)
    setMatchSession(null)
    setShowBye(false)
    setShowSpectator(false)
    setShowChampion(false)
  }, [onlineSession, showBye])

  const handleChampion = useCallback(() => {
    setShowChampion(true)
    setMatchSession(null)
    resetOnlineScreens()
  }, [resetOnlineScreens])

  const handleBackFromBye = useCallback(() => {
    setShowBye(false)
  }, [])

  const handleLeaveMatch = useCallback(() => {
    setMatchSession(null)
    updatePersistedMatchId(null)
    if (onlineSession) {
      persistFromLobbySession(onlineSession, null)
    }
  }, [onlineSession])

  const handleMatchComplete = useCallback(
    (match: PvpMatch) => {
      if (onlineSession) {
        const won = match.winnerPlayerId === onlineSession.playerId
        setLastRoundGold(
          onlineSession.lobbyId,
          onlineSession.sessionId,
          won ? PVP_WIN_GOLD : PVP_LOSS_GOLD,
        )
      }
      setCompletedMatch(match)
      setMatchSession(null)
      updatePersistedMatchId(null)
      if (onlineSession) {
        persistFromLobbySession(onlineSession, null)
      }
      setShowMatchResults(true)
    },
    [onlineSession],
  )

  const handleMatchResultsContinue = useCallback(async () => {
    setShowMatchResults(false)
    setCompletedMatch(null)

    if (onlineSession) {
      try {
        const me = await fetchLobbyPlayer(onlineSession.playerId)
        if (me?.eliminated) {
          setShowSpectator(true)
          return
        }
      } catch {
        /* fall through to shop */
      }
    }

    setShowShop(true)
  }, [onlineSession])

  const handleShopContinue = useCallback(() => {
    setShowShop(false)
  }, [])

  const handleSoloChampionSubmit = useCallback(async () => {
    if (
      state.screen !== 'victory' ||
      state.championSubmitted ||
      soloSubmitting ||
      soloSubmitAttemptedRef.current
    ) {
      return
    }

    soloSubmitAttemptedRef.current = true
    setSoloSubmitting(true)
    setSoloSubmitError(null)
    setSoloSubmitMessage(null)

    const progress = getOpponentsDefeatedProgress(state)
    const result = await submitChampionPublic(
      buildChampionSubmission(
        state.championName,
        'SOLO',
        progress.defeated,
        state.relics.length,
        state.deck.length,
        state.gold,
      ),
    )

    setSoloSubmitting(false)

    if (result.success) {
      dispatch({ type: 'SUBMIT_TO_DAILY_CHAMPIONS' })
      const sourceNote =
        result.source === 'supabase'
          ? 'on the public leaderboard.'
          : 'locally in your browser.'
      setSoloSubmitMessage(
        result.error
          ? `Submitted ${sourceNote} ${result.error}`
          : `Submitted to Daily Champions ${sourceNote}`,
      )
    } else {
      soloSubmitAttemptedRef.current = false
      setSoloSubmitError(result.error ?? 'Failed to submit champion.')
    }
  }, [state, soloSubmitting])

  if (showDailyChampionsBoard) {
    return (
      <div className="app">
        <DailyChampionsView
          onBack={() => {
            setShowDailyChampionsBoard(false)
            if (!onlineSession && state.screen !== 'champions') {
              dispatch({ type: 'GO_TITLE' })
            }
          }}
        />
      </div>
    )
  }

  if (onlineSession && showMatchResults && completedMatch) {
    return (
      <div className="app">
        <MatchResultsView
          session={onlineSession}
          match={completedMatch}
          onContinue={handleMatchResultsContinue}
        />
      </div>
    )
  }

  if (matchSession) {
    return (
      <div className="app">
        <MatchRoomView
          session={matchSession}
          onLeave={handleLeaveMatch}
          onMatchComplete={handleMatchComplete}
        />
      </div>
    )
  }

  if (onlineSession && showChampion) {
    return (
      <div className="app">
        <OnlineChampionView
          session={onlineSession}
          onLeave={() => void handleLeaveLobby()}
          onViewChampions={() => setShowDailyChampionsBoard(true)}
        />
      </div>
    )
  }

  if (onlineSession && showShop) {
    return (
      <div className="app">
        <OnlineShopView
          session={onlineSession}
          onContinue={handleShopContinue}
        />
      </div>
    )
  }

  if (onlineSession && showSpectator) {
    return (
      <div className="app">
        <SpectatorView
          session={onlineSession}
          onLeave={() => void handleLeaveLobby()}
          onViewChampions={() => setShowDailyChampionsBoard(true)}
        />
      </div>
    )
  }

  if (onlineSession && showBye) {
    return (
      <div className="app">
        <ByeView session={onlineSession} onBackToLobby={handleBackFromBye} />
      </div>
    )
  }

  const showInviteJoin =
    onlineAvailable &&
    pathLobbyCode &&
    !onlineSession &&
    state.screen === 'title'

  if (showInviteJoin) {
    return (
      <div className="app">
        <LobbyInviteJoinView
          lobbyCode={pathLobbyCode}
          championName={state.championName}
          onChampionNameChange={(name) =>
            dispatch({ type: 'SET_CHAMPION_NAME', name })
          }
          onJoin={() => void handleJoinLobby()}
          onBackToHome={handleBackToHome}
          joining={joining}
          joinError={joinError}
          canJoin={canJoinLobby}
          pendingRejoin={pendingRejoin}
          rejoining={rejoining}
          rejoinError={rejoinError}
          onRejoin={() => void handleRejoinLobby()}
          onStartFresh={handleStartFresh}
        />
      </div>
    )
  }

  if (onlineSession) {
    return (
      <div className="app">
        <OnlineLobbyView
          session={onlineSession}
          onLeave={() => void handleLeaveLobby()}
          onStartSoloRun={handleStartSoloFromLobby}
          onEnterMatch={handleEnterMatch}
          onBye={handleBye}
          onSpectator={handleSpectator}
          onEnterShop={handleEnterShop}
          onChampion={handleChampion}
        />
      </div>
    )
  }

  return (
    <div className="app">
      {state.screen === 'title' && (
        <section className="screen title-screen">
          <h1>Arena Deckbuilder</h1>
          <p className="tagline">
            Enter the arena, defeat every opponent, and claim the daily crown.
          </p>
          <p className="subtitle">
            Milestone 16 — shareable no-login lobby invites
          </p>

          {onlineAvailable && pendingRejoin && !onlineSession && (
            <RejoinPrompt
              persisted={pendingRejoin}
              rejoining={rejoining}
              error={rejoinError}
              onRejoin={() => void handleRejoinLobby()}
              onStartFresh={handleStartFresh}
            />
          )}

          <label className="champion-name-field">
            <span>Champion Name</span>
            <input
              type="text"
              className="champion-name-input"
              placeholder="Enter your champion name"
              value={state.championName}
              maxLength={20}
              onChange={(e) =>
                dispatch({ type: 'SET_CHAMPION_NAME', name: e.target.value })
              }
            />
          </label>

          {onlineAvailable ? (
            <div className="title-online-section">
              <h2 className="title-section-heading">Online lobby</h2>
              <label className="champion-name-field">
                <span>Lobby Code</span>
                <input
                  type="text"
                  className="champion-name-input lobby-code-input"
                  placeholder="e.g. ARENA01"
                  value={lobbyCode}
                  maxLength={8}
                  onChange={(e) =>
                    setLobbyCode(e.target.value.toUpperCase())
                  }
                />
              </label>
              <p className="title-hint title-hint--inline">
                Up to 8 players per lobby. Share the code to fill the roster.
              </p>
              {joinError && (
                <p className="online-lobby-error">{joinError}</p>
              )}
              <button
                type="button"
                className="primary-button"
                disabled={!canJoinLobby}
                onClick={() => void handleJoinLobby()}
              >
                {joining ? 'Joining…' : 'Join Online Lobby'}
              </button>
            </div>
          ) : (
            <p className="title-offline-note">
              Online lobby unavailable — add Supabase env vars to enable.
              Solo run still works offline.
            </p>
          )}

          <div className="title-divider">
            <span>or</span>
          </div>

          <div className="title-actions">
            <button
              type="button"
              className="primary-button"
              disabled={!canStart}
              onClick={() => dispatch({ type: 'START_RUN' })}
            >
              Start Solo Run
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => dispatch({ type: 'VIEW_DAILY_CHAMPIONS' })}
            >
              Daily Champions
            </button>
          </div>

          {!canStart && (
            <p className="title-hint">Enter a champion name to begin.</p>
          )}
        </section>
      )}

      {state.screen === 'champions' && (
        <DailyChampionsView onBack={() => dispatch({ type: 'GO_TITLE' })} />
      )}

      {state.screen === 'battle' && (
        <BattleView
          state={state}
          onPlayCard={(handIndex) =>
            dispatch({ type: 'PLAY_CARD', handIndex })
          }
          onEndTurn={() => dispatch({ type: 'END_TURN' })}
        />
      )}

      {state.screen === 'reward' && (
        <RewardView
          state={state}
          onPickCard={(offerIndex) =>
            dispatch({ type: 'PICK_CARD_REWARD', offerIndex })
          }
          onPickRelic={(offerIndex) =>
            dispatch({ type: 'PICK_RELIC_REWARD', offerIndex })
          }
          onContinueToShop={() => dispatch({ type: 'CONTINUE_TO_SHOP' })}
        />
      )}

      {state.screen === 'shop' && (
        <ShopView
          state={state}
          onBuyCard={(offerIndex) =>
            dispatch({ type: 'BUY_CARD', offerIndex })
          }
          onNextBattle={() => dispatch({ type: 'NEXT_BATTLE' })}
        />
      )}

      {state.screen === 'gameover' && (
        <GameOverView
          state={state}
          onRestart={() => dispatch({ type: 'GO_TITLE' })}
          onViewChampions={() => dispatch({ type: 'VIEW_DAILY_CHAMPIONS' })}
        />
      )}

      {state.screen === 'victory' && (
        <VictoryView
          state={state}
          submitted={state.championSubmitted}
          submitting={soloSubmitting}
          submitMessage={soloSubmitMessage}
          submitError={soloSubmitError}
          onSubmit={() => void handleSoloChampionSubmit()}
          onViewChampions={() => dispatch({ type: 'VIEW_DAILY_CHAMPIONS' })}
          onRestart={() => {
            soloSubmitAttemptedRef.current = false
            dispatch({ type: 'GO_TITLE' })
          }}
        />
      )}
    </div>
  )
}

export default App
