/**
 * Verifies production Supabase schema against supabase/schema.sql (Milestones 8–26).
 *
 * Usage:
 *   npm run check:schema
 *
 * Requires .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * (same variables the Vite app uses).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/** Tables the online app reads/writes (from supabase/schema.sql). */
const EXPECTED_TABLES = [
  'lobbies',
  'lobby_players',
  'matches',
  'lobby_pairing_byes',
  'daily_champions',
] as const

/**
 * Columns required by src/services/* (derived from schema.sql + migrations 023–026).
 * Milestone tags match supabase/migrations and migration_m*.sql files.
 */
const EXPECTED_COLUMNS: Record<(typeof EXPECTED_TABLES)[number], string[]> = {
  lobbies: [
    'id',
    'code',
    'status',
    'round_number', // M10
    'champion_player_id', // M10
    'final_duel_player_1_id', // M23
    'final_duel_player_2_id', // M23
    'final_duel_p1_wins', // M23 — Playwright failure column
    'final_duel_p2_wins', // M23
    'active_draft_ids', // M24
    'draft_history', // M24
    'draft_session', // M24
    'last_draft_result', // M24
    'created_at',
  ],
  lobby_players: [
    'id',
    'lobby_id',
    'session_id',
    'champion_name',
    'class_id', // M18
    'ready',
    'lives', // M9
    'eliminated', // M9
    'gold', // M10
    'opponents_defeated', // M10
    'shop_done', // M10
    'deck', // M10
    'relics', // M10
    'evolution_id', // M25
    'scouting_stats', // M25
    'rival_history', // M26
    'joined_at',
    'last_seen_at', // M14
  ],
  matches: [
    'id',
    'lobby_id',
    'lobby_code',
    'player_1_id',
    'player_2_id',
    'player_1_loaded',
    'player_2_loaded',
    'status',
    'battle_state', // M9
    'state_version', // M9
    'winner_player_id', // M9
    'created_at',
    'turn_start_at', // M15
    'battle_started_at', // M15
    'arena_phase', // M23
    'final_duel_game', // M23
  ],
  lobby_pairing_byes: ['id', 'lobby_id', 'player_id', 'created_at'],
  daily_champions: [
    'id',
    'champion_name',
    'lobby_code',
    'date',
    'opponents_defeated',
    'final_deck_size',
    'relic_count',
    'total_gold_earned',
    'created_at',
  ],
}

type TableName = (typeof EXPECTED_TABLES)[number]

interface CheckResult {
  ok: boolean
  detail: string
}

function loadEnvFile(): void {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return

  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function getSupabase(): SupabaseClient {
  loadEnvFile()
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error(
      'FAIL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env',
    )
    process.exit(1)
  }

  return createClient(url, key)
}

function isMissingColumnError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('schema cache') ||
    lower.includes('does not exist') ||
    lower.includes('could not find') ||
    lower.includes('column')
  )
}

async function checkTable(
  supabase: SupabaseClient,
  table: TableName,
): Promise<CheckResult> {
  const { error } = await supabase.from(table).select('id').limit(0)

  if (!error) {
    return { ok: true, detail: 'table reachable' }
  }

  const msg = error.message ?? String(error)
  if (msg.toLowerCase().includes('relation') && msg.toLowerCase().includes('does not exist')) {
    return { ok: false, detail: `table missing — ${msg}` }
  }

  return { ok: false, detail: msg }
}

async function checkColumn(
  supabase: SupabaseClient,
  table: TableName,
  column: string,
): Promise<CheckResult> {
  const { error } = await supabase.from(table).select(column).limit(0)

  if (!error) {
    return { ok: true, detail: 'ok' }
  }

  const msg = error.message ?? String(error)
  if (isMissingColumnError(msg)) {
    return { ok: false, detail: msg }
  }

  // Permission or RLS issues still count as failure for deploy readiness
  return { ok: false, detail: msg }
}

async function main(): Promise<void> {
  const supabase = getSupabase()
  const url = process.env.VITE_SUPABASE_URL!

  console.log('Arena Deckbuilder — Supabase schema check')
  console.log(`Project: ${url}`)
  console.log('Reference: supabase/schema.sql (Milestones 8–26)\n')

  let failures = 0
  let passes = 0

  for (const table of EXPECTED_TABLES) {
    const tableResult = await checkTable(supabase, table)
    if (tableResult.ok) {
      console.log(`PASS  table ${table} — ${tableResult.detail}`)
      passes += 1
    } else {
      console.log(`FAIL  table ${table} — ${tableResult.detail}`)
      failures += 1
      continue
    }

    for (const column of EXPECTED_COLUMNS[table]) {
      const colResult = await checkColumn(supabase, table, column)
      if (colResult.ok) {
        console.log(`      PASS  column ${table}.${column}`)
        passes += 1
      } else {
        console.log(`      FAIL  column ${table}.${column} — ${colResult.detail}`)
        failures += 1
      }
    }
  }

  console.log('')
  console.log(`Summary: ${passes} passed, ${failures} failed`)

  if (failures > 0) {
    console.log('')
    console.log(
      'Repair: run supabase/fix_production_schema.sql in the Supabase SQL Editor,',
    )
    console.log('then re-run npm run check:schema')
    process.exit(1)
  }

  console.log('')
  console.log('All expected tables and columns are visible to the API.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
