import { useCallback, useEffect, useState } from 'react'
import { buildPvpMatchSummary } from '../game/pvpBattleState'
import { useOnlineRunStatus } from '../hooks/useOnlineRunStatus'
import { logOnlineError } from '../lib/onlineLog'
import {
  syncPlayerDeckToServer,
  updatePlayerGold,
} from '../services/arenaService'
import {
  fetchLobbyPlayer,
  subscribeToLobbyPlayers,
} from '../services/lobbyService'
import {
  claimPostMatchReward,
  loadOnlineRun,
  preparePostMatchRewards,
  type OnlineRunState,
} from '../services/onlineRunService'
import type { OnlineLobbySession } from '../types/lobby'
import type { PvpMatch } from '../types/match'
import { DeckSummaryPanel } from './DeckSummaryPanel'
import { OnlineErrorPanel } from './OnlineErrorPanel'
import { PostMatchRewardButton } from './PostMatchRewardButton'
import { PvpRunStatusHeader } from './PvpRunStatusHeader'

interface MatchResultsViewProps {
  session: OnlineLobbySession
  match: PvpMatch
  onContinue: () => void
}

type ResultsStep = 'result' | 'rewards' | 'summary'

export function MatchResultsView({
  session,
  match,
  onContinue,
}: MatchResultsViewProps) {
  const runStatus = useOnlineRunStatus(session)
  const [lives, setLives] = useState(3)
  const [serverGold, setServerGold] = useState(0)
  const [runState, setRunState] = useState<OnlineRunState | null>(null)
  const [step, setStep] = useState<ResultsStep>('result')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimPending, setClaimPending] = useState(false)
  const [rewardSummary, setRewardSummary] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const player = await fetchLobbyPlayer(session.playerId)
        if (player) {
          setLives(player.lives)
          setServerGold(player.gold)
          const local = loadOnlineRun(session.lobbyId, session.sessionId)
          const deck =
            player.deck && player.deck.length > 0 ? player.deck : local.deck
          const prepared = preparePostMatchRewards(
            session.lobbyId,
            session.sessionId,
            match.id,
            deck,
          )
          setRunState(prepared)
          if (prepared.postMatchRewardClaimed) {
            setStep('summary')
            setRewardSummary(prepared.lastRewardSummary)
          }
        }
      } catch (err) {
        logOnlineError('results:load', err)
        setLoadError(
          err instanceof Error ? err.message : 'Failed to load results.',
        )
      }
    }
    void load()

    const unsub = subscribeToLobbyPlayers(session.lobbyId, (players) => {
      const me = players.find((p) => p.id === session.playerId)
      if (me) {
        setLives(me.lives)
        setServerGold(me.gold)
      }
    })

    return unsub
  }, [session.playerId, session.lobbyId, session.sessionId, match.id, match.winnerPlayerId])

  const handlePickReward = useCallback(
    async (offerIndex: number) => {
      if (!runState?.postMatchOffers || claimPending) return

      setClaimPending(true)
      setClaimError(null)

      try {
        const { state, nextGold, goldDelta } = claimPostMatchReward(
          session.lobbyId,
          session.sessionId,
          offerIndex,
          serverGold,
        )

        await syncPlayerDeckToServer(
          session.playerId,
          state.deck,
          state.relics,
        )
        if (goldDelta !== 0) {
          await updatePlayerGold(session.playerId, nextGold)
          setServerGold(nextGold)
        }

        setRunState(state)
        setRewardSummary(state.lastRewardSummary)
        setStep('summary')
      } catch (err) {
        logOnlineError('results:claim-reward', err)
        setClaimError(
          err instanceof Error ? err.message : 'Failed to apply reward.',
        )
      } finally {
        setClaimPending(false)
      }
    },
    [
      runState?.postMatchOffers,
      claimPending,
      session,
      serverGold,
    ],
  )

  if (loadError) {
    return (
      <section className="screen match-results-screen">
        <OnlineErrorPanel
          title="Results unavailable"
          message={loadError}
          onDismiss={onContinue}
        />
      </section>
    )
  }

  if (!match.battleState || !runStatus || !runState) {
    return (
      <section className="screen match-results-screen">
        <p>Loading match results…</p>
      </section>
    )
  }

  const won = match.winnerPlayerId === session.playerId
  const livesChange = won ? 0 : -1
  const summary = buildPvpMatchSummary(
    match.battleState,
    session.playerId,
    lives,
    livesChange,
  )

  if (!summary) {
    return (
      <section className="screen match-results-screen">
        <OnlineErrorPanel
          title="Results unavailable"
          message="Match summary could not be built from battle data."
          onDismiss={onContinue}
        />
      </section>
    )
  }

  const offers = runState.postMatchOffers ?? []

  return (
    <section className="screen match-results-screen post-match-screen">
      <PvpRunStatusHeader status={runStatus} title="Post-Match" />

      <div
        className={`match-results-banner ${
          summary.didIWin
            ? 'match-results-banner--win'
            : 'match-results-banner--loss'
        }`}
      >
        <h1>{summary.didIWin ? 'Victory' : 'Defeat'}</h1>
        <p>
          <strong>{summary.winnerName}</strong> defeated{' '}
          <strong>{summary.loserName}</strong>
        </p>
      </div>

      <div className="post-match-life-change">
        <h2>Life change</h2>
        {summary.didIWin ? (
          <p className="post-match-life-change__win">
            You keep all <strong>{summary.livesRemaining}</strong> lives and
            advance in the arena.
          </p>
        ) : (
          <p className="post-match-life-change__loss">
            You lost <strong>1 life</strong> —{' '}
            <strong>{summary.livesRemaining}</strong> remaining.
            {summary.livesRemaining <= 0
              ? ' You have been eliminated.'
              : ' Survival is harder from here.'}
          </p>
        )}
        <p className="post-match-life-change__note">
          {summary.didIWin
            ? 'Winning protects your lives — not your reward quality.'
            : 'Losing costs a life — your reward choices are the same as the winner.'}
        </p>
      </div>

      {step === 'result' && (
        <div className="post-match-section">
          <div className="match-results-grid">
            <div className="match-results-stat">
              <span>Your damage</span>
              <strong>{summary.myDamageDealt}</strong>
            </div>
            <div className="match-results-stat">
              <span>Opponent damage</span>
              <strong>{summary.opponentDamageDealt}</strong>
            </div>
            <div className="match-results-stat">
              <span>Cards played</span>
              <strong>{summary.myCardsPlayed}</strong>
            </div>
            <div className="match-results-stat">
              <span>Opponent cards</span>
              <strong>{summary.opponentCardsPlayed}</strong>
            </div>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={() => setStep('rewards')}
          >
            Choose your reward
          </button>
        </div>
      )}

      {step === 'rewards' && !runState.postMatchRewardClaimed && (
        <div className="post-match-section post-match-rewards">
          <h2>Reward selection</h2>
          <p className="post-match-rewards__hint">
            Pick 1 of 3 — same reward quality for winners and losers.
          </p>
          <div className="post-match-rewards__grid">
            {offers.map((offer, index) => (
              <PostMatchRewardButton
                key={`${offer.kind}-${index}`}
                offer={offer}
                disabled={claimPending}
                onClick={() => void handlePickReward(index)}
              />
            ))}
          </div>
          {claimError && <p className="online-lobby-error">{claimError}</p>}
          <button
            type="button"
            className="link-button"
            onClick={() => setStep('result')}
          >
            Back to match result
          </button>
        </div>
      )}

      {step === 'summary' && (
        <div className="post-match-section post-match-summary">
          <h2>Reward applied</h2>
          {rewardSummary && (
            <p className="post-match-summary__applied">{rewardSummary}</p>
          )}
          <p className="post-match-summary__gold">
            Gold for shop: <strong>{serverGold}</strong>
          </p>
          <DeckSummaryPanel deck={runState.deck} title="Updated deck" />
          <button
            type="button"
            className="primary-button primary-button--large"
            onClick={onContinue}
          >
            Continue to Shop
          </button>
        </div>
      )}
    </section>
  )
}
