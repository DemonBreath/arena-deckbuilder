/**
 * Arena phase rules — scales danger as the lobby shrinks (Milestone 23).
 * Designed for future modifiers and tournament formats via ArenaPhaseConfig.
 */

export type ArenaPhase =
  | 'normal'
  | 'sudden_death_1'
  | 'sudden_death_2'
  | 'final_duel'

/** First to this many game wins in a final-duel series. */
export const FINAL_DUEL_WINS_REQUIRED = 2

export interface ArenaPhaseConfig {
  phase: ArenaPhase
  /** UI title, e.g. "Sudden Death — Level 1". */
  label: string
  shortLabel: string
  description: string
  /** HP subtracted from each player's max at match start (both players). */
  startingHpPenalty: number
  matchTimeoutMs: number
  turnDurationMs: number
  /** Banner text when this phase is active; null for normal. */
  warningMessage: string | null
  /** Accent for CSS modifier class. */
  severity: 'none' | 'low' | 'high' | 'final'
}

const MATCH_TIMEOUT_NORMAL_MS = 20 * 60 * 1000
const MATCH_TIMEOUT_SD2_MS = 12 * 60 * 1000
const MATCH_TIMEOUT_FINAL_MS = 15 * 60 * 1000

const TURN_DURATION_NORMAL_MS = 60_000
const TURN_DURATION_SD2_MS = 45_000
const TURN_DURATION_FINAL_MS = 50_000

const PHASE_CONFIG: Record<ArenaPhase, ArenaPhaseConfig> = {
  normal: {
    phase: 'normal',
    label: 'Standard Arena',
    shortLabel: 'Normal',
    description: 'Standard rules — full starting HP and default timers.',
    startingHpPenalty: 0,
    matchTimeoutMs: MATCH_TIMEOUT_NORMAL_MS,
    turnDurationMs: TURN_DURATION_NORMAL_MS,
    warningMessage: null,
    severity: 'none',
  },
  sudden_death_1: {
    phase: 'sudden_death_1',
    label: 'Sudden Death — Level 1',
    shortLabel: 'Sudden Death I',
    description:
      'The arena tightens — every fighter starts each match with 2 less HP.',
    startingHpPenalty: 2,
    matchTimeoutMs: MATCH_TIMEOUT_NORMAL_MS,
    turnDurationMs: TURN_DURATION_NORMAL_MS,
    warningMessage:
      'Sudden Death Level 1 — all players start matches with −2 HP.',
    severity: 'low',
  },
  sudden_death_2: {
    phase: 'sudden_death_2',
    label: 'Sudden Death — Level 2',
    shortLabel: 'Sudden Death II',
    description:
      'Maximum pressure — −5 HP at match start and shorter match timers.',
    startingHpPenalty: 5,
    matchTimeoutMs: MATCH_TIMEOUT_SD2_MS,
    turnDurationMs: TURN_DURATION_SD2_MS,
    warningMessage:
      'Sudden Death Level 2 — −5 HP at match start and reduced timers.',
    severity: 'high',
  },
  final_duel: {
    phase: 'final_duel',
    label: 'Final Duel',
    shortLabel: 'Final Duel',
    description:
      'Best-of-3 series — first to 2 match wins is crowned Champion.',
    startingHpPenalty: 3,
    matchTimeoutMs: MATCH_TIMEOUT_FINAL_MS,
    turnDurationMs: TURN_DURATION_FINAL_MS,
    warningMessage:
      'Final Duel — best-of-3. First to 2 match wins takes the crown.',
    severity: 'final',
  },
}

/**
 * Resolve phase from active (non-eliminated) player count.
 * 7–8: normal · 5–6: SD1 · 3–4: SD2 · 2: final duel
 */
export function resolveArenaPhase(activePlayerCount: number): ArenaPhase {
  if (activePlayerCount <= 2) return 'final_duel'
  if (activePlayerCount <= 4) return 'sudden_death_2'
  if (activePlayerCount <= 6) return 'sudden_death_1'
  return 'normal'
}

export function getArenaPhaseConfig(phase: ArenaPhase): ArenaPhaseConfig {
  return PHASE_CONFIG[phase]
}

export function getArenaPhaseConfigForPlayerCount(
  activePlayerCount: number,
): ArenaPhaseConfig {
  return getArenaPhaseConfig(resolveArenaPhase(activePlayerCount))
}

export function applyArenaStartingHp(
  maxHp: number,
  phase: ArenaPhase,
): number {
  const penalty = getArenaPhaseConfig(phase).startingHpPenalty
  return Math.max(1, maxHp - penalty)
}

export function getMatchTimeoutMs(phase: ArenaPhase): number {
  return getArenaPhaseConfig(phase).matchTimeoutMs
}

export function getTurnDurationMs(phase: ArenaPhase): number {
  return getArenaPhaseConfig(phase).turnDurationMs
}

export function formatArenaPhaseLabel(phase: ArenaPhase): string {
  return getArenaPhaseConfig(phase).label
}

export function formatFinalDuelSeriesScore(
  myPlayerId: string,
  player1Id: string,
  player2Id: string,
  p1Wins: number,
  p2Wins: number,
): string {
  const myWins =
    myPlayerId === player1Id
      ? p1Wins
      : myPlayerId === player2Id
        ? p2Wins
        : 0
  const oppWins =
    myPlayerId === player1Id
      ? p2Wins
      : myPlayerId === player2Id
        ? p1Wins
        : 0
  return `Series ${myWins}–${oppWins} (first to ${FINAL_DUEL_WINS_REQUIRED})`
}

export function isFinalDuelSeriesComplete(
  p1Wins: number,
  p2Wins: number,
): boolean {
  return (
    p1Wins >= FINAL_DUEL_WINS_REQUIRED || p2Wins >= FINAL_DUEL_WINS_REQUIRED
  )
}

export function parseArenaPhase(raw: unknown): ArenaPhase {
  if (
    raw === 'normal' ||
    raw === 'sudden_death_1' ||
    raw === 'sudden_death_2' ||
    raw === 'final_duel'
  ) {
    return raw
  }
  return 'normal'
}
