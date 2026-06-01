import { useEffect, useState } from 'react'
import {
  isOpponentLikelyDisconnected,
  isTurnEndingSoon,
} from '../game/pvpTimers'

interface PvpTimerWarningsProps {
  turnStartAt: string | null
  isMyTurn: boolean
  battleActive: boolean
  opponentLastSeenAt: string | null
  opponentName: string
}

export function PvpTimerWarnings({
  turnStartAt,
  isMyTurn,
  battleActive,
  opponentLastSeenAt,
  opponentName,
}: PvpTimerWarningsProps) {
  const [nowMs, setNowMs] = useState(Date.now())

  useEffect(() => {
    if (!battleActive) return
    const interval = window.setInterval(() => setNowMs(Date.now()), 500)
    return () => window.clearInterval(interval)
  }, [battleActive])

  if (!battleActive) return null

  const turnEndingSoon = isMyTurn && isTurnEndingSoon(turnStartAt, nowMs)
  const opponentDisconnected = isOpponentLikelyDisconnected(
    opponentLastSeenAt,
    nowMs,
  )

  if (!turnEndingSoon && !opponentDisconnected) return null

  return (
    <div className="pvp-timer-warnings">
      {turnEndingSoon && (
        <p className="pvp-timer-warning pvp-timer-warning--turn" role="status">
          Turn ending soon
        </p>
      )}
      {opponentDisconnected && (
        <p
          className="pvp-timer-warning pvp-timer-warning--disconnect"
          role="status"
        >
          Opponent disconnected… ({opponentName} — forfeit after 90s)
        </p>
      )}
    </div>
  )
}
