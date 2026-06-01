import { STARTER_DECK, type CardId } from '../game/cardDatabase'
import {
  getClassStarterDeck,
  parseClassId,
  type ClassId,
} from '../game/classDatabase'
import {
  applyPostMatchReward,
  generatePostMatchRewardOffers,
  type PostMatchRewardOffer,
} from '../game/postMatchRewards'
import { generateClassCardOffers } from '../game/classCardPools'
import type { RelicId } from '../game/relicDatabase'

export interface OnlineRunState {
  classId: ClassId
  deck: CardId[]
  relics: RelicId[]
  lastReward: number
  shopOffers: CardId[]
  postMatchOffers: PostMatchRewardOffer[] | null
  postMatchRewardClaimed: boolean
  postMatchForMatchId: string | null
  lastRewardSummary: string | null
}

export function setLastRoundGold(
  lobbyId: string,
  sessionId: string,
  amount: number,
  summary?: string,
): void {
  const state = loadOnlineRun(lobbyId, sessionId)
  saveOnlineRun(lobbyId, sessionId, {
    ...state,
    lastReward: amount,
    lastRewardSummary: summary ?? state.lastRewardSummary,
  })
}

function storageKey(lobbyId: string, sessionId: string): string {
  return `arena-online-run:${lobbyId}:${sessionId}`
}

function generateShopOffers(classId: ClassId): CardId[] {
  return generateClassCardOffers(classId, 3)
}

function normalizeRunState(parsed: Partial<OnlineRunState>): OnlineRunState {
  const classId = parseClassId(parsed.classId)
  return {
    classId,
    deck:
      Array.isArray(parsed.deck) && parsed.deck.length > 0
        ? parsed.deck
        : [...STARTER_DECK],
    relics: Array.isArray(parsed.relics) ? parsed.relics : [],
    lastReward: typeof parsed.lastReward === 'number' ? parsed.lastReward : 0,
    shopOffers:
      Array.isArray(parsed.shopOffers) && parsed.shopOffers.length > 0
        ? parsed.shopOffers
        : generateShopOffers(classId),
    postMatchOffers: Array.isArray(parsed.postMatchOffers)
      ? parsed.postMatchOffers
      : null,
    postMatchRewardClaimed: Boolean(parsed.postMatchRewardClaimed),
    postMatchForMatchId:
      typeof parsed.postMatchForMatchId === 'string'
        ? parsed.postMatchForMatchId
        : null,
    lastRewardSummary:
      typeof parsed.lastRewardSummary === 'string'
        ? parsed.lastRewardSummary
        : null,
  }
}

export function loadOnlineRun(
  lobbyId: string,
  sessionId: string,
): OnlineRunState {
  try {
    const raw = localStorage.getItem(storageKey(lobbyId, sessionId))
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OnlineRunState>
      if (Array.isArray(parsed.deck) && parsed.deck.length > 0) {
        return normalizeRunState(parsed)
      }
    }
  } catch {
    /* ignore corrupt storage */
  }

  const fallbackClassId = parseClassId(undefined)
  return {
    classId: fallbackClassId,
    deck: [...STARTER_DECK],
    relics: [],
    lastReward: 0,
    shopOffers: generateShopOffers(fallbackClassId),
    postMatchOffers: null,
    postMatchRewardClaimed: false,
    postMatchForMatchId: null,
    lastRewardSummary: null,
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
    shopOffers: generateShopOffers(state.classId),
  }
}

export function initializeOnlineRunForClass(
  lobbyId: string,
  sessionId: string,
  classId: ClassId,
): OnlineRunState {
  const next: OnlineRunState = {
    ...loadOnlineRun(lobbyId, sessionId),
    classId,
    deck: getClassStarterDeck(classId),
    relics: [],
    lastReward: 0,
    shopOffers: generateShopOffers(classId),
    postMatchOffers: null,
    postMatchRewardClaimed: false,
    postMatchForMatchId: null,
    lastRewardSummary: null,
  }
  saveOnlineRun(lobbyId, sessionId, next)
  return next
}

export function preparePostMatchRewards(
  lobbyId: string,
  sessionId: string,
  matchId: string,
  deck: CardId[],
): OnlineRunState {
  const state = loadOnlineRun(lobbyId, sessionId)
  if (
    state.postMatchForMatchId === matchId &&
    state.postMatchOffers &&
    state.postMatchOffers.length > 0
  ) {
    return state
  }

  const next: OnlineRunState = {
    ...state,
    deck,
    postMatchOffers: generatePostMatchRewardOffers(deck, state.classId),
    postMatchRewardClaimed: false,
    postMatchForMatchId: matchId,
    lastRewardSummary: null,
  }
  saveOnlineRun(lobbyId, sessionId, next)
  return next
}

export function claimPostMatchReward(
  lobbyId: string,
  sessionId: string,
  offerIndex: number,
  serverGold: number,
): { state: OnlineRunState; nextGold: number; goldDelta: number } {
  const state = loadOnlineRun(lobbyId, sessionId)
  const offer = state.postMatchOffers?.[offerIndex]
  if (!offer || state.postMatchRewardClaimed) {
    return { state, nextGold: serverGold, goldDelta: 0 }
  }

  const applied = applyPostMatchReward(state.deck, serverGold, offer)
  const goldDelta = applied.gold - serverGold

  const next: OnlineRunState = {
    ...state,
    deck: applied.deck,
    postMatchRewardClaimed: true,
    lastReward: goldDelta > 0 ? goldDelta : 0,
    lastRewardSummary: applied.summary,
  }
  saveOnlineRun(lobbyId, sessionId, next)
  return { state: next, nextGold: applied.gold, goldDelta }
}
