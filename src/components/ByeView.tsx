import { useOnlineRunStatus } from '../hooks/useOnlineRunStatus'
import type { OnlineLobbySession } from '../types/lobby'
import { PvpRunStatusHeader } from './PvpRunStatusHeader'

interface ByeViewProps {
  session: OnlineLobbySession
  onBackToLobby: () => void
}

export function ByeView({ session, onBackToLobby }: ByeViewProps) {
  const runStatus = useOnlineRunStatus(session)

  return (
    <section className="screen bye-screen">
      {runStatus && <PvpRunStatusHeader status={runStatus} title="Bye Round" />}

      <p className="bye-tagline">
        Odd number of ready players — you skip this round&apos;s battle and earn
        bye gold.
      </p>
      <p className="bye-hint">
        Wait for other matches to finish, then you&apos;ll enter the shop with
        everyone else.
      </p>
      <button
        type="button"
        className="primary-button primary-button--large"
        onClick={onBackToLobby}
      >
        Back to Lobby
      </button>
    </section>
  )
}
