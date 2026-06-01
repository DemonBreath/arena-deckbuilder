import { getCard, type CardId } from './cardDatabase'
import { PVP_POST_MATCH_GOLD } from './arenaConstants'
import {
  isPvpAllowedCard,
  PVP_SHOP_CARD_POOL,
  sanitizePvpDeck,
} from './pvpBattleState'

export type PostMatchRewardKind =
  | 'add_card'
  | 'upgrade_card'
  | 'remove_card'
  | 'gain_gold'

export interface PostMatchRewardOffer {
  kind: PostMatchRewardKind
  label: string
  description: string
  cardId?: CardId
  deckIndex?: number
  fromCardId?: CardId
  toCardId?: CardId
  goldAmount?: number
}

const MIN_DECK_SIZE = 5

const UPGRADE_TARGETS: Partial<Record<CardId, CardId>> = {
  strike: 'strike_plus',
  guard: 'guard_plus',
}

const ALL_REWARD_KINDS: PostMatchRewardKind[] = [
  'add_card',
  'upgrade_card',
  'remove_card',
  'gain_gold',
]

function shuffleKinds(): PostMatchRewardKind[] {
  const kinds = [...ALL_REWARD_KINDS]
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[kinds[i], kinds[j]] = [kinds[j], kinds[i]]
  }
  return kinds.slice(0, 3)
}

function pickAddCardOffer(): PostMatchRewardOffer {
  const pool = PVP_SHOP_CARD_POOL
  const cardId = pool[Math.floor(Math.random() * pool.length)]
  const card = getCard(cardId)
  return {
    kind: 'add_card',
    label: `Add ${card.name}`,
    description: `Add ${card.name} to your deck`,
    cardId,
  }
}

function pickUpgradeOffer(deck: CardId[]): PostMatchRewardOffer | null {
  const candidates: { deckIndex: number; from: CardId; to: CardId }[] = []
  deck.forEach((cardId, deckIndex) => {
    const to = UPGRADE_TARGETS[cardId]
    if (to && isPvpAllowedCard(to)) {
      candidates.push({ deckIndex, from: cardId, to })
    }
  })
  if (candidates.length === 0) return null

  const pick = candidates[Math.floor(Math.random() * candidates.length)]
  const fromCard = getCard(pick.from)
  const toCard = getCard(pick.to)
  return {
    kind: 'upgrade_card',
    label: `Upgrade ${fromCard.name}`,
    description: `Upgrade ${fromCard.name} → ${toCard.name}`,
    deckIndex: pick.deckIndex,
    fromCardId: pick.from,
    toCardId: pick.to,
  }
}

function pickRemoveOffer(deck: CardId[]): PostMatchRewardOffer | null {
  if (deck.length <= MIN_DECK_SIZE) return null
  const deckIndex = Math.floor(Math.random() * deck.length)
  const card = getCard(deck[deckIndex])
  return {
    kind: 'remove_card',
    label: `Remove ${card.name}`,
    description: `Remove one ${card.name} from your deck`,
    deckIndex,
  }
}

function pickGoldOffer(): PostMatchRewardOffer {
  return {
    kind: 'gain_gold',
    label: `+${PVP_POST_MATCH_GOLD} Gold`,
    description: `Gain ${PVP_POST_MATCH_GOLD} gold for the shop`,
    goldAmount: PVP_POST_MATCH_GOLD,
  }
}

function buildOfferForKind(
  kind: PostMatchRewardKind,
  deck: CardId[],
): PostMatchRewardOffer {
  switch (kind) {
    case 'add_card':
      return pickAddCardOffer()
    case 'upgrade_card':
      return pickUpgradeOffer(deck) ?? pickAddCardOffer()
    case 'remove_card':
      return pickRemoveOffer(deck) ?? pickAddCardOffer()
    case 'gain_gold':
      return pickGoldOffer()
    default:
      return pickGoldOffer()
  }
}

/** Three fair reward options — same categories and power for winners and losers. */
export function generatePostMatchRewardOffers(deck: CardId[]): PostMatchRewardOffer[] {
  const sanitized = sanitizePvpDeck(deck)
  const kinds = shuffleKinds()
  return kinds.map((kind) => buildOfferForKind(kind, sanitized))
}

export function applyPostMatchReward(
  deck: CardId[],
  gold: number,
  offer: PostMatchRewardOffer,
): { deck: CardId[]; gold: number; summary: string } {
  const sanitized = sanitizePvpDeck(deck)

  switch (offer.kind) {
    case 'add_card': {
      if (!offer.cardId) {
        return { deck: sanitized, gold, summary: 'No card added.' }
      }
      const card = getCard(offer.cardId)
      return {
        deck: sanitizePvpDeck([...sanitized, offer.cardId]),
        gold,
        summary: `Added ${card.name} to your deck.`,
      }
    }
    case 'upgrade_card': {
      if (
        offer.deckIndex === undefined ||
        offer.toCardId === undefined ||
        offer.fromCardId === undefined
      ) {
        return { deck: sanitized, gold, summary: 'Upgrade unavailable.' }
      }
      const next = [...sanitized]
      if (next[offer.deckIndex] !== offer.fromCardId) {
        return { deck: sanitized, gold, summary: 'Upgrade unavailable.' }
      }
      next[offer.deckIndex] = offer.toCardId
      const toCard = getCard(offer.toCardId)
      return {
        deck: sanitizePvpDeck(next),
        gold,
        summary: `Upgraded to ${toCard.name}.`,
      }
    }
    case 'remove_card': {
      if (offer.deckIndex === undefined || sanitized.length <= MIN_DECK_SIZE) {
        return { deck: sanitized, gold, summary: 'Cannot remove — deck too small.' }
      }
      const removed = getCard(sanitized[offer.deckIndex])
      const next = [...sanitized]
      next.splice(offer.deckIndex, 1)
      return {
        deck: sanitizePvpDeck(next),
        gold,
        summary: `Removed ${removed.name} from your deck.`,
      }
    }
    case 'gain_gold': {
      const amount = offer.goldAmount ?? PVP_POST_MATCH_GOLD
      return {
        deck: sanitized,
        gold: gold + amount,
        summary: `Gained ${amount} gold.`,
      }
    }
    default:
      return { deck: sanitized, gold, summary: 'Reward applied.' }
  }
}

export function formatDeckCounts(deck: CardId[]): { cardId: CardId; count: number }[] {
  const counts = new Map<CardId, number>()
  for (const cardId of sanitizePvpDeck(deck)) {
    counts.set(cardId, (counts.get(cardId) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([cardId, count]) => ({ cardId, count }))
    .sort((a, b) => getCard(a.cardId).name.localeCompare(getCard(b.cardId).name))
}
