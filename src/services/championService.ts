import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient'

export const CHAMPION_NAME_MAX_LENGTH = 20

export interface ChampionEntry {
  id: string
  date: string
  championName: string
  lobbyCode: string
  opponentsDefeated: number
  relicCount: number
  finalDeckSize: number
  totalGoldEarned: number
  submittedAt: number
}

export type ChampionSubmission = Omit<ChampionEntry, 'id' | 'submittedAt'>

export type ChampionSubmitResult = {
  success: boolean
  entry?: ChampionEntry
  error?: string
  source: 'supabase' | 'local'
}

const STORAGE_KEY_DAILY = 'arena-daily-champions'
const STORAGE_KEY_ALLTIME = 'arena-alltime-champions'

interface ChampionRow {
  id: string
  champion_name: string
  lobby_code: string
  date: string
  opponents_defeated: number
  final_deck_size: number
  relic_count: number
  total_gold_earned: number
  created_at: string
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getTodayDateLabel(): string {
  return getTodayDateString()
}

export function sanitizeChampionName(name: string): string {
  return name.trim().slice(0, CHAMPION_NAME_MAX_LENGTH)
}

export function validateChampionName(name: string): string | null {
  const sanitized = sanitizeChampionName(name)
  if (!sanitized) {
    return 'Champion name cannot be empty.'
  }
  if (sanitized.length > CHAMPION_NAME_MAX_LENGTH) {
    return `Champion name must be ${CHAMPION_NAME_MAX_LENGTH} characters or fewer.`
  }
  return null
}

function mapRow(row: ChampionRow): ChampionEntry {
  return {
    id: row.id,
    date: row.date,
    championName: row.champion_name,
    lobbyCode: row.lobby_code,
    opponentsDefeated: row.opponents_defeated,
    relicCount: row.relic_count,
    finalDeckSize: row.final_deck_size,
    totalGoldEarned: row.total_gold_earned,
    submittedAt: new Date(row.created_at).getTime(),
  }
}

function normalizeSubmission(
  submission: ChampionSubmission,
): ChampionSubmission | null {
  const nameError = validateChampionName(submission.championName)
  if (nameError) return null

  const lobbyCode = submission.lobbyCode.trim().toUpperCase().slice(0, 8)
  if (!lobbyCode) return null

  return {
    date: submission.date || getTodayDateString(),
    championName: sanitizeChampionName(submission.championName),
    lobbyCode,
    opponentsDefeated: Math.max(0, submission.opponentsDefeated),
    relicCount: Math.max(0, submission.relicCount),
    finalDeckSize: Math.max(0, submission.finalDeckSize),
    totalGoldEarned: Math.max(0, submission.totalGoldEarned),
  }
}

function readStorage(key: string): ChampionEntry[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChampionEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.map((entry) => ({
      ...entry,
      lobbyCode: entry.lobbyCode ?? 'SOLO',
    }))
  } catch {
    return []
  }
}

function writeStorage(key: string, entries: ChampionEntry[]): void {
  localStorage.setItem(key, JSON.stringify(entries))
}

function submitChampionLocal(submission: ChampionSubmission): ChampionEntry {
  const entry: ChampionEntry = {
    ...submission,
    id: generateId(),
    submittedAt: Date.now(),
  }

  const daily = readStorage(STORAGE_KEY_DAILY)
  daily.push(entry)
  writeStorage(STORAGE_KEY_DAILY, daily)

  const allTime = readStorage(STORAGE_KEY_ALLTIME)
  allTime.push(entry)
  writeStorage(STORAGE_KEY_ALLTIME, allTime)

  return entry
}

async function submitChampionSupabase(
  submission: ChampionSubmission,
): Promise<ChampionEntry> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('daily_champions')
    .insert({
      champion_name: submission.championName,
      lobby_code: submission.lobbyCode,
      date: submission.date,
      opponents_defeated: submission.opponentsDefeated,
      final_deck_size: submission.finalDeckSize,
      relic_count: submission.relicCount,
      total_gold_earned: submission.totalGoldEarned,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to submit champion to leaderboard.')
  }

  return mapRow(data as ChampionRow)
}

