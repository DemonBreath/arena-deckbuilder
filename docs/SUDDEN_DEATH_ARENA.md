# Sudden Death Arena (Milestone 23)

As the lobby shrinks, matches become more dangerous. The arena naturally accelerates toward a champion.

## Phase thresholds (active players)

| Active fighters | Phase | Rules |
|-----------------|-------|--------|
| 7–8 | **Normal** | Standard HP and timers |
| 5–6 | **Sudden Death I** | −5 HP at match start |
| 3–4 | **Sudden Death II** | −10 HP at match start, 12 min match cap, 45s turns |
| 2 | **Final Duel** | Best-of-3 series, −10 HP, 15 min cap; first to **2** match wins is Champion |

“Active” = not eliminated.

## Architecture

| File | Role |
|------|------|
| `src/game/arenaPhase.ts` | Phase resolution, `ArenaPhaseConfig` (HP penalty, timers, warnings) — extend for future modifiers |
| `src/game/pvpTimers.ts` | Phase-aware turn/match timeout helpers |
| `src/game/pvpBattleState.ts` | Applies starting HP penalty via `applyArenaStartingHp` |
| `src/services/matchService.ts` | Stores `arena_phase` / `final_duel_game` on new matches |
| `src/services/arenaService.ts` | Final-duel series wins, crown at 2 wins, `ensureFinalDuelLobby` |
| `src/services/pvpBattleService.ts` | Battle init with phase + final-duel log lines |
| `src/services/pvpTimerService.ts` | Enforces phase-specific match/turn limits |
| `src/components/ArenaPhaseBanner.tsx` | Remaining players, phase label, warnings |
| `supabase/migrations/023_sudden_death_arena.sql` | DB columns for final duel + match phase |

## Database migration

Run `supabase/migrations/023_sudden_death_arena.sql` in the Supabase SQL editor (or apply full `schema.sql` for new projects).

Adds to `lobbies`: `final_duel_player_1_id`, `final_duel_player_2_id`, `final_duel_p1_wins`, `final_duel_p2_wins`  
Adds to `matches`: `arena_phase`, `final_duel_game`

## Final Duel (best-of-3)

1. When only **2** active players remain, the lobby locks finalists and tracks series wins.
2. Each match win increments that player’s series score (loser does **not** lose an arena life).
3. After each game (until 2 wins), lobby returns to **waiting** (no shop) for the next ready-up.
4. At **2** series wins → `status: finished`, champion screen.

## Champion screen

Shows: Champion name, base class, evolved class (if any), opponents defeated, final deck size.

## How to test

### 8-player (Normal phase)

1. Run migration, start Supabase env, open the app.
2. Join one lobby with **8** champions (8 browser profiles or incognito tabs; unique session IDs).
3. Ready all, host starts round.
4. **Arena Phase** banner should read **Standard Arena** and **8 fighters remaining**.
5. Enter a match — both players should have **full class HP** (no −5/−10 in battle log).

### 4-player (Sudden Death II)

**Option A — Real play:** Eliminate players until 4 remain (losers lose lives over multiple rounds).

**Option B — Fast setup (Supabase):** In `lobby_players`, set `eliminated = true` on four players so exactly **4** have `eliminated = false`. Refresh lobby UI.

1. Banner: **Sudden Death — Level 2**, warning about −10 HP and reduced timers.
2. Start a match — battle log should include **−10 HP** line; HP bars start below max.
3. Turn timer hint shows **45s** limit.

### Final Duel (2 players, Bo3)

**Option B setup:** Mark all but **two** players `eliminated = true` in Supabase.

1. Banner: **Final Duel**, series label **0–0 (first to 2)**.
2. Both ready → host starts — only one pairing, no bye.
3. Play match 1 — winner’s series becomes **1–0**; lobby goes to **waiting** (not shop).
4. Ready both again → **Game 2** in battle log.
5. When one player reaches **2** series wins → **Champion Crowned** screen with base + evolved class.

### Verify timers (SD2 / Final)

- Start a match in SD2; confirm match timeout message uses **12 min** if forced via timer service (or wait with dev tools).
- `processMatchTimers` uses `match.arenaPhase` from the DB row.

## Adding future arena modifiers

1. Add a new `ArenaPhase` value (or separate `ArenaModifierId[]` on match).
2. Extend `ArenaPhaseConfig` in `arenaPhase.ts` with new fields (e.g. `damageMultiplier`, `goldBonus`).
3. Apply in `buildCombatant`, `pvpTimerService`, or `applyMatchArenaProgression` as needed.
4. Update `ArenaPhaseBanner` copy and CSS severity class.

Tournament formats can reuse `final_duel_*` columns or add a `lobby.format` enum without changing combat core.
