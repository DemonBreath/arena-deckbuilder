import { useCallback, useEffect, useRef, useState } from 'react'
import { getRelic, type RelicId } from '../game/relicDatabase'
import {
  buildChampionSubmission,
  submitChampionPublic,
} from '../services/championService'
import { useOnlineRunStatus } from '../hooks/useOnlineRunStatus'
import { fetchLobbyPlayer } from '../services/lobbyService'
import { loadOnlineRun } from '../services/onlineRunService'
import type { OnlineLobbySession } from '../types/lobby'
import { PvpRunStatusHeader } from './PvpRunStatusHeader'

interface OnlineChampionViewProps {
  session: OnlineLobbySession
  onLeave: () => void
  onViewChampions: () => void
}

export function OnlineChampionView({
  session,
  onLeave,
  onViewChampions,
}: OnlineChampionViewProps) {
  const [opponentsDefeated, setOpponentsDefeated] = useState(0)
  const [gold, setGold] = useState(0)
  const [deckSize, setDeckSize] = useState(0)
  const [relics, setRelics] = useState<RelicId[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const submitAttemptedRef = useRef(false)
  const runStatus = useOnlineRunStatus(session)

  useEffect(() => {
    const load = async () => {
      const player = await fetchLobbyPlayer(session.playerId)
      if (player) {
        setOpponentsDefeated(player.opponentsDefeated)
        setGold(player.gold)
      }
      const local = loadOnlineRun(session.lobbyId, session.sessionId)
      setDeckSize(local.deck.length)
      setRelics(local.relics)
    }
    void load()
  }, [session])

  const handleSubmit = useCallback(async () => {
    if (submitted || submitting || submitAttemptedRef.current) return

    submitAttemptedRef.current = true
    setSubmitting(true)
    setSubmitError(null)
    setSubmitMessage(null)

    const result = await submitChampionPublic(
      buildChampionSubmission(
        session.championName,
        session.lobbyCode,
        opponentsDefeated,
        relics.length,
        deckSize,
        gold,
      ),
    )

    setSubmitting(false)

    if (result.success) {
      setSubmitted(true)
      const sourceNote =
        result.source === 'supabase'
          ? 'on the public leaderboard.'
          : 'locally in your browser.'
      setSubmitMessage(
        result.error
          ? `Submitted ${sourceNote} ${result.error}`
          : `Submitted to Daily Champions ${sourceNote}`,
      )
    } else {
      submitAttemptedRef.current = false
      setSubmitError(result.error ?? 'Failed to submit champion.')
    }
  }, [
    submitted,
    submitting,
    session,
    opponentsDefeated,
    relics.length,
    deckSize,
    gold,
  ])

  return (
    <section className="screen victory-screen online-champion-screen">
      {runStatus && (
        <PvpRunStatusHeader status={runStatus} title="Champion Crowned" />
      )}

      <p className="victory-champion-name">{session.championName}</p>
      <p className="victory-tagline">
        Last fighter standing in the arena.
      </p>

      <div className="game-over-stats">
        <div className="game-over-stat">
          <span className="game-over-stat__label">Lobby code</span>
          <strong className="game-over-stat__value">{session.lobbyCode}</strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Opponents defeated</span>
          <strong className="game-over-stat__value">{opponentsDefeated}</strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Final deck size</span>
          <strong className="game-over-stat__value">{deckSize}</strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Relic count</span>
          <strong className="game-over-stat__value">{relics.length}</strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Total gold earned</span>
          <strong className="game-over-stat__value">{gold}</strong>
        </div>
      </div>

      {relics.length > 0 && (
        <section className="game-over-relics">
          <h2>Relics owned ({relics.length})</h2>
          <ul className="game-over-relics__list">
            {relics.map((relicId) => {
              const relic = getRelic(relicId)
              return (
                <li key={relicId}>
                  <strong>{relic.name}</strong> — {relic.description}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {submitted ? (
        <p className="victory-submitted">{submitMessage}</p>
      ) : (
        <button
          type="button"
          className="primary-button"
          disabled={submitting}
          onClick={() => void handleSubmit()}
        >
          {submitting ? 'Submitting…' : 'Submit to Daily Champions'}
        </button>
      )}

      {submitError && (
        <p className="online-lobby-error">{submitError}</p>
      )}

      <div className="victory-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onViewChampions}
        >
          View Daily Champions
        </button>
        <button type="button" className="secondary-button" onClick={onLeave}>
          Leave Lobby
        </button>
      </div>
    </section>
  )
}
