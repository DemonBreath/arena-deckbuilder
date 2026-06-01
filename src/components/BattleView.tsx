import { getCard } from '../game/cardDatabase'
import { getOpponent } from '../game/opponentDatabase'
import {
  getCurrentArenaOpponentName,
  getEnemyIntent,
  isBattleActive,
  type GameState,
} from '../game/gameState'
import { BattleLogPanel } from './BattleLogPanel'
import { CardButton } from './CardButton'
import { RelicsPanel } from './RelicsPanel'
import { RunHeader } from './RunHeader'

interface BattleViewProps {
  state: GameState
  onPlayCard: (handIndex: number) => void
  onEndTurn: () => void
}

export function BattleView({ state, onPlayCard, onEndTurn }: BattleViewProps) {
  const battleActive = isBattleActive(state)
  const archetype = getOpponent(state.opponentId)
  const arenaOpponentName = getCurrentArenaOpponentName(state)
  const intent = getEnemyIntent(state)

  return (
    <div className="battle-view">
      <RunHeader state={state} title="Battle" />

      <RelicsPanel relics={state.relics} />

      <div className="battle-view__main">
        <div className="battle-view__combat">
          <div className="battle-view__arena">
            <section className="fighter-panel fighter-panel--enemy">
              <h3>{arenaOpponentName}</h3>
              <p className="fighter-archetype">{archetype.name} deck</p>
              <p className="hp-bar">
                <span>HP</span>
                <strong>
                  {Math.max(0, state.enemyHp)} / {archetype.maxHp}
                </strong>
              </p>
              {state.enemyBlock > 0 && (
                <p className="stat-line">Block: {state.enemyBlock}</p>
              )}
              <p className="enemy-intent">{intent}</p>
            </section>

            <section className="fighter-panel fighter-panel--player">
              <h3>{state.championName}</h3>
              <p className="hp-bar">
                <span>HP</span>
                <strong>{Math.max(0, state.playerHp)} / 30</strong>
              </p>
              <p className="stat-line">Block: {state.block}</p>
              <p className="stat-line">Energy: {state.energy} / 3</p>
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
                      disabled={disabled}
                      onClick={() => onPlayCard(index)}
                    />
                  )
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={onEndTurn}
            disabled={!battleActive}
          >
            End Turn
          </button>
        </div>

        <BattleLogPanel entries={state.battleLog} />
      </div>
    </div>
  )
}
