import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildSpectatorBattleView,
  type SpectatorBattleView,
} from '../game/pvpBattleState'
import { TIMER_POLL_MS } from '../game/pvpTimers'
import { fetchMatch, subscribeToMatch } from '../services/matchService'
import { processMatchTimers } from '../services/pvpTimerService'

export function useSpectatorMatch(matchId: string | null) {
  const [match, setMatch] = useState<Awaited<ReturnType<typeof fetchMatch>>>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const timerRunningRef = useRef(false)

  useEffect(() => {
    if (!matchId) {
      setMatch(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const load = async () => {
      try {
        const data = await fetchMatch(matchId)
        setMatch(data)
        if (!data) setError('Match not found.')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load match.')
      } finally {
        setLoading(false)
      }
    }

    void load()

    const unsub = subscribeToMatch(matchId, (next) => {
      setMatch(next)
      if (!next) setError('Match ended or unavailable.')
    })

    return unsub
  }, [matchId])

  useEffect(() => {
    if (!matchId || !match) return
    if (match.status !== 'active' || !match.battleState) return

    const tick = async () => {
      if (timerRunningRef.current) return
      timerRunningRef.current = true
      try {
        const updated = await processMatchTimers(matchId)
        if (updated) setMatch(updated)
      } catch {
        /* ignore */
      } finally {
        timerRunningRef.current = false
      }
    }

    void tick()
    const interval = window.setInterval(() => void tick(), TIMER_POLL_MS)
    return () => window.clearInterval(interval)
  }, [matchId, match?.status, match?.battleState?.version])

  const battleView = useMemo((): SpectatorBattleView | null => {
    if (!match?.battleState) return null
    return buildSpectatorBattleView(match.battleState)
  }, [match?.battleState, match?.stateVersion])

  return {
    match,
    battleView,
    loading,
    error,
    stateVersion: match?.stateVersion ?? match?.battleState?.version ?? 0,
    turnStartAt: match?.turnStartAt ?? null,
  }
}
