# Rival System (Milestone 26)

Recurring stories between players during a lobby run — **information and emotion only**. No gameplay bonuses, stat changes, or hidden mechanics.

## Rival creation

An opponent becomes your **Rival** when either:

1. **They defeat you** (you lose once against them), or  
2. **You defeat them multiple times** (2+ wins in the run against the same opponent).

Once a rivalry exists, `isRival` stays true for that pairing for the rest of the lobby run.

## What is tracked (per opponent)

Stored in `lobby_players.rival_history` as a map keyed by opponent player id:

| Field | Meaning |
|-------|---------|
| `wins` / `losses` | Your record vs that opponent this run |
| `lastMatchYouWon` | Result of the most recent match |
| `lastMatchId` / `lastMatchAt` | Most recent pairing |
| `eliminatedYou` | They eliminated you (took your last life) |
| `youEliminatedThem` | You eliminated them from the run |
| `isRival` | Rivalry flag for intro UI |

## Run statistics (computed)

| Stat | Definition |
|------|------------|
| Rivals defeated | Rivals where you lead the record (`wins > losses`) |
| Rival losses | Sum of your losses in all rivalry matchups |
| Longest rivalry | Most total matches (`wins + losses`) vs one rival |

## Match introduction

When facing a rival, `MatchIntroductionScreen` shows:

- **Rival match** banner (`RivalIntroPanel`)
- Previous result (e.g. `Bloodlord_King defeated you`)
- Record (e.g. `1 - 1`, your wins first)
- Elimination stakes if applicable
- Scouting report (unchanged from M25) plus rival record row

## Champion screen

`OnlineChampionView` adds:

- Rivals defeated / rival losses / longest rivalry in stats grid
- **Rivals overcome** — rivals you lead or eliminated
- **Final rival records** — all rivalry head-to-heads

## Architecture

| File | Role |
|------|------|
| `src/types/rivals.ts` | Types for records, intro, champion summaries |
| `src/game/rivalIntel.ts` | Pure logic: creation rules, copy, aggregates |
| `src/services/rivalService.ts` | Parse/persist `rival_history`; `recordMatchRivalHistory` |
| `src/components/RivalBadge.tsx` | Small rival label |
| `src/components/RivalIntroPanel.tsx` | Pre-combat rival banner |
| `src/components/RivalHistoryPanel.tsx` | History list + run stats |
| `supabase/migrations/026_rival_system.sql` | `rival_history` jsonb column |

### Match-end order

```
recordMatchScoutingStats(match)
applyMatchArenaProgression(match)   // lives / elimination
recordMatchRivalHistory(match)      // reads post-progression eliminated flag
```

### Future seasons

Register hooks in `RIVAL_INTEL_EXTENSIONS` (`rivalIntel.ts`) to enrich intro copy or merge cross-lobby history. Keys remain opponent player ids within a lobby; a future `season_id` column can namespace the same shape.

## Database

Apply `supabase/migrations/026_rival_system.sql` (or use updated `schema.sql`).

## How to test rival creation

### Test A — Rival from a loss

1. Two players in a lobby; start a round and complete a match where **Player B wins**.
2. Start a **second** match with the same pairing (if still in the run).
3. **Player A** should see **Rival match** on the intro before combat.
4. Previous line should read: `{B's name} defeated you`.
5. Record should show `0 - 1` from A's perspective.

### Test B — Rival from multiple wins

1. **Player A** beats **Player B** twice (two completed matches, same pairing).
2. Before the third match, **Player B** should see a rival intro (B lost twice).
3. Record from B's view: `0 - 2`.

### Test C — Rematch record

1. After A and B are rivals at `1 - 1`, play another match.
2. Winner sees updated record on the **next** intro (`2 - 1` or `1 - 2`).
3. Previous result reflects the last completed match.

### Test D — Elimination story

1. Reduce a player to 1 life, then lose a match.
2. That player is eliminated; winner's rival record should show `youEliminatedThem` on the champion/history panels if they meet again in final duel (if applicable).

### Test E — Champion screen

1. Finish a run as champion with at least one rivalry.
2. Champion screen shows rivals defeated, rival losses, longest rivalry.
3. **Rivals overcome** and **Final rival records** sections list head-to-heads.

## Rules compliance

- No combat modifiers from rivalry UI.
- No hidden mechanics tied to rival status.
- Pure narrative / record-keeping for memorable runs.
