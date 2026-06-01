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
import {
  parseEvolutionId,
  type EvolutionId,
} from '../game/classEvolutions'
import { getClassVictoryGoldBonus } from '../game/classPassives'
import type { RelicId } from '../game/relicDatabase'
import { syncPlayerEvolution } from './scoutingService'

export interface OnlineRunState {
  classId: ClassId
  evolutionId: EvolutionId | null
  /** PvP victories in the current lobby run (used for evolution trigger). */
  battlesWon: number
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

function generateShopOffers(
  classId: ClassId,
  evolutionId: EvolutionId | null,
): CardId[] {
  return generateClassCardOffers(classId, 3, evolutionId)
}

function normalizeRunState(parsed: Partial<OnlineRunState>): OnlineRunState {
  const classId = parseClassId(parsed.classId)
  const evolutionId = parseEvolutionId(parsed.evolutionId)
  return {
    classId,
    evolutionId,
    battlesWon:
      typeof parsed.battlesWon === 'number'
        ? Math.max(0, parsed.battlesWon)
        : 0,
    deck:
      Array.isArray(parsed.deck) && parsed.deck.length > 0
        ? parsed.deck
        : [...STARTER_DECK],
    relics: Array.isArray(parsed.relics) ? parsed.relics : [],
    lastReward: typeof parsed.lastReward === 'number' ? parsed.lastReward : 0,
    shopOffers:
      Array.isArray(parsed.shopOffers) && parsed.shopOffers.length > 0
        ? parsed.shopOffers
        : generateShopOffers(classId, evolutionId),
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
    evolutionId: null,
    battlesWon: 0,
    deck: [...STARTER_DECK],
    relics: [],
    lastReward: 0,
    shopOffers: generateShopOffers(fallbackClassId, null),
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
    shopOffers: generateShopOffers(state.classId, state.evolutionId),
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
    evolutionId: null,
    battlesWon: 0,
    deck: getClassStarterDeck(classId),
    relics: [],
    lastReward: 0,
    shopOffers: generateShopOffers(classId, null),
    postMatchOffers: null,
    postMatchRewardClaimed: false,
    postMatchForMatchId: null,
    lastRewardSummary: null,
  }
  saveOnlineRun(lobbyId, sessionId, next)
  return next
}

export function pickOnlineEvolution(
  lobbyId: string,
  sessionId: string,
  evolutionId: EvolutionId,
  playerId?: string,
): OnlineRunState {
  const state = loadOnlineRun(lobbyId, sessionId)
  const next: OnlineRunState = {
    ...state,
    evolutionId,
    shopOffers: generateShopOffers(state.classId, evolutionId),
    postMatchOffers: state.postMatchOffers
      ? generatePostMatchRewardOffers(
          state.deck,
          state.classId,
          evolutionId,
        )
      : state.postMatchOffers,
  }
  saveOnlineRun(lobbyId, sessionId, next)
  if (playerId) {
    void syncPlayerEvolution(playerId, evolutionId).catch(() => {
      /* scouting sync is best-effort; local run remains source for self */
    })
  }
  return next
}

export function preparePostMatchRewards(
  lobbyId: string,
  sessionId: string,
  matchId: string,
  deck: CardId[],
  won: boolean,
): OnlineRunState {
  const state = loadOnlineRun(lobbyId, sessionId)
  const battlesWon = won ? state.battlesWon + 1 : state.battlesWon

  if (
    state.postMatchForMatchId === matchId &&
    state.postMatchOffers &&
    state.postMatchOffers.length > 0 &&
    state.battlesWon === battlesWon
  ) {
    return { ...state, deck, battlesWon }
  }

  const next: OnlineRunState = {
    ...state,
    deck,
    battlesWon,
    postMatchOffers: generatePostMatchRewardOffers(
      deck,
      state.classId,
      state.evolutionId,
    ),
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
  const plunder = getClassVictoryGoldBonus(state.classId)
  const totalGold = applied.gold + plunder
  const goldDelta = totalGold - serverGold

  const next: OnlineRunState = {
    ...state,
    deck: applied.deck,
    postMatchRewardClaimed: true,
    lastReward: goldDelta > 0 ? goldDelta : 0,
    lastRewardSummary:
      plunder > 0
        ? `${applied.summary} Plunder (+${plunder} gold).`
        : applied.summary,
  }
  saveOnlineRun(lobbyId, sessionId, next)
  return { state: next, nextGold: totalGold, goldDelta }
}
