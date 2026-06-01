import { useEffect, useState } from 'react'
import { ARENA_MAX_PLAYERS } from '../game/arenaConstants'
import { getLobbyDisplayStatus } from '../lib/lobbyDisplay'
import { buildLobbyInviteUrl } from '../lib/lobbyRouting'
import { fetchLobbyByCode, fetchLobbyPlayers } from '../services/lobbyService'
import type { Lobby } from '../types/lobby'
import { LobbyStatusBadge } from './LobbyStatusBadge'
import { RejoinPrompt } from './RejoinPrompt'
import type { PersistedOnlineSession } from '../services/persistedSessionService'

interface LobbyInviteJoinViewProps {
  lobbyCode: string
  championName: string
  onChampionNameChange: (name: string) => void
  onJoin: () => void
  onBackToHome: () => void
  joining: boolean
  joinError: string | null
  canJoin: boolean
  pendingRejoin: PersistedOnlineSession | null
  rejoining: boolean
  rejoinError: string | null
  onRejoin: () => void
  onStartFresh: () => void
}

export function LobbyInviteJoinView({
  lobbyCode,
  championName,
  onChampionNameChange,
  onJoin,
  onBackToHome,
  joining,
  joinError,
  canJoin,
  pendingRejoin,
  rejoining,
  rejoinError,
  onRejoin,
  onStartFresh,
}: LobbyInviteJoinViewProps) {
  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [playerCount, setPlayerCount] = useState(0)
  const [loadingLobby, setLoadingLobby] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoadingLobby(true)
      try {
        const lobbyData = await fetchLobbyByCode(lobbyCode)
        setLobby(lobbyData)
        if (lobbyData) {
          const players = await fetchLobbyPlayers(lobbyData.id)
          setPlayerCount(players.length)
        } else {
          setPlayerCount(0)
        }
      } catch {
        setLobby(null)
        setPlayerCount(0)
      } finally {
        setLoadingLobby(false)
      }
    }
    void load()
  }, [lobbyCode])

  const displayStatus = getLobbyDisplayStatus(lobby)
  const isClosed = displayStatus === 'closed'
  const isFull = lobby !== null && playerCount >= ARENA_MAX_PLAYERS
  const inviteUrl = buildLobbyInviteUrl(lobbyCode)

  return (
    <section className="screen lobby-invite-screen">
      <h1>Join Arena Lobby</h1>
      <p className="lobby-invite-screen__tagline">
        You were invited to lobby <strong>{lobbyCode}</strong>. No account
        needed — enter a champion name and join.
      </p>

      <LobbyStatusBadge lobby={lobby} />

      {loadingLobby && (
        <p className="lobby-invite-screen__hint">Checking lobby…</p>
      )}

      {!loadingLobby && isClosed && (
        <p className="online-lobby-error">
          This lobby is closed or does not exist. Ask your friend for a new
          invite link.
        </p>
      )}

      {!loadingLobby && !isClosed && isFull && (
        <p className="online-lobby-error">Lobby Full.</p>
      )}

      {!loadingLobby && !isClosed && !isFull && (
        <>
          <p className="lobby-invite-screen__meta">
            {playerCount} / {ARENA_MAX_PLAYERS} players joined
          </p>

          {pendingRejoin &&
            pendingRejoin.lobbyCode === lobbyCode && (
              <RejoinPrompt
                persisted={pendingRejoin}
                rejoining={rejoining}
                error={rejoinError}
                onRejoin={onRejoin}
                onStartFresh={onStartFresh}
              />
            )}

          <label className="champion-name-field">
            <span>Champion Name</span>
            <input
              type="text"
              className="champion-name-input"
              placeholder="Enter your champion name"
              value={championName}
              maxLength={20}
              onChange={(e) => onChampionNameChange(e.target.value)}
            />
          </label>

          {joinError && <p className="online-lobby-error">{joinError}</p>}

          <button
            type="button"
            className="primary-button"
            disabled={!canJoin || joining || rejoining}
            onClick={onJoin}
          >
            {joining ? 'Joining…' : 'Join Lobby'}
          </button>
        </>
      )}

      <p className="lobby-invite-screen__url-hint">
        Invite link: <code className="lobby-invite-url">{inviteUrl}</code>
      </p>

      <button type="button" className="secondary-button" onClick={onBackToHome}>
        Back to Home
      </button>
    </section>
  )
}
