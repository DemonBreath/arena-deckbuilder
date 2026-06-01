import { useEffect, useState } from 'react'
import type { ArenaPhase } from '../game/arenaPhase'
import { getTurnDurationMs } from '../game/arenaPhase'
import {
  getTurnSecondsRemainingForPhase,
  TURN_WARNING_SECONDS,
} from '../game/pvpTimers'

interface PvpTurnTimerProps {
  turnStartAt: string | null
  isMyTurn: boolean
  battleActive: boolean
  arenaPhase?: ArenaPhase
}

export function PvpTurnTimer({
  turnStartAt,
  isMyTurn,
  battleActive,
  arenaPhase = 'normal',
}: PvpTurnTimerProps) {
  const turnDurationMs = getTurnDurationMs(arenaPhase)
  const [nowMs, setNowMs] = useState(Date.now())

  useEffect(() => {
    if (!battleActive || !turnStartAt) return
    const interval = window.setInterval(() => setNowMs(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [battleActive, turnStartAt])

  if (!battleActive || !turnStartAt) return null

  const secondsLeft = getTurnSecondsRemainingForPhase(
    turnStartAt,
    arenaPhase,
    nowMs,
  )
  if (secondsLeft === null) return null

  const urgent = secondsLeft > 0 && secondsLeft <= TURN_WARNING_SECONDS
  const expired = secondsLeft <= 0

  return (
    <div
      className={`pvp-turn-timer ${
        urgent ? 'pvp-turn-timer--urgent' : ''
      } ${expired ? 'pvp-turn-timer--expired' : ''}`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="pvp-turn-timer__label">
        {isMyTurn ? 'Your turn' : 'Opponent turn'}
      </span>
      <strong className="pvp-turn-timer__value">
        {expired ? '0:00' : formatCountdown(secondsLeft)}
      </strong>
      <span className="pvp-turn-timer__hint">
        {Math.round(turnDurationMs / 1000)}s limit
        {urgent && !expired && ` — ending in ${secondsLeft}s`}
      </span>
    </div>
  )
}

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
