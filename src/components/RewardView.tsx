import type { GameState } from '../game/gameState'
import { canContinueToShop } from '../game/gameState'
import { BattleLogPanel } from './BattleLogPanel'
import { CardButton } from './CardButton'
import { RelicButton } from './RelicButton'
import { RelicsPanel } from './RelicsPanel'
import { RunHeader } from './RunHeader'

interface RewardViewProps {
  state: GameState
  onPickCard: (offerIndex: number) => void
  onPickRelic: (offerIndex: number) => void
  onContinueToShop: () => void
}

export function RewardView({
  state,
  onPickCard,
  onPickRelic,
  onContinueToShop,
}: RewardViewProps) {
  const canContinue = canContinueToShop(state)

  return (
    <div className="reward-view">
      <RunHeader state={state} title="Round Complete" />
      <p
        className={`reward-outcome ${
          state.battleWon ? 'reward-outcome--win' : 'reward-outcome--loss'
        }`}
      >
        {state.battleWon ? 'Victory' : 'Defeat'}
      </p>

      <div className="reward-view__main">
        <div className="reward-view__content">
          <section className="reward-summary">
            <p className="reward-amount">+{state.lastReward} gold</p>
            <p className="reward-total">Total gold: {state.gold}</p>
            {!state.battleWon && (
              <p className="reward-lives">Lives remaining: {state.lives}</p>
            )}
            <p className="reward-message">{state.message}</p>
          </section>

          <RelicsPanel relics={state.relics} />

          {state.rewardType === 'cards' && !state.rewardClaimed && (
            <section className="reward-picks">
              <h3>Choose 1 card reward</h3>
              <div className="reward-picks__grid">
                {state.rewardCards.map((cardId, index) => (
                  <CardButton
                    key={`${cardId}-${index}`}
                    cardId={cardId}
                    variant="shop"
                    onClick={() => onPickCard(index)}
                  />
                ))}
              </div>
            </section>
          )}

          {state.rewardType === 'relics' && !state.rewardClaimed && (
            <section className="reward-picks">
              <h3>Choose 1 relic reward (3rd win bonus)</h3>
              <div className="reward-picks__grid">
                {state.rewardRelics.map((relicId, index) => (
                  <RelicButton
                    key={`${relicId}-${index}`}
                    relicId={relicId}
                    owned={state.relics.includes(relicId)}
                    onClick={() => onPickRelic(index)}
                  />
                ))}
              </div>
            </section>
          )}

          {state.rewardClaimed && state.rewardType !== 'none' && (
            <p className="reward-claimed-note">Reward claimed.</p>
          )}

          <button
            type="button"
            className="primary-button"
            onClick={onContinueToShop}
            disabled={!canContinue}
          >
            Continue to Shop
          </button>
        </div>

        <BattleLogPanel entries={state.battleLog} title="Run Log" />
      </div>
    </div>
  )
}
