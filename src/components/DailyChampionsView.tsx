import { useEffect, useState } from 'react'
import {
  fetchAllTimeChampions,
  fetchDailyChampions,
  getTodayDateLabel,
  isLeaderboardOnline,
  type ChampionEntry,
} from '../services/championService'

interface DailyChampionsViewProps {
  onBack: () => void
}

function ChampionList({
  entries,
  emptyMessage,
  loading,
}: {
  entries: ChampionEntry[]
  emptyMessage: string
  loading: boolean
}) {
  if (loading) {
    return <p className="champions-empty">Loading champions…</p>
  }

  if (entries.length === 0) {
    return <p className="champions-empty">{emptyMessage}</p>
  }

  return (
    <ul className="champions-list">
      {entries.map((entry) => (
        <li key={entry.id} className="champion-entry">
          <div className="champion-entry__header">
            <strong className="champion-entry__name">{entry.championName}</strong>
            <span className="champion-entry__date">{entry.date}</span>
          </div>
          <p className="champion-entry__lobby">
            Lobby <strong>{entry.lobbyCode}</strong>
          </p>
          <div className="champion-entry__stats">
            <span>Defeated {entry.opponentsDefeated} opponents</span>
            <span>{entry.relicCount} relics</span>
            <span>Deck {entry.finalDeckSize}</span>
            <span>{entry.totalGoldEarned} gold</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function DailyChampionsView({ onBack }: DailyChampionsViewProps) {
  const today = getTodayDateLabel()
  const online = isLeaderboardOnline()

  const [dailyChampions, setDailyChampions] = useState<ChampionEntry[]>([])
  const [allTimeChampions, setAllTimeChampions] = useState<ChampionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const [daily, allTime] = await Promise.all([
          fetchDailyChampions(today),
          fetchAllTimeChampions(),
        ])
        if (!cancelled) {
          setDailyChampions(daily)
          setAllTimeChampions(allTime)
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load champions.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [today])

  return (
    <section className="screen champions-screen">
      <header className="champions-screen__header">
        <h1>Daily Champions</h1>
        <p className="champions-screen__tagline">
          {online
            ? 'Public leaderboard — no login required. Newest entries first.'
            : 'Offline mode — champions saved locally in your browser.'}
        </p>
      </header>

      {loadError && <p className="online-lobby-error">{loadError}</p>}

      <section className="champions-section">
        <h2>Today&apos;s Champions ({today})</h2>
        <ChampionList
          entries={dailyChampions}
          loading={loading}
          emptyMessage="No champions crowned today yet. Win a full PvP arena lobby to claim the board!"
        />
      </section>

      <section className="champions-section">
        <h2>All-Time Champions</h2>
        <ChampionList
          entries={allTimeChampions}
          loading={loading}
          emptyMessage="No champions in the hall of fame yet."
        />
      </section>

      <button type="button" className="primary-button" onClick={onBack}>
        Back to Title
      </button>
    </section>
  )
}
