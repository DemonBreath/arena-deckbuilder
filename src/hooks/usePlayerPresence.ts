import { useEffect } from 'react'
import { PRESENCE_HEARTBEAT_MS } from '../lib/playerPresence'
import { touchPlayerPresence } from '../services/lobbyService'

export function usePlayerPresence(playerId: string | null | undefined): void {
  useEffect(() => {
    if (!playerId) return

    const send = () => {
      void touchPlayerPresence(playerId)
    }

    send()
    const interval = window.setInterval(send, PRESENCE_HEARTBEAT_MS)
    return () => window.clearInterval(interval)
  }, [playerId])
}