async function fetchDailyChampionsSupabase(
  date: string,
): Promise<ChampionEntry[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('daily_champions')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data as ChampionRow[]).map(mapRow)
}

async function fetchAllTimeChampionsSupabase(): Promise<ChampionEntry[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('daily_champions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data as ChampionRow[]).map(mapRow)
}

/**
 * Submit a champion to the public board (Supabase) or localStorage fallback.
 */
export async function submitChampionPublic(
  submission: ChampionSubmission,
): Promise<ChampionSubmitResult> {
  const normalized = normalizeSubmission(submission)
  if (!normalized) {
    return {
      success: false,
      error: validateChampionName(submission.championName) ?? 'Invalid submission.',
      source: isSupabaseConfigured() ? 'supabase' : 'local',
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const entry = await submitChampionSupabase(normalized)
      submitChampionLocal(normalized)
      return { success: true, entry, source: 'supabase' }
    } catch (err) {
      try {
        const entry = submitChampionLocal(normalized)
        return {
          success: true,
          entry,
          source: 'local',
          error:
            err instanceof Error
              ? `${err.message} Saved locally instead.`
              : 'Saved locally instead.',
        }
      } catch {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : 'Failed to submit champion.',
          source: 'supabase',
        }
      }
    }
  }

  try {
    const entry = submitChampionLocal(normalized)
    return { success: true, entry, source: 'local' }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save champion locally.',
      source: 'local',
    }
  }
}

export async function fetchDailyChampions(
  date?: string,
): Promise<ChampionEntry[]> {
  const targetDate = date ?? getTodayDateString()

  if (isSupabaseConfigured()) {
    try {
      return await fetchDailyChampionsSupabase(targetDate)
    } catch {
      /* fall through to local */
    }
  }

  return readStorage(STORAGE_KEY_DAILY)
    .filter((entry) => entry.date === targetDate)
    .sort((a, b) => b.submittedAt - a.submittedAt)
}

export async function fetchAllTimeChampions(): Promise<ChampionEntry[]> {
  if (isSupabaseConfigured()) {
    try {
      return await fetchAllTimeChampionsSupabase()
    } catch {
      /* fall through to local */
    }
  }

  return readStorage(STORAGE_KEY_ALLTIME).sort(
    (a, b) => b.submittedAt - a.submittedAt,
  )
}

/** @deprecated Use submitChampionPublic — kept for sync local-only paths */
export function submitChampion(submission: ChampionSubmission): ChampionEntry {
  const normalized = normalizeSubmission(submission)
  if (!normalized) {
    throw new Error('Invalid champion submission.')
  }
  return submitChampionLocal(normalized)
}

/** @deprecated Use fetchDailyChampions */
export function getDailyChampions(date?: string): ChampionEntry[] {
  const targetDate = date ?? getTodayDateString()
  return readStorage(STORAGE_KEY_DAILY)
    .filter((entry) => entry.date === targetDate)
    .sort((a, b) => b.submittedAt - a.submittedAt)
}

/** @deprecated Use fetchAllTimeChampions */
export function getAllTimeChampions(): ChampionEntry[] {
  return readStorage(STORAGE_KEY_ALLTIME).sort(
    (a, b) => b.submittedAt - a.submittedAt,
  )
}

export function buildChampionSubmission(
  championName: string,
  lobbyCode: string,
  opponentsDefeated: number,
  relicCount: number,
  finalDeckSize: number,
  totalGoldEarned: number,
): ChampionSubmission {
  return {
    date: getTodayDateString(),
    championName: sanitizeChampionName(championName),
    lobbyCode: lobbyCode.trim().toUpperCase().slice(0, 8) || 'SOLO',
    opponentsDefeated,
    relicCount,
    finalDeckSize,
    totalGoldEarned,
  }
}

export function isLeaderboardOnline(): boolean {
  return isSupabaseConfigured()
}
