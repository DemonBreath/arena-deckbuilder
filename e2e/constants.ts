export const DEFAULT_BASE_URL = 'https://overdrive-rosy.vercel.app'

/** Fixed code for manual runs; otherwise unique per test to avoid stale lobby players. */
export function resolveLobbyCode(): string {
  if (process.env.E2E_LOBBY_CODE) return process.env.E2E_LOBBY_CODE
  const suffix = (Date.now() % 1_000_000).toString(36).toUpperCase().padStart(4, '0')
  return `TB${suffix}`.slice(0, 8)
}

export const PLAYER_A = {
  name: 'BotA',
  classId: 'guardian',
} as const

export const PLAYER_B = {
  name: 'BotB',
  classId: 'berserker',
} as const

/** Smoke test: entire spec should finish under ~60s. */
export const SMOKE_TEST_TIMEOUT_MS = 60 * 1000

/** Smoke: one Final Duel game then exit at post-match. */
export const SMOKE_COMBAT_TIMEOUT_MS = 45 * 1000

/** Full Final Duel best-of-3 series (up to 3 games + shop between). */
export const FINAL_DUEL_TEST_TIMEOUT_MS = 15 * 60 * 1000

/** Per-game combat budget inside a series run. */
export const FINAL_DUEL_GAME_COMBAT_TIMEOUT_MS = 5 * 60 * 1000

/** Legacy default when running all combat helpers without a mode override. */
export const COMBAT_TIMEOUT_MS = SMOKE_COMBAT_TIMEOUT_MS
