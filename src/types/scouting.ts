import type { ArenaDraftId } from '../game/arenaDrafts'
import type { ArenaPhase } from '../game/arenaPhase'
import type { CardId } from '../game/cardDatabase'
import type { ClassId } from '../game/classDatabase'
import type { EvolutionId } from '../game/classEvolutions'
import type { RivalMatchIntro } from './rivals'

/** Cumulative run statistics persisted per lobby player (information only). */
export interface PlayerScoutingStats {
  matchesWon: number
  damageDealt: number
  damageTaken: number
  cardsPlayed: number
  cardPlayCounts: Partial<Record<CardId, number>>
}

export const EMPTY_SCOUTING_STATS: PlayerScoutingStats = {
  matchesWon: 0,
  damageDealt: 0,
  damageTaken: 0,
  cardsPlayed: 0,
  cardPlayCounts: {},
}

/** A frequently played card surfaced in scouting (no deck contents). */
export interface ScoutedCardInsight {
  cardId: CardId
  cardName: string
  timesPlayed: number
}

/** Opponent intel shown before combat — extend via ScoutingIntelBuilder hooks. */
export interface OpponentScoutingReport {
  championName: string
  baseClassId: ClassId
  baseClassName: string
  evolutionId: EvolutionId | null
  evolutionName: string | null
  displayTitle: string
  startingHp: number
  deckSize: number
  arenaLivesRemaining: number
  winCount: number
  topPlayedCards: ScoutedCardInsight[]
  activeArenaDraftIds: ArenaDraftId[]
  careerStats: PlayerScoutingStats
}

/** Match introduction header — both fighters + arena context. */
export interface MatchIntroductionSnapshot {
  arenaPhase: ArenaPhase
  arenaPhaseLabel: string
  finalDuelSeriesLabel: string | null
  you: {
    championName: string
    classId: ClassId
    evolutionId: EvolutionId | null
    displayTitle: string
    hp: number
    maxHp: number
  }
  opponent: {
    championName: string
    classId: ClassId
    evolutionId: EvolutionId | null
    displayTitle: string
    hp: number
    maxHp: number
  }
  scouting: OpponentScoutingReport
  /** Present when the opponent is a run-long rival. */
  rival: RivalMatchIntro | null
}
