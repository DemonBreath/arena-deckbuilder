import { STARTER_DECK, SHOP_CARD_POOL, type CardId } from '../game/cardDatabase'
import type { RelicId } from '../game/relicDatabase'

export interface OnlineRunState {
  deck: CardId[]
  relics: RelicId[]
  lastReward: number
  shopOffers: CardId[]
}

export function setLastRoundGold(
  lobbyId: string,
  sessionId: string,
  amount: number,
): void {
  const state = loadOnlineRun(lobbyId, sessionId)
  saveOnlineRun(lobbyId, sessionId, { ...state, lastReward: amount })
}

function storageKey(lobbyId: string, sessionId: string): string {
  return `arena-online-run:${lobbyId}:${sessionId}`
}

function generateShopOffers(): CardId[] {
  return Array.from({ length: 3 }, () => {
    const index = Math.floor(Math.random() * SHOP_CARD_POOL.length)
    return SHOP_CARD_POOL[index]
  })
}

export function loadOnlineRun(
  lobbyId: string,
  sessionId: string,
): OnlineRunState {
  try {
    const raw = localStorage.getItem(storageKey(lobbyId, sessionId))
    if (raw) {
      const parsed = JSON.parse(raw) as OnlineRunState
      if (Array.isArray(parsed.deck) && parsed.deck.length > 0) {
        return {
          deck: parsed.deck,
          relics: Array.isArray(parsed.relics) ? parsed.relics : [],
          lastReward: typeof parsed.lastReward === 'number' ? parsed.lastReward : 0,
          shopOffers:
            Array.isArray(parsed.shopOffers) && parsed.shopOffers.length > 0
              ? parsed.shopOffers
              : generateShopOffers(),
        }
      }
    }
  } catch {
    /* ignore corrupt storage */
  }

  return {
    deck: [...STARTER_DECK],
    relics: [],
    lastReward: 0,
    shopOffers: generateShopOffers(),
  }
}

export function saveOnlineRun(
  lobbyId: string,
  sessionId: string,
  state: OnlineRunState,
): void {
  localStorage.setItem(storageKey(lobbyId, sessionId), JSON.stringify(state))
}

export function clearOnlineRun(lobbyId: string, sessionId: string): void {
  localStorage.removeItem(storageKey(lobbyId, sessionId))
}

export function refreshShopOffers(state: OnlineRunState): OnlineRunState {
  return {
    ...state,
    shopOffers: generateShopOffers(),
  }
}
