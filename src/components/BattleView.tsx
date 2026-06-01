import { getCard } from '../game/cardDatabase'
import { getOpponent } from '../game/opponentDatabase'
import { resolveClassIdentity } from '../game/classIdentity'
import {
  getCurrentArenaOpponentName,
  getEnemyIntent,
  getSoloPlayerMaxEnergy,
  getSoloPlayerMaxHp,
  isBattleActive,
  runIdentity,
  type GameState,
} from '../game/gameState'
import { BattleLogPanel } from './BattleLogPanel'
import { CardButton } from './CardButton'
import { RelicsPanel } from './RelicsPanel'
import { RunHeader } from './RunHeader'
import { ClassInfoBadge } from './ClassInfoBadge'
import { ClassMechanicMeter } from './ClassMechanicMeter'
import { normalizeMechanicMeter } from '../game/classMechanics'

interface BattleViewProps {
  state: GameState
  onPlayCard: (handIndex: number) => void
  onEndTurn: () => void
  onResetClassTest?: () => void
  onExitClassTest?: () => void
}

export function BattleView({
  state,
  onPlayCard,
  onEndTurn,
  onResetClassTest,
  onExitClassTest,
}: BattleViewProps) {
  const battleActive = isBattleActive(state)
  const archetype = getOpponent(state.opponentId)
  const arenaOpponentName = getCurrentArenaOpponentName(state)
  const intent = getEnemyIntent(state)
  const profile = resolveClassIdentity(runIdentity(state))
  const maxHp = getSoloPlayerMaxHp(state)
  const maxEnergy = getSoloPlayerMaxEnergy(state)

  const testFinished = state.classTestMode && state.battleWon !== null

  return (
    <div className="battle-view">
      {state.classTestMode && (
        <div className="class-test-banner">
          <strong>Class Test Lab</strong>
          <span>Training Dummy · 28 HP · reset anytime</span>
        </div>
      )}

      <RunHeader
        state={state}
        title={state.classTestMode ? 'Class Test' : 'Battle'}
      />

      <RelicsPanel relics={state.relics} />

      <div className="battle-view__main">
        <div className="battle-view__combat">
          <div className="battle-view__arena">
            <section className="fighter-panel fighter-panel--enemy">
              <h3>
                {state.classTestMode ? 'Training Dummy' : arenaOpponentName}
              </h3>
              <p className="fighter-archetype">
                {state.classTestMode ? 'Bruiser training deck' : `${archetype.name} deck`}
              </p>
              <p className="hp-bar">
                <span>HP</span>
                <strong>
                  {Math.max(0, state.enemyHp)} /{' '}
                  {state.classTestMode ? 28 : archetype.maxHp}
                </strong>
              </p>
              {state.enemyBlock > 0 && (
                <p className="stat-line">Block: {state.enemyBlock}</p>
              )}
              <p className="enemy-intent">{intent}</p>
            </section>

            <section className="fighter-panel fighter-panel--player">
              <h3>{state.championName}</h3>
              <ClassInfoBadge
                classId={state.classId}
                evolutionId={state.evolutionId}
                showPassiveTooltip
              />
              <p className="fighter-passive-hint" title={profile.passive.description}>
                {profile.passive.name}: {profile.passive.description}
              </p>
              <p className="hp-bar">
                <span>HP</span>
                <strong>
                  {Math.max(0, state.playerHp)} / {maxHp}
                </strong>
              </p>
              <ClassMechanicMeter
                classId={state.classId}
                meter={normalizeMechanicMeter(state.mechanic, state.classId)}
                compact
              />
              <p className="stat-line">Block: {state.block}</p>
              <p className="stat-line">
                Energy: {state.energy} / {maxEnergy}
              </p>
              <p className="stat-line">Draw pile: {state.drawPile.length}</p>
              <p className="stat-line">Discard: {state.discardPile.length}</p>
            </section>
          </div>

          <p className="battle-message">{state.message}</p>

          <div className="hand">
            <h3>Your Hand</h3>
            {state.hand.length === 0 ? (
              <p className="empty-hand">No cards in hand.</p>
            ) : (
              <div className="hand__cards">
                {state.hand.map((cardId, index) => {
                  const card = getCard(cardId)
                  const disabled = state.energy < card.cost
                  return (
                    <CardButton
                      key={`${cardId}-${index}`}
                      cardId={cardId}
                      viewerClassId={state.classId}
                      disabled={disabled}
                      onClick={() => onPlayCard(index)}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {testFinished ? (
            <div className="class-test-battle-actions">
              <p className="battle-message">{state.message}</p>
              <button
                type="button"
                className="primary-button"
                onClick={onResetClassTest}
              >
                Reset Test Battle
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={onExitClassTest}
              >
                Exit Test Lab
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={onEndTurn}
              disabled={!battleActive}
            >
              End Turn
            </button>
          )}

          {state.classTestMode && battleActive && onResetClassTest && (
            <button
              type="button"
              className="secondary-button class-test-reset-inline"
              onClick={onResetClassTest}
            >
              Reset Test
            </button>
          )}
        </div>

        <BattleLogPanel entries={state.battleLog} />
      </div>
    </div>
  )
}
