import {
  ARENA_DRAFT_VOTE_DURATION_MS,
  getArenaDraftDefinition,
  parseArenaDraftId,
  rollArenaDraftOptions,
  shouldTriggerArenaDraft,
  type ArenaDraftId,
} from '../game/arenaDrafts'
import { sanitizePvpDeck } from '../game/pvpBattleState'
import { getSupabaseClient } from '../lib/supabaseClient'
import { getActivePlayers } from './arenaService'
import { fetchLobby, fetchLobbyPlayers } from './lobbyService'
import type {
  ArenaDraftResultSummary,
  ArenaDraftVoteSession,
} from '../types/arenaDraft'
import type { Lobby } from '../types/lobby'

function parseDraftIds(raw: unknown): ArenaDraftId[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => parseArenaDraftId(item))
    .filter((id): id is ArenaDraftId => id !== null)
}

function parseDraftSession(raw: unknown): ArenaDraftVoteSession | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  if (!Array.isArray(row.options) || row.options.length === 0) return null

  const options = row.options
    .map((o) => parseArenaDraftId(o))
    .filter((id): id is ArenaDraftId => id !== null)
  if (options.length === 0) return null

  const votes: Record<string, number> = {}
  if (row.votes && typeof row.votes === 'object') {
    for (const [playerId, index] of Object.entries(
      row.votes as Record<string, unknown>,
    )) {
      if (typeof index === 'number' && index >= 0 && index < options.length) {
        votes[playerId] = index
      }
    }
  }

  const voteCounts = Array.isArray(row.voteCounts)
    ? row.voteCounts.map((n) => (typeof n === 'number' ? n : 0))
    : null

  const winnerId = parseArenaDraftId(row.winnerId)

  return {
    roundNumber:
      typeof row.roundNumber === 'number' ? row.roundNumber : 1,
    options,
    votes,
    endsAt: typeof row.endsAt === 'string' ? row.endsAt : new Date().toISOString(),
    status: row.status === 'resolved' ? 'resolved' : 'voting',
    winnerId,
    voteCounts,
  }
}

function parseLastDraftResult(raw: unknown): ArenaDraftResultSummary | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const winnerId = parseArenaDraftId(row.winnerId)
  const options = parseDraftIds(row.options)
  if (!winnerId || options.length === 0) return null
  return {
    roundNumber: typeof row.roundNumber === 'number' ? row.roundNumber : 1,
    winnerId,
    options,
    voteCounts: Array.isArray(row.voteCounts)
      ? row.voteCounts.map((n) => (typeof n === 'number' ? n : 0))
      : [],
  }
}

export function mapLobbyDraftFields(row: {
  active_draft_ids?: unknown
  draft_history?: unknown
  draft_session?: unknown
  last_draft_result?: unknown
}): {
  activeDraftIds: ArenaDraftId[]
  draftHistory: ArenaDraftId[]
  draftSession: ArenaDraftVoteSession | null
  lastDraftResult: ArenaDraftResultSummary | null
} {
  return {
    activeDraftIds: parseDraftIds(row.active_draft_ids),
    draftHistory: parseDraftIds(row.draft_history),
    draftSession: parseDraftSession(row.draft_session),
    lastDraftResult: parseLastDraftResult(row.last_draft_result),
  }
}

function pickWinningOptionIndex(voteCounts: number[]): number {
  let bestIndex = 0
  let bestCount = -1
  const tied: number[] = []

  voteCounts.forEach((count, index) => {
    if (count > bestCount) {
      bestCount = count
      bestIndex = index
      tied.length = 0
      tied.push(index)
    } else if (count === bestCount) {
      tied.push(index)
    }
  })

  if (tied.length <= 1) return bestIndex
  return tied[Math.floor(Math.random() * tied.length)]
}

async function applyThinDecksToLobby(lobbyId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const players = await fetchLobbyPlayers(lobbyId)

  for (const player of getActivePlayers(players)) {
    const deck =
      player.deck && player.deck.length > 0
        ? sanitizePvpDeck(player.deck)
        : sanitizePvpDeck([])
    if (deck.length <= 5) continue

    const removeIndex = Math.floor(Math.random() * deck.length)
    const next = [...deck]
    next.splice(removeIndex, 1)

    await supabase
      .from('lobby_players')
      .update({ deck: sanitizePvpDeck(next) })
      .eq('id', player.id)
  }
}

async function applyDraftWinnerEffects(
  lobbyId: string,
  winnerId: ArenaDraftId,
): Promise<void> {
  const def = getArenaDraftDefinition(winnerId)
  if (def.effectKind === 'remove_card') {
    await applyThinDecksToLobby(lobbyId)
  }
}

