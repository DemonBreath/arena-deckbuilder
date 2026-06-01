import { useCallback, useEffect, useState } from 'react'
import { ONLINE_SHOP_CARD_PRICE } from '../game/arenaConstants'
import { getClassShopPrice } from '../game/classDatabase'
import { sanitizePvpDeck } from '../game/pvpBattleState'
import { logOnlineError } from '../lib/onlineLog'
import {
  markPlayerShopDone,
  syncPlayerDeckToServer,
  tryAdvanceLobbyFromShop,
  updatePlayerGold,
} from '../services/arenaService'
import { fetchLobbyPlayer, subscribeToLobbyPlayers } from '../services/lobbyService'
import {
  loadOnlineRun,
  refreshShopOffers,
  saveOnlineRun,
  type OnlineRunState,
} from '../services/onlineRunService'
import type { OnlineLobbySession } from '../types/lobby'

export function useOnlineShop(session: OnlineLobbySession | null) {
  const [runState, setRunState] = useState<OnlineRunState | null>(null)
  const [serverGold, setServerGold] = useState(0)
  const [lastReward, setLastReward] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const shopPrice = session
    ? getClassShopPrice(session.classId, ONLINE_SHOP_CARD_PRICE)
    : ONLINE_SHOP_CARD_PRICE

  useEffect(() => {
    if (!session) {
      setRunState(null)
      return
    }

    const refreshGold = async () => {
      try {
        const player = await fetchLobbyPlayer(session.playerId)
        if (player) {
          setServerGold(player.gold)
          let local = loadOnlineRun(session.lobbyId, session.sessionId)
          if (player.deck && player.deck.length > 0) {
            local = { ...local, deck: player.deck }
            saveOnlineRun(session.lobbyId, session.sessionId, local)
          }
          if (player.relics.length > 0) {
            local = { ...local, relics: player.relics }
          }
          const withOffers = refreshShopOffers(local)
          setRunState(withOffers)
          setLastReward(withOffers.lastReward)
        } else {
          const local = refreshShopOffers(
            loadOnlineRun(session.lobbyId, session.sessionId),
          )
          setRunState(local)
          setLastReward(local.lastReward)
        }
      } catch (err) {
        logOnlineError('shop:refresh', err)
        const local = refreshShopOffers(
          loadOnlineRun(session.lobbyId, session.sessionId),
        )
        setRunState(local)
        setLastReward(local.lastReward)
      }
    }

    void refreshGold()

    const unsub = subscribeToLobbyPlayers(session.lobbyId, (players) => {
      const me = players.find((p) => p.id === session.playerId)
      if (me) setServerGold(me.gold)
    })

    return unsub
  }, [session])

  const buyCard = useCallback(
    async (offerIndex: number) => {
      if (!session || !runState || pending) return

      const cardId = runState.shopOffers[offerIndex]
      if (!cardId) return
      if (serverGold < shopPrice) return

      const nextGold = serverGold - shopPrice
      const nextDeck = sanitizePvpDeck([...runState.deck, cardId])
      const nextRun: OnlineRunState = {
        ...runState,
        deck: nextDeck,
      }

      setPending(true)
      setError(null)

      try {
        await updatePlayerGold(session.playerId, nextGold)
        await syncPlayerDeckToServer(
          session.playerId,
          nextDeck,
          nextRun.relics,
        )
        setServerGold(nextGold)
        setRunState(nextRun)
        saveOnlineRun(session.lobbyId, session.sessionId, nextRun)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Purchase failed.')
      } finally {
        setPending(false)
      }
    },
    [session, runState, serverGold, pending, shopPrice],
  )

  const continueToArena = useCallback(async () => {
    if (!session || !runState || pending) return

    setPending(true)
    setError(null)

    try {
      await syncPlayerDeckToServer(
        session.playerId,
        sanitizePvpDeck(runState.deck),
        runState.relics,
      )
      await markPlayerShopDone(session.playerId)
      await tryAdvanceLobbyFromShop(session.lobbyId)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to continue to arena.',
      )
    } finally {
      setPending(false)
    }
  }, [session, runState, pending])

  return {
    runState,
    serverGold,
    lastReward,
    shopPrice,
    error,
    pending,
    buyCard,
    continueToArena,
  }
}
