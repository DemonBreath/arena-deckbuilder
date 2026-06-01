import type { GameState } from '../game/gameState'
import { getShopPrice } from '../game/gameState'
import { BattleLogPanel } from './BattleLogPanel'
import { CardButton } from './CardButton'
import { RelicsPanel } from './RelicsPanel'
import { RunHeader } from './RunHeader'
import { StandingsPanel } from './StandingsPanel'

interface ShopViewProps {
  state: GameState
  onBuyCard: (offerIndex: number) => void
  onNextBattle: () => void
}

export function ShopView({ state, onBuyCard, onNextBattle }: ShopViewProps) {
  const shopPrice = getShopPrice(state)

  return (
    <div className="shop-view">
      <RunHeader state={state} title="Arena Lobby" />
      <p className="deck-size">Deck size: {state.deck.length} cards</p>

      <RelicsPanel relics={state.relics} />

      <div className="shop-view__main">
        <div className="shop-view__content">
          <StandingsPanel contestants={state.contestants} />

          <p className="shop-message">{state.message}</p>

          <div className="shop-offers">
            <h3>Card Offers — {shopPrice} gold each</h3>
            <div className="shop-offers__grid">
              {state.shopOffers.map((cardId, index) => {
                const canAfford = state.gold >= shopPrice
                return (
                  <CardButton
                    key={`${cardId}-${index}`}
                    cardId={cardId}
                    variant="shop"
                    showPrice
                    price={shopPrice}
                    viewerClassId={state.classId}
                    disabled={!canAfford}
                    onClick={() => onBuyCard(index)}
                  />
                )
              })}
            </div>
          </div>

          <button type="button" className="primary-button" onClick={onNextBattle}>
            Next Battle
          </button>
        </div>

        <BattleLogPanel entries={state.battleLog} title="Run Log" />
      </div>
    </div>
  )
}
