import { PRESENCE_STALE_MS } from '../game/pvpTimers'
import type { LobbyPlayer } from '../types/lobby'

export { PRESENCE_STALE_MS }
export const PRESENCE_HEARTBEAT_MS = 12_000

export function isPlayerDisconnected(
  player: LobbyPlayer,
  now = Date.now(),
): boolean {
  if (!player.lastSeenAt) return false
  const seen = new Date(player.lastSeenAt).getTime()
  if (Number.isNaN(seen)) return false
  return now - seen > PRESENCE_STALE_MS
}

export function getRosterStatusLabel(player: LobbyPlayer): string {
  if (player.eliminated) return 'Eliminated'
  if (isPlayerDisconnected(player)) return 'Disconnected'
  if (player.readyState === 'ready') return 'Ready'
  return 'Active'
}

export function getRosterStatusClass(player: LobbyPlayer): string {
  if (player.eliminated) return 'eliminated'
  if (isPlayerDisconnected(player)) return 'disconnected'
  if (player.readyState === 'ready') return 'ready'
  return 'active'
}
