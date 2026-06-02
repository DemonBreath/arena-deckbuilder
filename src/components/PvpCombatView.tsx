import { useEffect, useState } from 'react'
import { getCard } from '../game/cardDatabase'
import {
  getEmoteLabel,
  type PvpBattleView,
  type PvpEmoteId,
} from '../game/pvpBattleState'
import { useOnlineConnectivity } from '../hooks/useOnlineConnectivity'
import { useOnlineRunStatus } from '../hooks/useOnlineRunStatus'
import { ConnectionStatusBanner } from './ConnectionStatusBanner'
import type { ArenaPhase } from '../game/arenaPhase'
import type { OnlineMatchSession } from '../types/match'
import { BattleLogPanel } from './BattleLogPanel'
import { CardButton } from './CardButton'
import { FloatingCombatText } from './FloatingCombatText'
import { PvpEmoteBar } from './PvpEmoteBar'
import { PvpRunStatusHeader } from './PvpRunStatusHeader'
import { PvpTimerWarnings } from './PvpTimerWarnings'
import { PvpTurnTimer } from './PvpTurnTimer'
import { SyncDebugPanel } from './SyncDebugPanel'
import { ClassInfoBadge } from './ClassInfoBadge'
import { ClassMechanicMeter } from './ClassMechanicMeter'
import { ActiveArenaDraftsPanel } from './ActiveArenaDraftsPanel'

interface PvpCombatViewProps {
  session: OnlineMatchSession
  view: PvpBattleView
  actionPending: boolean
  error: string | null
  localStateJson: string | null
  remoteStateJson: string | null
  stateVersion: number
  turnStartAt: string | null
  opponentLastSeenAt: string | null
  arenaPhase?: ArenaPhase
  onPlayCard: (handIndex: number) => void
  onSendEmote: (emoteId: PvpEmoteId) => void
  onEndTurn: () => void
  onLeave: () => void
}

function isRecentEmote(emote: { at: number } | null): boolean {
  if (!emote) return false
  return Date.now() - emote.at < 8000
}

