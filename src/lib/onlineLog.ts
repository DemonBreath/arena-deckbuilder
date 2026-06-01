/** Structured console logging for online multiplayer debugging. */
export function logOnlineError(scope: string, err: unknown): void {
  console.error(`[arena-online:${scope}]`, err)
}

export function logOnlineWarn(scope: string, message: string): void {
  console.warn(`[arena-online:${scope}]`, message)
}
