interface SyncDebugPanelProps {
  localStateJson: string | null
  remoteStateJson: string | null
  stateVersion: number
}

export function SyncDebugPanel({
  localStateJson,
  remoteStateJson,
  stateVersion,
}: SyncDebugPanelProps) {
  return (
    <details className="sync-debug-panel">
      <summary>Developer sync panel</summary>
      <p className="sync-debug-panel__version">
        Match state version: <strong>{stateVersion}</strong>
      </p>
      <div className="sync-debug-panel__columns">
        <div className="sync-debug-panel__column">
          <h4>Local state (preview / last action)</h4>
          <pre className="sync-debug-panel__pre">
            {localStateJson ?? '(none — matches remote after sync)'}
          </pre>
        </div>
        <div className="sync-debug-panel__column">
          <h4>Remote state (authoritative)</h4>
          <pre className="sync-debug-panel__pre">
            {remoteStateJson ?? '(waiting for battle…)'}
          </pre>
        </div>
      </div>
    </details>
  )
}
