import { getCard, type CardId } from '../game/cardDatabase'
import { formatDeckCounts } from '../game/postMatchRewards'

interface DeckSummaryPanelProps {
  deck: CardId[]
  title?: string
}

export function DeckSummaryPanel({
  deck,
  title = 'Your deck',
}: DeckSummaryPanelProps) {
  const rows = formatDeckCounts(deck)

  return (
    <section className="deck-summary-panel">
      <h3>{title}</h3>
      <p className="deck-summary-panel__size">{deck.length} cards total</p>
      <ul className="deck-summary-panel__list">
        {rows.map(({ cardId, count }) => (
          <li key={cardId}>
            <span className="deck-summary-panel__name">
              {getCard(cardId).name}
            </span>
            <span className="deck-summary-panel__count">×{count}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
