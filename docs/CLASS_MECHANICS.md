# Signature Class Mechanics (Milestone 29)

Each playable class has a **visible resource meter** shown directly under HP in solo and PvP combat. Meters build during battle and unlock simple combat bonuses — separate from (but complementary to) class passives.

## Roster

| Class | Mechanic | Max | Threshold bonus |
|-------|----------|-----|-----------------|
| Guardian | Resolve | 10 | 5+ Guards: +2 block |
| Berserker | Rage | 10 | Every 3 Rage: +1 attack dmg |
| Gunslinger | Combo | 6 | 3+ Strikes: +2 dmg |
| Necromancer | Souls | 8 | 4+ Guards: heal 2 |
| Pirate | Booty | 10 | Every 2 Booty: +1 attack dmg |
| Vampire | Blood | 10 | 6+ attacks: heal 1 on hit |
| Merchant | Coin | 10 | Every 3 Coin: +1 attack dmg |
| Alchemist | Brew | 6 | 4+ attacks: +1 dmg |
| Timekeeper | Time | 6 | 4+ attacks: +1 dmg |
| Pyromancer | Ember | 8 | Every 2 Ember: +1 dmg |
| Cryomancer | Frost | 8 | 4+ start turn: +1 block |
| Paladin | Faith | 8 | 3+ Guards: heal 1 |
| Assassin | Edge | 6 | First attack +2 (4+ Edge: +4) |
| Chef | Prep | 5 | Every 2 Prep: +1 Guard block |
| Dragon Knight | Scale | 8 | Every 2 Scale: +1 dmg |
| Gambler | Luck | 7 | Every 2 Luck: +1 dmg |
| Bard | Verse | 6 | 4+ attacks: +1 dmg |
| Engineer | Charge | 6 | 3+ on even turns: +1 energy |
| Monk | Focus | 8 | 2nd+ attacks: +1 per 2 Focus |
| Warlord | Momentum | 10 | Every 2 Momentum: +1 dmg |

## Architecture

| File | Purpose |
|------|---------|
| `src/types/classMechanic.ts` | `ClassMechanicId`, `ClassMechanicMeter`, combat context types |
| `src/game/classMechanics.ts` | Registry, gain rules, combat modifiers, normalization |
| `src/components/ClassMechanicMeter.tsx` | HP-adjacent meter UI |
| `src/game/pvpBattleState.ts` | `mechanic` on `PvpPlayerBattleState`; turn/card/end hooks |
| `src/game/gameState.ts` | `mechanic` on solo `GameState`; same hooks |
| `src/components/BattleView.tsx` | Solo meter display |
| `src/components/PvpCombatView.tsx` | PvP meter display (both fighters) |
| `src/components/ClassSelectionScreen.tsx` | Signature rules in class detail |

Meters are **battle-local** (stored in PvP JSON battle state and solo `GameState`). They reset each fight. `normalizeMechanicMeter()` backfills missing fields for older saved battles.

## Combat flow

1. **Turn start** — `applyMechanicOnTurnStart()` (Coin/Time/Scale/Momentum +1, Engineer even-turn Charge, Cryomancer Frost block).
2. **Play card** — `getMechanicCombatModifiers()` applies threshold bonuses; `applyMechanicAfterCardPlay()` gains meter stacks.
3. **End turn** — `applyMechanicOnEndTurn()` (Chef +1 Prep).

Future class cards can read the same meter via `ClassMechanicMeter` on the player state without changing UI.

## How to add a mechanic for class #21

1. **`src/types/classMechanic.ts`** — Add a new id to `ClassMechanicId` (e.g. `'spirit'`).

2. **`src/game/classMechanics.ts`**
   - Map `your_class` → id in `MECHANIC_BY_CLASS`.
   - Add `{ name, hint, max, thresholdAt? }` in `MECHANIC_META`.
   - Implement gain/spend in `applyMechanicOnTurnStart`, `applyMechanicAfterCardPlay`, `getMechanicCombatModifiers`, and optionally `applyMechanicOnEndTurn`.

3. **`src/styles.css`** — Optional `.class-mechanic-meter__fill--spirit` color.

4. **No UI changes required** — `ClassMechanicMeter` and combat views read the registry automatically.

5. **Optional card hooks** — In `cardEffects` or new card flags, import `getMechanicCombatModifiers` or check `player.mechanic.value` for card-specific spends (e.g. “Spend 3 Rage: …”).

6. **`docs/PLAYABLE_CLASSES.md`** — Add row to the roster table.

## Testing

- **Class test:** Pick Guardian / Berserker / Gunslinger, play Guards or Strikes, watch meter fill and combat log `[+N Resolve]` / threshold bonuses.
- **Solo run:** Start any class; meter resets each battle.
- **PvP:** Both players see opponent meter; persisted state survives refresh via `normalizePvpBattleState`.
- **Build:** `npm run build`
