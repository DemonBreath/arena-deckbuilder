import { useConnectionStatus } from './useConnectionStatus'
import { usePlayerPresence } from './usePlayerPresence'

export function useOnlineConnectivity(
  playerId: string | null | undefined,
  lobbyId: string | null | undefined,
) {
  usePlayerPresence(playerId)
  const connectionStatus = useConnectionStatus(lobbyId)
  return { connectionStatus }
}
