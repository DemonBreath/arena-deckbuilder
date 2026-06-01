import type { ConnectionStatus } from '../hooks/useConnectionStatus'

interface ConnectionStatusBannerProps {
  status: ConnectionStatus
}

function labelForStatus(status: ConnectionStatus): string {
  switch (status) {
    case 'connected':
      return 'Connected'
    case 'reconnecting':
      return 'Reconnecting…'
    case 'disconnected':
      return 'Disconnected'
    default:
      return 'Disconnected'
  }
}

export function ConnectionStatusBanner({ status }: ConnectionStatusBannerProps) {
  return (
    <div
      className={`connection-status-banner connection-status-banner--${status}`}
      role="status"
      aria-live="polite"
    >
      <span className="connection-status-banner__dot" aria-hidden />
      <span>{labelForStatus(status)}</span>
    </div>
  )
}
