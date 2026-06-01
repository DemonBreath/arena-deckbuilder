const SESSION_STORAGE_KEY = 'arena-session-id'

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/** Stable anonymous browser session — no login required. */
export function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (existing) return existing
    const created = generateSessionId()
    sessionStorage.setItem(SESSION_STORAGE_KEY, created)
    return created
  } catch {
    return generateSessionId()
  }
}
