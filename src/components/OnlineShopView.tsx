import { useEffect, useState } from 'react'
import { useOnlineShop } from '../hooks/useOnlineShop'
import {
  fetchLobby,
  fetchLobbyPlayers,
  subscribeToLobby,
  subscribeToLobbyPlayers,
} from '../services/lobbyService'
import type { Lobby, LobbyPlayer, OnlineLobbySession } from '../types/lobby'
import { useOnlineConnectivity } from '../hooks/useOnlineConnectivity'
import { useOnlineRunStatus } from '../hooks/useOnlineRunStatus'
import { ArenaRosterPanel } from './ArenaRosterPanel'
import { ConnectionStatusBanner } from './ConnectionStatusBanner'
import { CardButton } from './CardButton'
import { PvpRunStatusHeader } from './PvpRunStatusHeader'
import { RelicsPanel } from './RelicsPanel'

interface OnlineShopViewProps {
  session: OnlineLobbySession
  onContinue: () => void
}

export function OnlineShopView({ session, onContinue }: OnlineShopViewProps) {
  const {
    runState,
    serverGold,
    lastReward,
    shopPrice,
    error,
    pending,
    buyCard,
    continueToArena,
  } = useOnlineShop(session)

  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [players, setPlayers] = useState<LobbyPlayer[]>([])
  const [shopDone, setShopDone] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [lobbyData, playerData] = await Promise.all([
        fetchLobby(session.lobbyId),
        fetchLobbyPlayers(session.lobbyId),
      ])
      setLobby(lobbyData)
      setPlayers(playerData)
      const me = playerData.find((p) => p.id === session.playerId)
      setShopDone(Boolean(me?.shopDone))
    }
    void load()

    const unsubLobby = subscribeToLobby(session.lobbyId, setLobby)
    const unsubPlayers = subscribeToLobbyPlayers(session.lobbyId, (next) => {
      setPlayers(next)
      const me = next.find((p) => p.id === session.playerId)
      setShopDone(Boolean(me?.shopDone))
      if (lobby?.status === 'waiting' && me?.shopDone) {
        onContinue()
      }
    })

    return () => {
      unsubLobby()
      unsubPlayers()
    }
  }, [session, lobby?.status, onContinue])

  useEffect(() => {
    if (lobby?.status === 'waiting' && shopDone) {
      onContinue()
    }
  }, [lobby?.status, shopDone, onContinue])

  if (!runState) {
    return (
      <section className="screen online-shop-screen">
        <p>Loading shop…</p>
      </section>
    )
  }

  const waitingCount = players.filter((p) => !p.eliminated && p.shopDone).length
  const activeCount = players.filter((p) => !p.eliminated).length
  const runStatus = useOnlineRunStatus(session)
  const { connectionStatus } = useOnlineConnectivity(
    session.playerId,
    session.lobbyId,
  )

  return (
    <section className="screen online-shop-screen">
      <ConnectionStatusBanner status={connectionStatus} />
      {runStatus && (
        <PvpRunStatusHeader
          status={runStatus}
          title={`Shop — Round ${lobby?.roundNumber ?? '…'}`}
        />
      )}

      <p className="online-shop-reward">
        Last battle: +{lastReward} gold — Total gold: <strong>{serverGold}</strong>
      </p>

      <p className="deck-size">Deck size: {runState.deck.length} cards (saved locally)</p>

      <RelicsPanel relics={runState.relics} />

      <ArenaRosterPanel
        players={players}
        myPlayerId={session.playerId}
        roundNumber={lobby?.roundNumber}
      />

      <div className="shop-offers">
        <h3>Card Offers — {shopPrice} gold each</h3>
        <div className="shop-offers__grid">
          {runState.shopOffers.map((cardId, index) => (
            <CardButton
              key={`${cardId}-${index}`}
              cardId={cardId}
              variant="shop"
              showPrice
              price={shopPrice}
              disabled={serverGold < shopPrice || pending || shopDone}
              onClick={() => void buyCard(index)}
            />
          ))}
        </div>
      </div>

      {error && <p className="online-lobby-error">{error}</p>}

      {shopDone ? (
        <p className="online-shop-waiting">
          Waiting for other players ({waitingCount}/{activeCount} done)…
        </p>
      ) : (
        <button
          type="button"
          className="primary-button primary-button--large"
          disabled={pending}
          onClick={() => void continueToArena()}
        >
          Continue to Arena
        </button>
      )}
    </section>
  )
}
