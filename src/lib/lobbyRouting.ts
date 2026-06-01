import { isValidLobbyCode, normalizeLobbyCode } from '../services/lobbyService'

const LOBBY_PATH_PREFIX = '/lobby/'

function stripBasePath(pathname: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  if (base === '/' || base === '') return pathname
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  if (
    pathname === normalizedBase ||
    pathname.startsWith(`${normalizedBase}/`)
  ) {
    const stripped = pathname.slice(normalizedBase.length)
    return stripped === '' ? '/' : stripped
  }
  return pathname
}

export function getLobbyCodeFromPath(pathname = window.location.pathname): string | null {
  const appPath = stripBasePath(pathname)
  const prefix = LOBBY_PATH_PREFIX
  if (!appPath.toLowerCase().startsWith(prefix.toLowerCase())) {
    return null
  }

  const raw = appPath.slice(prefix.length).split('/')[0] ?? ''
  const code = normalizeLobbyCode(decodeURIComponent(raw))
  if (!isValidLobbyCode(code)) return null
  return code
}

export function buildLobbyPath(lobbyCode: string): string {
  return `${LOBBY_PATH_PREFIX}${normalizeLobbyCode(lobbyCode)}`
}

export function buildLobbyInviteUrl(lobbyCode: string): string {
  const base = window.location.origin
  const basePath = import.meta.env.BASE_URL ?? '/'
  const normalizedBase = basePath.endsWith('/')
    ? basePath.slice(0, -1)
    : basePath
  return `${base}${normalizedBase}${buildLobbyPath(lobbyCode)}`
}

export function replaceLobbyPath(lobbyCode: string): void {
  const path = buildLobbyPath(lobbyCode)
  if (window.location.pathname !== path) {
    window.history.replaceState(null, '', path)
  }
}

export function pushLobbyPath(lobbyCode: string): void {
  const path = buildLobbyPath(lobbyCode)
  if (window.location.pathname !== path) {
    window.history.pushState(null, '', path)
  }
}

export function clearLobbyPath(): void {
  const base = import.meta.env.BASE_URL ?? '/'
  const home = base.endsWith('/') ? base : `${base}/`
  if (window.location.pathname !== home && window.location.pathname !== '/') {
    window.history.replaceState(null, '', home)
  }
}

export function subscribeToLobbyPath(
  onCodeChange: (code: string | null) => void,
): () => void {
  const notify = () => onCodeChange(getLobbyCodeFromPath())
  window.addEventListener('popstate', notify)
  return () => window.removeEventListener('popstate', notify)
}
