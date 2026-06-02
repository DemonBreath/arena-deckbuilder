# Production database migration (Milestones 8–26)

The live deployment at [https://overdrive-rosy.vercel.app](https://overdrive-rosy.vercel.app) can outpace the Supabase schema if migrations were not applied after Milestone 22+. This guide brings production in line with the current app through **Milestone 26**.

## What broke (Playwright finding)

When two bots join a lobby and the host clicks **Start Round**, the app calls `ensureFinalDuelLobby()` in `src/services/arenaService.ts`, which updates:

- `lobbies.final_duel_player_1_id`
- `lobbies.final_duel_player_2_id`
- `lobbies.final_duel_p1_wins`
- `lobbies.final_duel_p2_wins`

Those columns were added in **`supabase/migrations/023_sudden_death_arena.sql`** (Milestone 23). If they are missing, Supabase returns:

```text
Could not find the 'final_duel_p1_wins' column of 'lobbies' in the schema cache
```

Round start never completes, so Playwright never reaches the match room.

## Migration that introduced Final Duel fields

| File | Milestone | Changes |
|------|-----------|---------|
| `supabase/migrations/023_sudden_death_arena.sql` | 23 | `lobbies`: `final_duel_player_1_id`, `final_duel_player_2_id`, `final_duel_p1_wins`, `final_duel_p2_wins`; `matches`: `arena_phase`, `final_duel_game` |

Later milestones (also required for full app behavior):

| File | Milestone | Changes |
|------|-----------|---------|
| `supabase/migrations/024_arena_draft.sql` | 24 | `lobbies`: draft columns; `status` includes `arena_draft` |
| `supabase/migrations/025_scouting_intelligence.sql` | 25 | `lobby_players`: `evolution_id`, `scouting_stats` |
| `supabase/migrations/026_rival_system.sql` | 26 | `lobby_players`: `rival_history` |

Older incremental files (if production was created before `schema.sql` was updated):

- `supabase/migration_m8_matches.sql` through `supabase/migration_m18_class_id.sql`

**Canonical full schema:** `supabase/schema.sql`

**Single repair script (use this on production):** `supabase/fix_production_schema.sql`

---

## Step 1 — Run the repair SQL

### Exact SQL to run

Open the file **`supabase/fix_production_schema.sql`** in this repo and run its **entire contents** in Supabase.

### Supabase dashboard steps

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and open the project used by Vercel (`VITE_SUPABASE_URL`).
2. Left sidebar → **SQL Editor**.
3. Click **New query**.
4. Copy the full contents of `supabase/fix_production_schema.sql` from the repo and paste into the editor.
5. Click **Run** (or Ctrl+Enter).
6. Confirm success: no red error panel; result should show statements executed successfully.
7. The script ends with `notify pgrst, 'reload schema';` to refresh the API schema cache. If errors persist for ~1 minute, run this alone in a second query:

   ```sql
   notify pgrst, 'reload schema';
   ```

### Expected results

- **SQL Editor:** `Success. No rows returned` (normal for DDL).
- **Table Editor → `lobbies`:** columns include `final_duel_p1_wins`, `final_duel_p2_wins`, `final_duel_player_1_id`, `final_duel_player_2_id`, `active_draft_ids`, …
- **Table Editor → `matches`:** columns include `arena_phase`, `final_duel_game`.
- **Table Editor → `lobby_players`:** columns include `scouting_stats`, `rival_history`, `evolution_id`, `class_id`.
- **Live app:** starting a 2-player lobby no longer shows the schema cache error on **Start Round**.

---

## Step 2 — Verify from your machine

Ensure `.env` matches the **same** Supabase project as production:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Install dependencies and run the checker:

```bash
npm install
npm run check:schema
```

### Expected checker output (pass)

```text
Arena Deckbuilder — Supabase schema check
Project: https://<your-project>.supabase.co
Reference: supabase/schema.sql (Milestones 8–26)

PASS  table lobbies — table reachable
      PASS  column lobbies.final_duel_p1_wins
      ...
Summary: N passed, 0 failed

All expected tables and columns are visible to the API.
```

Any `FAIL  column lobbies.final_duel_p1_wins` means the SQL did not apply to this project or the schema cache did not reload.

---

## Step 3 — Re-run Playwright

```bash
npm run test:e2e
```

With schema fixed, bots should pass **Start Round**, enter the match room, and run the combat loop.

---

## Columns verified by `check_schema.ts`

### `lobbies`

| Column | Milestone |
|--------|-----------|
| `round_number`, `champion_player_id` | 10 |
| `final_duel_player_1_id`, `final_duel_player_2_id`, `final_duel_p1_wins`, `final_duel_p2_wins` | 23 |
| `active_draft_ids`, `draft_history`, `draft_session`, `last_draft_result` | 24 |

### `lobby_players`

| Column | Milestone |
|--------|-----------|
| `lives`, `eliminated` | 9 |
| `gold`, `opponents_defeated`, `shop_done`, `deck`, `relics` | 10 |
| `last_seen_at` | 14 |
| `class_id` | 18 |
| `evolution_id`, `scouting_stats` | 25 |
| `rival_history` | 26 |

### `matches`

| Column | Milestone |
|--------|-----------|
| `battle_state`, `state_version`, `winner_player_id` | 9 |
| `turn_start_at`, `battle_started_at` | 15 |
| `arena_phase`, `final_duel_game` | 23 |

### `daily_champions`

No changes after Milestone 11. The repair script creates the table and indexes if they were never added.

---

## Realtime (optional but recommended)

In Supabase → **Database** → **Publications** → `supabase_realtime`, ensure these tables are enabled:

- `lobbies`
- `lobby_players`
- `matches`
- `lobby_pairing_byes`

---

## Troubleshooting

| Symptom | Action |
|---------|--------|
| Same schema cache error after SQL | Run `notify pgrst, 'reload schema';` again; wait 60s; hard-refresh the game |
| `check:schema` fails on a column | Re-run `fix_production_schema.sql`; confirm `.env` points at production project |
| Start Round works but draft/scouting fails | Confirm M24–M26 columns exist (checker lists them) |
| Permission errors in checker | Confirm RLS policies exist (repair script recreates anon policies) |