export function PvpCombatView({
  session,
  view,
  actionPending,
  error,
  localStateJson,
  remoteStateJson,
  stateVersion,
  turnStartAt,
  opponentLastSeenAt,
  arenaPhase = 'normal',
  onPlayCard,
  onSendEmote,
  onEndTurn,
  onLeave,
}: PvpCombatViewProps) {
  const runStatus = useOnlineRunStatus(session)
  const { connectionStatus } = useOnlineConnectivity(
    session.playerId,
    session.lobbyId,
  )
  const battleActive = view.phase === 'active'
  const hand = view.me.hand ?? []
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null)

  useEffect(() => {
    if (highlightIndex === null) return
    const timer = window.setTimeout(() => setHighlightIndex(null), 600)
    return () => window.clearTimeout(timer)
  }, [highlightIndex])

  const opponentEmoteLabel =
    view.opponentEmote && isRecentEmote(view.opponentEmote)
      ? getEmoteLabel(view.opponentEmote.id)
      : null

  const handlePlayCard = (index: number) => {
    setHighlightIndex(index)
    onPlayCard(index)
  }

  if (!runStatus) {
    return (
      <div className="battle-view pvp-battle-view">
        <p>Loading battle…</p>
      </div>
    )
  }

  return (
    <div className="battle-view pvp-battle-view">
      <ConnectionStatusBanner status={connectionStatus} />
      <PvpRunStatusHeader status={runStatus} title="PvP Battle" />

      {runStatus.activeDraftIds.length > 0 && (
        <ActiveArenaDraftsPanel
          activeDraftIds={runStatus.activeDraftIds}
          compact
        />
      )}

      <PvpTurnTimer
        turnStartAt={turnStartAt}
        isMyTurn={view.isMyTurn}
        battleActive={battleActive}
        arenaPhase={arenaPhase}
      />
      <PvpTimerWarnings
        turnStartAt={turnStartAt}
        isMyTurn={view.isMyTurn}
        battleActive={battleActive}
        arenaPhase={arenaPhase}
        opponentLastSeenAt={opponentLastSeenAt}
        opponentName={view.opponent.championName}
      />

      {!view.isMyTurn && battleActive && (
        <p className="pvp-turn-banner pvp-turn-banner--waiting">
          Opponent&apos;s turn — watch actions in real time.
        </p>
      )}
      {view.isMyTurn && battleActive && (
        <p className="pvp-turn-banner pvp-turn-banner--yours">Your turn</p>
      )}

      <div className="battle-view__main">
        <div className="battle-view__combat">
          <div className="battle-view__arena battle-view__arena--pvp">
            <FloatingCombatText effect={view.lastEffect} mySlot={view.mySlot} />

            <section className="fighter-panel fighter-panel--enemy">
              <h3>{view.opponent.championName}</h3>
              <ClassInfoBadge
                classId={view.opponent.classId}
                evolutionId={view.opponent.evolutionId}
                showPassiveTooltip
                compact
              />
              <p
                className="fighter-passive-hint"
                title={view.opponent.passiveDescription}
              >
                {view.opponent.passiveDescription}
              </p>
              <p className="hp-bar">
                <span>HP</span>
                <strong>
                  {Math.max(0, view.opponent.hp)} / {view.opponent.maxHp}
                </strong>
              </p>
              <ClassMechanicMeter
                classId={view.opponent.classId}
                meter={view.opponent.mechanic}
                compact
              />
              <p className="stat-line">Block: {view.opponent.block}</p>
              <p className="stat-line">
                Energy: {view.opponent.energy} / {view.opponent.maxEnergy}
              </p>
              <p className="stat-line">Draw: {view.opponent.drawCount}</p>
              <p className="stat-line">Discard: {view.opponent.discardCount}</p>
              <p className="stat-line">Hand: {view.opponent.handSize}</p>
            </section>

            <section className="fighter-panel fighter-panel--player">
              <h3>{view.me.championName}</h3>
              <ClassInfoBadge
                classId={view.me.classId}
                evolutionId={view.me.evolutionId}
                showPassiveTooltip
                compact
              />
              <p
                className="fighter-passive-hint"
                title={view.me.passiveDescription}
              >
                {view.me.passiveDescription}
              </p>
              <p className="hp-bar">
                <span>HP</span>
                <strong>
                  {Math.max(0, view.me.hp)} / {view.me.maxHp}
                </strong>
              </p>
              <ClassMechanicMeter
                classId={view.me.classId}
                meter={view.me.mechanic}
                compact
              />
              <p className="stat-line">Block: {view.me.block}</p>
              <p className="stat-line">
                Energy: {view.me.energy} / {view.me.maxEnergy}
              </p>
              <p className="stat-line">Draw: {view.me.drawCount}</p>
              <p className="stat-line">Discard: {view.me.discardCount}</p>
              <p className="stat-line">Hand: {view.me.handSize}</p>
            </section>
          </div>

          <p className="battle-message">{view.message}</p>

          <PvpEmoteBar
            disabled={actionPending || view.isCompleted}
            opponentEmoteLabel={opponentEmoteLabel}
            onSend={onSendEmote}
          />

          <div className="hand">
            <h3>Your Hand</h3>
            {!view.isMyTurn && battleActive && (
              <p className="empty-hand">Waiting for your turn…</p>
            )}
            {view.isMyTurn && hand.length === 0 && (
              <p className="empty-hand">No cards in hand.</p>
            )}
            {view.isMyTurn && hand.length > 0 && (
              <div className="hand__cards">
                {hand.map((cardId, index) => {
                  const card = getCard(cardId)
                  const disabled =
                    !battleActive ||
                    actionPending ||
                    view.me.energy < card.cost
                  const highlighted = highlightIndex === index
                  return (
                    <CardButton
                      key={`${cardId}-${index}`}
                      cardId={cardId}
                      handIndex={index}
                      viewerClassId={view.me.classId}
                      disabled={disabled}
                      className={highlighted ? 'card-button--played' : undefined}
                      onClick={() => handlePlayCard(index)}
                    />
                  )
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            className="primary-button primary-button--large"
            data-testid="end-turn-button"
            onClick={onEndTurn}
            disabled={!battleActive || !view.isMyTurn || actionPending}
          >
            End Turn
          </button>

          {error && <p className="online-lobby-error">{error}</p>}

          <button
            type="button"
            className="secondary-button"
            onClick={onLeave}
            disabled={actionPending}
          >
            Leave Match
          </button>
        </div>

        <BattleLogPanel entries={view.battleLog} />
      </div>

      <SyncDebugPanel
        localStateJson={localStateJson}
        remoteStateJson={remoteStateJson}
        stateVersion={stateVersion}
      />
    </div>
  )
}
