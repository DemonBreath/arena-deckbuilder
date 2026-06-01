import { getCard, type CardId } from '../game/cardDatabase'
import {
  getCardOwnerClass,
  isRareClassCard,
  isClassSpecificCard,
} from '../game/classCardPools'
import { getClassDefinition, type ClassId } from '../game/classDatabase'

interface CardButtonProps {
  cardId: CardId
  disabled?: boolean
  onClick?: () => void
  variant?: 'hand' | 'shop'
  showPrice?: boolean
  price?: number
  className?: string
  /** Viewer's class — highlights own class cards vs other classes. */
  viewerClassId?: ClassId
}

export function CardButton({
  cardId,
  disabled = false,
  onClick,
  variant = 'hand',
  showPrice = false,
  price,
  className,
  viewerClassId,
}: CardButtonProps) {
  const card = getCard(cardId)
  const displayPrice = price ?? card.shopPrice
  const extraClass = className ? ` ${className}` : ''
  const ownerClass = getCardOwnerClass(cardId)
  const isClassCard = isClassSpecificCard(cardId)
  const isRare = isRareClassCard(cardId)
  const isOwnClass =
    viewerClassId && ownerClass && viewerClassId === ownerClass

  return (
    <button
      type="button"
      className={`card-button card-button--${variant}${extraClass}`}
      disabled={disabled}
      onClick={onClick}
    >
      {isClassCard && (
        <span
          className={`card-pool-badge ${isRare ? 'card-pool-badge--rare' : 'card-pool-badge--class'} ${isOwnClass === false ? 'card-pool-badge--foreign' : ''}`}
          title={
            isRare
              ? `Rare ${ownerClass ? getClassDefinition(ownerClass).name : ''} card`
              : ownerClass
                ? `${getClassDefinition(ownerClass).name} class card`
                : 'Class card'
          }
        >
          {isRare ? 'Rare class' : ownerClass ? getClassDefinition(ownerClass).name : 'Class'}
        </span>
      )}
      <span className="card-button__name">{card.name}</span>
      <span className="card-button__cost">Cost {card.cost}</span>
      <span className="card-button__desc">{card.description}</span>
      {showPrice && (
        <span className="card-button__price">{displayPrice} gold</span>
      )}
    </button>
  )
}
