import {
  formatArenaPhaseLabel,
  getArenaPhaseConfig,
  type ArenaPhase,
} from '../game/arenaPhase'

interface ArenaPhaseBannerProps {
  phase: ArenaPhase
  activePlayersRemaining: number
  /** e.g. "Series 1–0 (first to 2)" during final duel */
  finalDuelSeriesLabel?: string | null
  compact?: boolean
}

export function ArenaPhaseBanner({
  phase,
  activePlayersRemaining,
  finalDuelSeriesLabel,
  compact = false,
}: ArenaPhaseBannerProps) {
  const config = getArenaPhaseConfig(phase)

  return (
    <div
      className={`arena-phase-banner arena-phase-banner--${config.severity} ${
        compact ? 'arena-phase-banner--compact' : ''
      }`}
      role="status"
    >
      <div className="arena-phase-banner__header">
        <span className="arena-phase-banner__phase">
          {formatArenaPhaseLabel(phase)}
        </span>
        <span className="arena-phase-banner__count">
          {activePlayersRemaining} fighter
          {activePlayersRemaining === 1 ? '' : 's'} remaining
        </span>
      </div>
      {!compact && (
        <p className="arena-phase-banner__description">{config.description}</p>
      )}
      {config.warningMessage && (
        <p className="arena-phase-banner__warning">{config.warningMessage}</p>
      )}
      {finalDuelSeriesLabel && (
        <p className="arena-phase-banner__series">{finalDuelSeriesLabel}</p>
      )}
    </div>
  )
}
