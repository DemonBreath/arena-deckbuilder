import {
  computeRivalRunStats,
  formatRivalRecordLine,
} from '../game/rivalIntel'
import type { RivalChampionSummary, RivalHistoryMap } from '../types/rivals'

interface RivalHistoryPanelProps {
  history: RivalHistoryMap
  /** When true, only show rivals you overcame (champion screen). */
  overcomeOnly?: boolean
  summaries?: RivalChampionSummary[]
  title?: string
}

export function RivalHistoryPanel({
  history,
  overcomeOnly = false,
  summaries,
  title = 'Rival history',
}: RivalHistoryPanelProps) {
  const runStats = computeRivalRunStats(history)
  const entries =
    summaries ??
    Object.values(history)
      .filter((r) => r.isRival && r.wins + r.losses > 0)
      .filter((r) =>
        overcomeOnly ? r.wins > r.losses || r.youEliminatedThem : true,
      )
      .sort((a, b) => b.wins + b.losses - (a.wins + a.losses))
      .map((record) => ({
        opponentName: record.opponentName,
        wins: record.wins,
        losses: record.losses,
        recordLine: formatRivalRecordLine(record.wins, record.losses),
        youEliminatedThem: record.youEliminatedThem,
        eliminatedYou: record.eliminatedYou,
      }))

  if (entries.length === 0 && runStats.longestRivalryMatches === 0) {
    return (
      <section className="rival-history-panel rival-history-panel--empty">
        <h3>{title}</h3>
        <p className="rival-history-panel__empty">
          No rivalries yet — defeat the same fighter twice, or lose to them once.
        </p>
      </section>
    )
  }

  return (
    <section className="rival-history-panel">
      <h3>{title}</h3>

      <ul className="rival-history-panel__run-stats">
        <li>
          <span>Rivals defeated</span>
          <strong>{runStats.rivalsDefeated}</strong>
        </li>
        <li>
          <span>Rival losses</span>
          <strong>{runStats.rivalLosses}</strong>
        </li>
        <li>
          <span>Longest rivalry</span>
          <strong>
            {runStats.longestRivalryMatches > 0
              ? `${runStats.longestRivalryMatches} matches${
                  runStats.longestRivalryOpponentName
                    ? ` vs ${runStats.longestRivalryOpponentName}`
                    : ''
                }`
              : '—'}
          </strong>
        </li>
      </ul>

      {entries.length > 0 && (
        <ol className="rival-history-panel__list">
          {entries.map((entry) => (
            <li key={entry.opponentName} className="rival-history-panel__item">
              <div className="rival-history-panel__item-header">
                <strong>{entry.opponentName}</strong>
                <span className="rival-history-panel__record">
                  {entry.recordLine}
                </span>
              </div>
              <p className="rival-history-panel__item-meta">
                {entry.youEliminatedThem && (
                  <span>You eliminated them · </span>
                )}
                {entry.eliminatedYou && <span>They eliminated you · </span>}
                Record is wins–losses from your perspective
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
