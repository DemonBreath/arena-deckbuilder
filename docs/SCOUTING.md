# Scouting and Intelligence (Milestone 25)

Pre-combat intelligence for online PvP — information only. No gameplay bonuses, spectators, monetization, or betting.

## What players see

### Match introduction (both fighters)

- Your class / opponent class (with evolution badge when known)
- Your HP / opponent HP (from initialized battle state)
- Current arena phase banner

### Scouting report (opponent)

| Revealed | Hidden |
|----------|--------|
| Base class, evolved class | Full deck list |
| Starting HP, deck size | Hand |
| Arena lives remaining | Future rewards |
| Wins this run (`opponents_defeated`) | |
| Top 3 most-played cards (lobby run) | |
| Active arena draft modifiers | |
| Career stats: matches won, damage dealt/taken, cards played | |

## Flow

1. Both players connect → battle initializes server-side.
2. `MatchRoomView` shows `MatchIntroductionScreen` until **Begin combat**.
3. `PvpCombatView` runs as before.

## Architecture

| File | Role |
|------|------|
| `src/types/scouting.ts` | `PlayerScoutingStats`, `OpponentScoutingReport`, `MatchIntroductionSnapshot` |
| `src/game/scoutingIntel.ts` | Pure builders; `ScoutingIntelExtension` hook for future advanced scouting |
| `src/services/scoutingService.ts` | DB sync: evolution, post-match stat merge |
| `src/components/MatchIntroductionScreen.tsx` | UI |
| `src/components/MatchRoomView.tsx` | Gates combat behind intro |
| `supabase/migrations/025_scouting_intelligence.sql` | `evolution_id`, `scouting_stats` on `lobby_players` |

### Stat tracking

- Per-match: `PvpBattleState.stats` tracks damage dealt, damage taken, cards played, per-card counts.
- After match completion: `recordMatchScoutingStats()` merges into `lobby_players.scouting_stats`.
- Evolution: `pickOnlineEvolution()` syncs `evolution_id` to the server so opponents can scout it.

### Extending scouting

Register implementations in `SCOUTING_INTEL_EXTENSIONS` inside `scoutingIntel.ts`:

```ts
export const SCOUTING_INTEL_EXTENSIONS: ScoutingIntelExtension[] = [
  {
    id: 'relic-trends',
    enrich: (report, ctx) => ({ ...report /* add fields */ }),
  },
]
```

## Database

Apply migration `025_scouting_intelligence.sql` (or use updated `supabase/schema.sql` for new projects).

## How to test with two players

1. Run the app and Supabase with migration 025 applied.
2. **Player A**: Create lobby, pick a class, ready up.
3. **Player B**: Join with the lobby code, pick a class, ready up.
4. Host starts a round — both enter the match room.
5. Wait for “Both players connected” → battle initializes.
6. **Both** should see the match introduction + scouting panel (not combat yet).
7. Verify scouting shows: classes, HP, deck size, lives, win count (0 for first match), empty top cards until history exists.
8. If either player has evolved (3+ wins + evolution pick), opponent scouting should show evolved class after sync.
9. Vote on an arena draft (every 2 rounds) — next match scouting should list active draft modifiers.
10. Click **Begin combat** on both clients → PvP combat loads.
11. Play cards and finish a match — winner’s win count increments; career stats update for both.
12. Start a **second** match between the same players — scouting should show top played cards from the prior fight.

## Rules compliance

- Information only — scouting does not modify combat state.
- No hidden stat boosts from scouting UI.
- No spectators or betting hooks in this milestone.
