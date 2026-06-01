const STORAGE_KEY = 'arena-persisted-online-session'
const MAX_AGE_MS = 24 * 60 * 60 * 1000

export interface PersistedOnlineSession {
  playerId: string
  championName: string
  lobbyCode: string
  lobbyId: string
  sessionId: string
  matchId: string | null
  savedAt: number
}

export function savePersistedSession(session: PersistedOnlineSession): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...session, savedAt: Date.now() }),
    )
  } catch {
    /* storage full or disabled */
  }
}

export function loadPersistedSession(): PersistedOnlineSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as PersistedOnlineSession
    if (
      !parsed.playerId ||
      !parsed.championName ||
      !parsed.lobbyCode ||
      !parsed.lobbyId ||
      !parsed.sessionId
    ) {
      return null
    }

    const savedAt =
      typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now()
    if (Date.now() - savedAt > MAX_AGE_MS) {
      clearPersistedSession()
      return null
    }

    return {
      playerId: parsed.playerId,
      championName: parsed.championName,
      lobbyCode: parsed.lobbyCode,
      lobbyId: parsed.lobbyId,
      sessionId: parsed.sessionId,
      matchId: parsed.matchId ?? null,
      savedAt,
    }
  } catch {
    return null
  }
}

export function clearPersistedSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function updatePersistedMatchId(matchId: string | null): void {
  const existing = loadPersistedSession()
  if (!existing) return
  savePersistedSession({ ...existing, matchId })
}

export function persistFromLobbySession(
  session: {
    playerId: string
    championName: string
    lobbyCode: string
    lobbyId: string
    sessionId: string
  },
  matchId: string | null = null,
): void {
  savePersistedSession({
    playerId: session.playerId,
    championName: session.championName,
    lobbyCode: session.lobbyCode,
    lobbyId: session.lobbyId,
    sessionId: session.sessionId,
    matchId,
    savedAt: Date.now(),
  })
}
