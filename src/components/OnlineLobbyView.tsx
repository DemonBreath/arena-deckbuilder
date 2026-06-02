import { ARENA_MAX_PLAYERS } from '../game/arenaConstants'

import { useOnlineConnectivity } from '../hooks/useOnlineConnectivity'

import { useOnlineLobby } from '../hooks/useOnlineLobby'

import { useOnlineRunStatus } from '../hooks/useOnlineRunStatus'

import { ConnectionStatusBanner } from './ConnectionStatusBanner'

import { CopyInviteLinkButton } from './CopyInviteLinkButton'

import { LobbyStatusBadge } from './LobbyStatusBadge'

import { PvpRunStatusHeader } from './PvpRunStatusHeader'

import type { OnlineLobbySession } from '../types/lobby'

import type { OnlineMatchSession } from '../types/match'

import { ActiveArenaDraftsPanel } from './ActiveArenaDraftsPanel'
import { ArenaPhaseBanner } from './ArenaPhaseBanner'
import { ArenaRosterPanel } from './ArenaRosterPanel'
import { ClassInfoBadge } from './ClassInfoBadge'



interface OnlineLobbyViewProps {

  session: OnlineLobbySession

  onLeave: () => void

  onStartSoloRun: () => void

  onEnterMatch: (matchSession: OnlineMatchSession) => void

  onBye: () => void

  onSpectator: () => void

  onEnterShop: () => void

  onEnterArenaDraft: () => void

  onChampion: () => void

}



export function OnlineLobbyView({

  session,

  onLeave,

  onStartSoloRun,

  onEnterMatch,

  onBye,

  onSpectator,

  onEnterShop,

  onEnterArenaDraft,

  onChampion,

}: OnlineLobbyViewProps) {

  const {

    lobby,

    players,

    myPlayer,

    readyCount,

    activeCount,

    canStartRound,

    canHostStart,

    isHost,

    isInMatchPhase,

    pairingSummary,

    error,

    actionPending,

    toggleReady,

    startRound,

  } = useOnlineLobby(session, {

    onEnterMatch,

    onBye,

    onSpectator,

    onEnterShop,

    onEnterArenaDraft,

    onChampion,

  })



  const isReady = myPlayer?.readyState === 'ready'

  const runStatus = useOnlineRunStatus(session)

  const { connectionStatus } = useOnlineConnectivity(

    session.playerId,

    session.lobbyId,

  )



  return (

    <section className="screen online-lobby-screen" data-testid="online-lobby-screen">

      <ConnectionStatusBanner status={connectionStatus} />

      {runStatus && (

        <PvpRunStatusHeader status={runStatus} title="Online Arena Lobby" />

      )}



      <div className="online-lobby-invite-bar">

        <p className="online-lobby-code-display">

          Lobby code <strong>{session.lobbyCode}</strong>

        </p>

        <CopyInviteLinkButton lobbyCode={session.lobbyCode} />

      </div>



      <LobbyStatusBadge lobby={lobby} />

      {lobby && lobby.activeDraftIds.length > 0 && (
        <ActiveArenaDraftsPanel
          activeDraftIds={lobby.activeDraftIds}
          compact
        />
      )}

      {runStatus && (
        <ArenaPhaseBanner
          phase={runStatus.arenaPhase}
          activePlayersRemaining={runStatus.activePlayersRemaining}
          finalDuelSeriesLabel={runStatus.finalDuelSeriesLabel}
        />
      )}

      {myPlayer && (
        <div className="online-lobby-my-class">
          <span>Your class</span>
          <ClassInfoBadge classId={myPlayer.classId} showPassiveTooltip />
        </div>
      )}

      <p className="online-lobby-screen__tagline">

        Up to {ARENA_MAX_PLAYERS} players — last fighter standing wins.

        {lobby && (

          <>

            {' '}

            Round <strong>{lobby.roundNumber}</strong>

          </>

        )}

        {isHost && <span className="host-badge"> — You are host</span>}

        {' '}

        — {readyCount} ready · {players.length}/{ARENA_MAX_PLAYERS} joined

      </p>



      {error && <p className="online-lobby-error">{error}</p>}

      {pairingSummary && (

        <p className="online-lobby-match-banner">{pairingSummary}</p>

      )}



      {isInMatchPhase && (

        <p className="online-lobby-match-banner">

          Round in progress — loading your match…

        </p>

      )}



      <ArenaRosterPanel

        players={players}

        myPlayerId={session.playerId}

        roundNumber={lobby?.roundNumber}

      />



      <div className="online-lobby-actions">

        {!isInMatchPhase && !myPlayer?.eliminated && (

          <button

            type="button"

            className={`primary-button ${isReady ? 'primary-button--outline' : ''}`}

            data-testid="ready-button"

            onClick={toggleReady}

            disabled={actionPending}

          >

            {isReady ? 'Cancel Ready' : 'Ready for Round'}

          </button>

        )}



        {canHostStart && (

          <button

            type="button"

            className="primary-button"

            data-testid="start-match-button"

            onClick={startRound}

            disabled={actionPending}

          >

            Start Round

          </button>

        )}



        {!isHost && canStartRound && !isInMatchPhase && (

          <p className="online-lobby-hint">

            Waiting for host to start the round ({readyCount} ready).

          </p>

        )}



        {!canStartRound && activeCount >= 2 && !isInMatchPhase && (

          <p className="online-lobby-hint">

            Need at least 2 ready active players to start a round.

          </p>

        )}



        {activeCount < 2 && (

          <p className="online-lobby-hint">

            Need at least 2 active players in the lobby.

          </p>

        )}

      </div>



      <div className="online-lobby-footer">

        <button

          type="button"

          className="secondary-button"

          onClick={onStartSoloRun}

        >

          Play Solo Run (offline)

        </button>

        <button type="button" className="secondary-button" onClick={onLeave}>

          Leave Lobby

        </button>

      </div>

    </section>

  )

}


