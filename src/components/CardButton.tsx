import { getCard, type CardId } from '../game/cardDatabase'
import {
  getCardOwnerClass,
  isRareClassCard,
  isSignatureClassCard,
  isClassSpecificCard,
} from '../game/classCardPools'
import { getSignatureCardTooltip } from '../game/signatureCards'
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
  const isSignature = isSignatureClassCard(cardId)
  const isOwnClass =
    viewerClassId && ownerClass && viewerClassId === ownerClass
  const tooltip =
    getSignatureCardTooltip(cardId) ??
    (card.mechanicHint
      ? `${card.description}\n\nMechanic: ${card.mechanicHint}`
      : card.description)

  return (
    <button
      type="button"
      className={`card-button card-button--${variant}${extraClass}`}
      disabled={disabled}
      onClick={onClick}
      title={tooltip}
    >
      {isClassCard && (
        <span
          className={`card-pool-badge ${
            isSignature
              ? 'card-pool-badge--signature'
              : isRare
                ? 'card-pool-badge--rare'
                : 'card-pool-badge--class'
          } ${isOwnClass === false ? 'card-pool-badge--foreign' : ''}`}
          title={
            isSignature
              ? `Signature ${ownerClass ? getClassDefinition(ownerClass).name : ''} card`
              : isRare
                ? `Rare ${ownerClass ? getClassDefinition(ownerClass).name : ''} card`
                : ownerClass
                  ? `${getClassDefinition(ownerClass).name} class card`
                  : 'Class card'
          }
        >
          {isSignature
            ? 'Signature'
            : isRare
              ? 'Rare class'
              : ownerClass
                ? getClassDefinition(ownerClass).name
                : 'Class'}
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
