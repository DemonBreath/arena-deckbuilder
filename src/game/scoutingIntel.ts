/**
 * Scouting intelligence — pure builders for pre-match reports (Milestone 25).
 * Extend ScoutingIntelContext for future advanced scouting (relic trends, phase history, etc.).
 */

import {
  applyArenaStartingHp,
  formatArenaPhaseLabel,
  type ArenaPhase,
} from './arenaPhase'
import {
  stackArenaDraftEffects,
  type ArenaDraftId,
} from './arenaDrafts'
import { getCard, type CardId } from './cardDatabase'
import { getClassStarterDeck, type ClassId } from './classDatabase'
import {
  createClassIdentity,
  getPlayerMaxHp,
  resolveClassIdentity,
} from './classIdentity'
import type { EvolutionId } from './classEvolutions'
import { sanitizePvpDeck } from './pvpBattleState'
import type { Lobby, LobbyPlayer } from '../types/lobby'
import type {
  MatchIntroductionSnapshot,
  OpponentScoutingReport,
  ScoutedCardInsight,
} from '../types/scouting'
import { EMPTY_SCOUTING_STATS } from '../types/scouting'
import {
  applyRivalIntroExtensions,
  buildRivalMatchIntro,
} from './rivalIntel'

export interface ScoutingIntelContext {
  opponent: LobbyPlayer
  lobby: Lobby | null
  arenaPhase: ArenaPhase
  finalDuelSeriesLabel?: string | null
  /** When battle is initialized, use live HP from the view; otherwise estimate. */
  opponentHp?: number
  opponentMaxHp?: number
  selfHp?: number
  selfMaxHp?: number
  selfPlayer: LobbyPlayer
  selfEvolutionId?: EvolutionId | null
}

/** Estimate starting HP for scouting (matches buildCombatant in pvpBattleState). */
export function estimateMatchStartingHp(
  classId: ClassId,
  evolutionId: EvolutionId | null,
  arenaPhase: ArenaPhase,
  activeDraftIds: ArenaDraftId[],
): number {
  const identity = createClassIdentity(classId, evolutionId)
  const baseMaxHp = getPlayerMaxHp(identity)
  const afterPhase = applyArenaStartingHp(baseMaxHp, arenaPhase)
  const draftEffects = stackArenaDraftEffects(activeDraftIds)
  return afterPhase + draftEffects.maxHpBonus
}

export function resolveDeckSizeForScouting(
  deck: CardId[] | null,
  classId: ClassId,
): number {
  const source =
    deck && deck.length > 0 ? deck : getClassStarterDeck(classId)
  return sanitizePvpDeck(source).length
}

export function getTopPlayedCards(
  cardPlayCounts: Partial<Record<CardId, number>>,
  limit = 3,
): ScoutedCardInsight[] {
  const entries = Object.entries(cardPlayCounts)
    .filter(([, count]) => typeof count === 'number' && count > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, limit)

  return entries.map(([cardId, timesPlayed]) => {
    const id = cardId as CardId
    let cardName = cardId
    try {
      cardName = getCard(id).name
    } catch {
      cardName = cardId
    }
    return { cardId: id, cardName, timesPlayed: timesPlayed as number }
  })
}

export function buildOpponentScoutingReport(
  ctx: ScoutingIntelContext,
): OpponentScoutingReport {
  const { opponent, lobby, arenaPhase } = ctx
  const evolutionId = opponent.evolutionId
  const profile = resolveClassIdentity(
    createClassIdentity(opponent.classId, evolutionId),
  )
  const activeArenaDraftIds = lobby?.activeDraftIds ?? []
  const startingHp =
    ctx.opponentMaxHp ??
    estimateMatchStartingHp(
      opponent.classId,
      evolutionId,
      arenaPhase,
      activeArenaDraftIds,
    )

  const careerStats = opponent.scoutingStats ?? EMPTY_SCOUTING_STATS

  return {
    championName: opponent.championName,
    baseClassId: opponent.classId,
    baseClassName: profile.baseName,
    evolutionId,
    evolutionName: profile.evolutionName,
    displayTitle: profile.displayTitle,
    startingHp,
    deckSize: resolveDeckSizeForScouting(opponent.deck, opponent.classId),
    arenaLivesRemaining: opponent.lives,
    winCount: opponent.opponentsDefeated,
    topPlayedCards: getTopPlayedCards(careerStats.cardPlayCounts),
    activeArenaDraftIds,
    careerStats,
  }
}

export function buildMatchIntroductionSnapshot(
  ctx: ScoutingIntelContext,
): MatchIntroductionSnapshot {
  const scouting = buildOpponentScoutingReport(ctx)
  const selfEvolution =
    ctx.selfEvolutionId ?? ctx.selfPlayer.evolutionId ?? null
  const selfProfile = resolveClassIdentity(
    createClassIdentity(ctx.selfPlayer.classId, selfEvolution),
  )
  const activeDraftIds = ctx.lobby?.activeDraftIds ?? []

  const selfMaxHp =
    ctx.selfMaxHp ??
    estimateMatchStartingHp(
      ctx.selfPlayer.classId,
      selfEvolution,
      ctx.arenaPhase,
      activeDraftIds,
    )
  const oppMaxHp = ctx.opponentMaxHp ?? scouting.startingHp

  const rivalIntroRaw = buildRivalMatchIntro(ctx.selfPlayer, ctx.opponent)
  const rival = rivalIntroRaw
    ? applyRivalIntroExtensions(
        rivalIntroRaw,
        ctx.selfPlayer,
        ctx.opponent,
      )
    : null

  return {
    arenaPhase: ctx.arenaPhase,
    arenaPhaseLabel: formatArenaPhaseLabel(ctx.arenaPhase),
    finalDuelSeriesLabel: ctx.finalDuelSeriesLabel ?? null,
    rival,
    you: {
      championName: ctx.selfPlayer.championName,
      classId: ctx.selfPlayer.classId,
      evolutionId: selfEvolution,
      displayTitle: selfProfile.displayTitle,
      hp: ctx.selfHp ?? selfMaxHp,
      maxHp: selfMaxHp,
    },
    opponent: {
      championName: scouting.championName,
      classId: scouting.baseClassId,
      evolutionId: scouting.evolutionId,
      displayTitle: scouting.displayTitle,
      hp: ctx.opponentHp ?? oppMaxHp,
      maxHp: oppMaxHp,
    },
    scouting,
  }
}

/** Future advanced scouting can implement this and merge into OpponentScoutingReport. */
export interface ScoutingIntelExtension {
  id: string
  enrich: (
    report: OpponentScoutingReport,
    ctx: ScoutingIntelContext,
  ) => OpponentScoutingReport
}

export const SCOUTING_INTEL_EXTENSIONS: ScoutingIntelExtension[] = []

export function applyScoutingExtensions(
  report: OpponentScoutingReport,
  ctx: ScoutingIntelContext,
): OpponentScoutingReport {
  return SCOUTING_INTEL_EXTENSIONS.reduce(
    (acc, ext) => ext.enrich(acc, ctx),
    report,
  )
}
