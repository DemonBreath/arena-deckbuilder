/** PvP turn / match timer constants (Milestone 15). */

export const TURN_DURATION_MS = 60_000
export const TURN_WARNING_SECONDS = 10
export const MATCH_TIMEOUT_MS = 20 * 60 * 1000
/** Lobby roster “disconnected” hint (M14). */
export const PRESENCE_STALE_MS = 35_000
/** Forfeit if no heartbeat during an active match. */
export const MATCH_DISCONNECT_FORFEIT_MS = 90_000
/** How often clients poll server timer enforcement. */
export const TIMER_POLL_MS = 2_500

export function getTurnSecondsRemaining(
  turnStartAt: string | null,
  nowMs = Date.now(),
): number | null {
  if (!turnStartAt) return null
  const start = new Date(turnStartAt).getTime()
  if (Number.isNaN(start)) return null
  const elapsed = nowMs - start
  return Math.max(0, Math.ceil((TURN_DURATION_MS - elapsed) / 1000))
}

export function isTurnEndingSoon(
  turnStartAt: string | null,
  nowMs = Date.now(),
): boolean {
  const remaining = getTurnSecondsRemaining(turnStartAt, nowMs)
  if (remaining === null) return false
  return remaining > 0 && remaining <= TURN_WARNING_SECONDS
}

export function isTurnExpired(
  turnStartAt: string | null,
  nowMs = Date.now(),
): boolean {
  const remaining = getTurnSecondsRemaining(turnStartAt, nowMs)
  if (remaining === null) return false
  return remaining <= 0
}

export function isMatchTimedOut(
  battleStartedAt: string | null,
  nowMs = Date.now(),
): boolean {
  if (!battleStartedAt) return false
  const start = new Date(battleStartedAt).getTime()
  if (Number.isNaN(start)) return false
  return nowMs - start >= MATCH_TIMEOUT_MS
}

export function isMatchPlayerDisconnected(
  lastSeenAt: string | null,
  nowMs = Date.now(),
): boolean {
  if (!lastSeenAt) return false
  const seen = new Date(lastSeenAt).getTime()
  if (Number.isNaN(seen)) return false
  return nowMs - seen > MATCH_DISCONNECT_FORFEIT_MS
}

export function isOpponentLikelyDisconnected(
  lastSeenAt: string | null,
  nowMs = Date.now(),
): boolean {
  if (!lastSeenAt) return false
  const seen = new Date(lastSeenAt).getTime()
  if (Number.isNaN(seen)) return false
  return nowMs - seen > PRESENCE_STALE_MS
}
