interface OnlineErrorPanelProps {
  title?: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
}

export function OnlineErrorPanel({
  title = 'Something went wrong',
  message,
  onRetry,
  onDismiss,
}: OnlineErrorPanelProps) {
  return (
    <div className="online-error-panel" role="alert">
      <h2 className="online-error-panel__title">{title}</h2>
      <p className="online-error-panel__message">{message}</p>
      {(onRetry || onDismiss) && (
        <div className="online-error-panel__actions">
          {onRetry && (
            <button type="button" className="primary-button" onClick={onRetry}>
              Retry
            </button>
          )}
          {onDismiss && (
            <button type="button" className="secondary-button" onClick={onDismiss}>
              Go back
            </button>
          )}
        </div>
      )}
    </div>
  )
}
