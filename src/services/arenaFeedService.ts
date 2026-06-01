import type { Lobby, LobbyPlayer } from '../types/lobby'
import type { PvpMatch } from '../types/match'
import type { ArenaFeedEntry } from '../types/spectator'
import { getOpponentId } from '../types/match'

export interface ArenaSnapshot {
  lobby: Lobby | null
  players: LobbyPlayer[]
  matches: PvpMatch[]
}

function playerName(
  players: LobbyPlayer[],
  playerId: string | null | undefined,
): string {
  if (!playerId) return 'Unknown'
  return players.find((p) => p.id === playerId)?.championName ?? 'Unknown'
}

export function deriveArenaFeedEvents(
  prev: ArenaSnapshot | null,
  next: ArenaSnapshot,
): ArenaFeedEntry[] {
  if (!prev) return []

  const events: ArenaFeedEntry[] = []
  const now = Date.now()

  for (const match of next.matches) {
    const old = prev.matches.find((m) => m.id === match.id)
    if (!old && match.player2Id) {
      events.push({
        id: `start-${match.id}`,
        kind: 'match_started',
        message: `Match started: ${playerName(next.players, match.player1Id)} vs ${playerName(next.players, match.player2Id)}`,
        at: now,
      })
      continue
    }

    if (
      old &&
      old.status !== 'completed' &&
      match.status === 'completed' &&
      match.winnerPlayerId
    ) {
      const loserId = getOpponentId(match, match.winnerPlayerId)
      events.push({
        id: `defeat-${match.id}-${match.stateVersion}`,
        kind: 'defeated',
        message: `${playerName(next.players, match.winnerPlayerId)} defeated ${playerName(next.players, loserId)}`,
        at: now,
      })
    }
  }

  for (const player of next.players) {
    const old = prev.players.find((p) => p.id === player.id)
    if (old && !old.eliminated && player.eliminated) {
      events.push({
        id: `elim-${player.id}`,
        kind: 'eliminated',
        message: `${player.championName} eliminated`,
        at: now,
      })
    }
  }

  if (
    prev.lobby?.status !== 'finished' &&
    next.lobby?.status === 'finished'
  ) {
    const champ = next.players.find(
      (p) => p.id === next.lobby?.championPlayerId,
    )
    events.push({
      id: `champion-${next.lobby?.id ?? 'lobby'}`,
      kind: 'champion',
      message: `Champion crowned: ${champ?.championName ?? 'Unknown'}`,
      at: now,
    })
  }

  return events
}

export function mergeFeedEntries(
  existing: ArenaFeedEntry[],
  incoming: ArenaFeedEntry[],
  maxEntries = 40,
): ArenaFeedEntry[] {
  const seen = new Set(existing.map((e) => e.id))
  const merged = [...existing]

  for (const entry of incoming) {
    if (seen.has(entry.id)) continue
    seen.add(entry.id)
    merged.unshift(entry)
  }

  return merged.slice(0, maxEntries)
}
