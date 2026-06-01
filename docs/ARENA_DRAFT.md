# Arena Draft System (Milestone 24)

Surviving players vote on lobby-wide modifiers every **2 rounds**. The winning option applies **equally to everyone** and **stacks** for the rest of the run.

## Flow

1. After a round completes, `round_number` increments (e.g. to 2, 4, 6…).
2. If `shouldTriggerArenaDraft(round)` → lobby `status: arena_draft`.
3. Three random options from `ARENA_DRAFT_REGISTRY` are shown.
4. Each **non-eliminated** player has **45s** to vote (or all vote early).
5. Plurality wins (random tie-break). Winner is appended to `active_draft_ids` and `draft_history`.
6. **Thin Decks** removes one random card from each survivor’s server deck immediately.
7. Lobby moves to **shop**; combat modifiers apply on the next PvP match.

Final-duel series skips draft votes so Bo3 pacing stays tight.

## Registered drafts

| ID | Name | Effect |
|----|------|--------|
| `iron_arena` | Iron Arena | +5 max HP per stack |
| `battle_frenzy` | Battle Frenzy | +1 energy per turn per stack |
| `thin_decks` | Thin Decks | Remove 1 random card (once per win) |
| `quick_draw` | Quick Draw | +1 card drawn on turn 1 per stack |
| `heavy_armor` | Heavy Armor | +5 block on turn 1 per stack |

## Architecture

| File | Role |
|------|------|
| `src/game/arenaDrafts.ts` | Registry, stacking math, option roll |
| `src/types/arenaDraft.ts` | Vote session + result types |
| `src/services/arenaDraftService.ts` | Vote, resolve, apply thin decks |
| `src/services/arenaService.ts` | `advanceLobbyAfterRound` → draft or shop |
| `src/game/pvpBattleState.ts` | Combat bonuses from `activeDraftIds` |
| `src/components/ArenaDraftView.tsx` | Vote UI, timer, results |
| `src/components/ActiveArenaDraftsPanel.tsx` | Active stacks display |
| `src/hooks/useArenaDraft.ts` | Poll + vote helpers |

## Database

Run `supabase/migrations/024_arena_draft.sql`:

- `lobbies.active_draft_ids` (jsonb array)
- `lobbies.draft_history` (jsonb array)
- `lobbies.draft_session` (jsonb, current vote)
- `lobbies.last_draft_result` (jsonb)
- `lobbies.status` includes `arena_draft`

## How to add a new Arena Draft

1. Add to `ARENA_DRAFT_REGISTRY` in `arenaDrafts.ts`:

```ts
{
  id: 'gold_rush',
  name: 'Gold Rush',
  tagline: 'Richer rewards.',
  description: 'All players gain +10 gold after each match.',
  effectKind: 'post_match_gold', // new kind if needed
  magnitude: 10,
},
```

2. If it needs a **new** `effectKind`, extend:
   - `ArenaDraftEffectKind` in `arenaDrafts.ts`
   - `stackArenaDraftEffects()` for passive combat stats
   - `applyDraftWinnerEffects()` in `arenaDraftService.ts` for one-shot lobby changes (like `thin_decks`)

3. For combat-only effects, wire `stackArenaDraftEffects` + `pvpBattleState.ts` `beginTurn` / `buildCombatant`.

4. No UI changes required — options appear automatically in votes.

## Testing

1. Run migration `024_arena_draft.sql`.
2. Join a lobby with 2+ players, play through **round 1**, finish matches → shop.
3. After **round 2** completes, survivors should see **Arena Draft Vote** (not shop).
4. Vote on three cards; verify timer, vote counts, winner banner.
5. Continue to shop — **Active Arena Drafts** panel shows the winner.
6. Enter PvP — check battle log for draft line; verify HP/energy/block/draw per draft.
7. Win lobby — champion screen lists **Arena Drafts this run** in order.

To re-test quickly: set `lobbies.round_number` to 1 in Supabase, complete a match so it becomes 2 and triggers draft.
