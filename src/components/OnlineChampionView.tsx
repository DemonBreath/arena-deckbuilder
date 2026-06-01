import { useCallback, useEffect, useRef, useState } from 'react'
import { getClassDefinition } from '../game/classDatabase'
import { resolveClassIdentity, createClassIdentity } from '../game/classIdentity'
import { getEvolutionDefinition } from '../game/classEvolutions'
import { getRelic, type RelicId } from '../game/relicDatabase'
import {
  buildChampionSubmission,
  submitChampionPublic,
} from '../services/championService'
import { useOnlineRunStatus } from '../hooks/useOnlineRunStatus'
import {
  countDraftStacks,
  getArenaDraftDefinition,
} from '../game/arenaDrafts'
import { fetchLobby, fetchLobbyPlayer } from '../services/lobbyService'
import type { ArenaDraftId } from '../game/arenaDrafts'
import { loadOnlineRun } from '../services/onlineRunService'
import {
  computeRivalRunStats,
  getRivalSummariesForChampion,
  getRivalsOvercome,
} from '../game/rivalIntel'
import type { RivalHistoryMap } from '../types/rivals'
import type { OnlineLobbySession } from '../types/lobby'
import { PvpRunStatusHeader } from './PvpRunStatusHeader'
import { RivalHistoryPanel } from './RivalHistoryPanel'

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
  const [baseClassName, setBaseClassName] = useState('')
  const [evolvedClassName, setEvolvedClassName] = useState<string | null>(null)
  const [draftHistory, setDraftHistory] = useState<ArenaDraftId[]>([])
  const [rivalHistory, setRivalHistory] = useState<RivalHistoryMap>({})
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
        setRivalHistory(player.rivalHistory)
        const base = getClassDefinition(player.classId)
        setBaseClassName(base.name)
      }
      const lobbyRow = await fetchLobby(session.lobbyId)
      if (lobbyRow) {
        setDraftHistory(lobbyRow.draftHistory)
      }

      const local = loadOnlineRun(session.lobbyId, session.sessionId)
      setDeckSize(local.deck.length)
      setRelics(local.relics)

      if (local.evolutionId) {
        const evo = getEvolutionDefinition(local.evolutionId)
        setEvolvedClassName(evo.name)
      } else {
        const profile = resolveClassIdentity(
          createClassIdentity(session.classId, null),
        )
        setEvolvedClassName(null)
        setBaseClassName(profile.baseName)
      }
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

  const displayTitle = evolvedClassName
    ? `${baseClassName} · ${evolvedClassName}`
    : baseClassName

  const rivalRunStats = computeRivalRunStats(rivalHistory)
  const rivalsOvercome = getRivalsOvercome(rivalHistory)
  const allRivalSummaries = getRivalSummariesForChampion(rivalHistory)

  return (
    <section className="screen victory-screen online-champion-screen">
      {runStatus && (
        <PvpRunStatusHeader status={runStatus} title="Champion Crowned" />
      )}

      <p className="victory-champion-name">{session.championName}</p>
      <p className="victory-tagline">
        Arena Champion — victorious in the Final Duel.
      </p>
      <p className="online-champion-class-title">{displayTitle}</p>

      <div className="game-over-stats">
        <div className="game-over-stat">
          <span className="game-over-stat__label">Champion</span>
          <strong className="game-over-stat__value">{session.championName}</strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Base class</span>
          <strong className="game-over-stat__value">{baseClassName}</strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Evolved class</span>
          <strong className="game-over-stat__value">
            {evolvedClassName ?? '—'}
          </strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Opponents defeated</span>
          <strong className="game-over-stat__value">{opponentsDefeated}</strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Rivals defeated</span>
          <strong className="game-over-stat__value">
            {rivalRunStats.rivalsDefeated}
          </strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Rival losses</span>
          <strong className="game-over-stat__value">
            {rivalRunStats.rivalLosses}
          </strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Longest rivalry</span>
          <strong className="game-over-stat__value">
            {rivalRunStats.longestRivalryMatches > 0
              ? `${rivalRunStats.longestRivalryMatches} matches`
              : '—'}
          </strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Final deck size</span>
          <strong className="game-over-stat__value">{deckSize}</strong>
        </div>
        <div className="game-over-stat">
          <span className="game-over-stat__label">Lobby code</span>
          <strong className="game-over-stat__value">{session.lobbyCode}</strong>
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

      {rivalsOvercome.length > 0 && (
        <RivalHistoryPanel
          history={rivalHistory}
          overcomeOnly
          summaries={rivalsOvercome}
          title="Rivals overcome"
        />
      )}

      {allRivalSummaries.length > 0 && (
        <RivalHistoryPanel
          history={rivalHistory}
          summaries={allRivalSummaries}
          title="Final rival records"
        />
      )}

      {draftHistory.length > 0 && (
        <section className="game-over-relics online-champion-drafts">
          <h2>Arena Drafts this run ({draftHistory.length})</h2>
          <ol className="online-champion-drafts__list">
            {draftHistory.map((draftId, index) => {
              const def = getArenaDraftDefinition(draftId)
              return (
                <li key={`${draftId}-${index}`}>
                  <strong>
                    Round pick {index + 1}: {def.name}
                  </strong>{' '}
                  — {def.description}
                </li>
              )
            })}
          </ol>
          <p className="online-champion-drafts__stacks">
            Active stacks:{' '}
            {countDraftStacks(draftHistory)
              .map(
                ({ definition, count }) =>
                  count > 1
                    ? `${definition.name} ×${count}`
                    : definition.name,
              )
              .join(' · ')}
          </p>
        </section>
      )}

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
