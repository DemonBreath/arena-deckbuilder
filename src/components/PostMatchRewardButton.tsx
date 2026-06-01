import { getCard } from '../game/cardDatabase'
import type { PostMatchRewardOffer } from '../game/postMatchRewards'
import { CardButton } from './CardButton'

interface PostMatchRewardButtonProps {
  offer: PostMatchRewardOffer
  disabled?: boolean
  onClick: () => void
}

export function PostMatchRewardButton({
  offer,
  disabled = false,
  onClick,
}: PostMatchRewardButtonProps) {
  if (offer.kind === 'add_card' && offer.cardId) {
    return (
      <div className="post-match-reward-option">
        <span className="post-match-reward-option__type">Add a card</span>
        <CardButton cardId={offer.cardId} variant="shop" onClick={onClick} disabled={disabled} />
      </div>
    )
  }

  if (offer.kind === 'upgrade_card' && offer.fromCardId && offer.toCardId) {
    const from = getCard(offer.fromCardId)
    const to = getCard(offer.toCardId)
    return (
      <button
        type="button"
        className="post-match-reward-card"
        disabled={disabled}
        onClick={onClick}
      >
        <span className="post-match-reward-option__type">Upgrade a card</span>
        <span className="post-match-reward-card__name">
          {from.name} → {to.name}
        </span>
        <span className="post-match-reward-card__desc">{offer.description}</span>
      </button>
    )
  }

  if (offer.kind === 'remove_card' && offer.deckIndex !== undefined) {
    return (
      <button
        type="button"
        className="post-match-reward-card"
        disabled={disabled}
        onClick={onClick}
      >
        <span className="post-match-reward-option__type">Remove a card</span>
        <span className="post-match-reward-card__name">{offer.label}</span>
        <span className="post-match-reward-card__desc">{offer.description}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className="post-match-reward-card post-match-reward-card--gold"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="post-match-reward-option__type">Gain gold</span>
      <span className="post-match-reward-card__name">{offer.label}</span>
      <span className="post-match-reward-card__desc">{offer.description}</span>
    </button>
  )
}
