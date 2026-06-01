import { getCard, type CardId } from '../game/cardDatabase'

interface CardButtonProps {
  cardId: CardId
  disabled?: boolean
  onClick?: () => void
  variant?: 'hand' | 'shop'
  showPrice?: boolean
  price?: number
  className?: string
}

export function CardButton({
  cardId,
  disabled = false,
  onClick,
  variant = 'hand',
  showPrice = false,
  price,
  className,
}: CardButtonProps) {
  const card = getCard(cardId)
  const displayPrice = price ?? card.shopPrice
  const extraClass = className ? ` ${className}` : ''

  return (
    <button
      type="button"
      className={`card-button card-button--${variant}${extraClass}`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="card-button__name">{card.name}</span>
      <span className="card-button__cost">Cost {card.cost}</span>
      <span className="card-button__desc">{card.description}</span>
      {showPrice && (
        <span className="card-button__price">{displayPrice} gold</span>
      )}
    </button>
  )
}