export async function startArenaDraftSession(
  lobbyId: string,
  roundNumber: number,
): Promise<Lobby | null> {
  const supabase = getSupabaseClient()
  const lobby = await fetchLobby(lobbyId)
  if (!lobby) return null

  const options = rollArenaDraftOptions(3)
  const endsAt = new Date(Date.now() + ARENA_DRAFT_VOTE_DURATION_MS).toISOString()

  const session: ArenaDraftVoteSession = {
    roundNumber,
    options,
    votes: {},
    endsAt,
    status: 'voting',
    winnerId: null,
    voteCounts: null,
  }

  const { error } = await supabase
    .from('lobbies')
    .update({
      status: 'arena_draft',
      round_number: roundNumber,
      draft_session: session,
    })
    .eq('id', lobbyId)

  if (error) throw new Error(error.message)
  return fetchLobby(lobbyId)
}

export async function castArenaDraftVote(
  lobbyId: string,
  playerId: string,
  optionIndex: number,
): Promise<Lobby | null> {
  const supabase = getSupabaseClient()
  const lobby = await fetchLobby(lobbyId)
  if (!lobby?.draftSession || lobby.draftSession.status !== 'voting') {
    return lobby
  }

  if (
    optionIndex < 0 ||
    optionIndex >= lobby.draftSession.options.length
  ) {
    throw new Error('Invalid draft option.')
  }

  const nextSession: ArenaDraftVoteSession = {
    ...lobby.draftSession,
    votes: {
      ...lobby.draftSession.votes,
      [playerId]: optionIndex,
    },
  }

  const { error } = await supabase
    .from('lobbies')
    .update({ draft_session: nextSession })
    .eq('id', lobbyId)
    .eq('status', 'arena_draft')

  if (error) throw new Error(error.message)

  const updated = await fetchLobby(lobbyId)
  await tryResolveArenaDraft(lobbyId)
  return fetchLobby(lobbyId) ?? updated
}

export async function tryResolveArenaDraft(
  lobbyId: string,
): Promise<Lobby | null> {
  const supabase = getSupabaseClient()
  const lobby = await fetchLobby(lobbyId)
  if (!lobby?.draftSession || lobby.draftSession.status !== 'voting') {
    return lobby
  }

  const players = await fetchLobbyPlayers(lobbyId)
  const active = getActivePlayers(players)
  if (active.length === 0) return lobby

  const session = lobby.draftSession
  const now = Date.now()
  const ended = now >= new Date(session.endsAt).getTime()
  const allVoted = active.every((p) => session.votes[p.id] !== undefined)

  if (!ended && !allVoted) return lobby

  const voteCounts = session.options.map((_, index) => {
    return Object.values(session.votes).filter((v) => v === index).length
  })

  const winningIndex = pickWinningOptionIndex(voteCounts)
  const winnerId = session.options[winningIndex]

  const activeDraftIds = [...lobby.activeDraftIds, winnerId]
  const draftHistory = [...lobby.draftHistory, winnerId]

  const resolvedSession: ArenaDraftVoteSession = {
    ...session,
    status: 'resolved',
    winnerId,
    voteCounts,
  }

  const lastDraftResult: ArenaDraftResultSummary = {
    roundNumber: session.roundNumber,
    winnerId,
    voteCounts,
    options: session.options,
  }

  await applyDraftWinnerEffects(lobbyId, winnerId)

  const { error } = await supabase
    .from('lobbies')
    .update({
      status: 'shop',
      active_draft_ids: activeDraftIds,
      draft_history: draftHistory,
      draft_session: resolvedSession,
      last_draft_result: lastDraftResult,
    })
    .eq('id', lobbyId)
    .eq('status', 'arena_draft')

  if (error) throw new Error(error.message)
  return fetchLobby(lobbyId)
}

/** After match progression: enter draft vote or shop. */
export async function advanceLobbyAfterRound(
  lobbyId: string,
  nextRound: number,
  skipDraft: boolean,
): Promise<void> {
  if (!skipDraft && shouldTriggerArenaDraft(nextRound)) {
    await startArenaDraftSession(lobbyId, nextRound)
    return
  }

  const supabase = getSupabaseClient()
  await supabase
    .from('lobbies')
    .update({ status: 'shop', round_number: nextRound })
    .eq('id', lobbyId)
}

export function getDraftSecondsRemaining(
  endsAt: string | null,
  nowMs = Date.now(),
): number | null {
  if (!endsAt) return null
  const end = new Date(endsAt).getTime()
  if (Number.isNaN(end)) return null
  return Math.max(0, Math.ceil((end - nowMs) / 1000))
}
