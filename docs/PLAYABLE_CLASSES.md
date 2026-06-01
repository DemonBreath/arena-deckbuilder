# Playable Classes (Milestone 28)

**20 playable classes** — class selection is the primary reason to return. No new systems, relics, maps, or spectators in this milestone.

## Roster

| # | Class | Role | Passive highlight |
|---|-------|------|-------------------|
| 1 | Guardian | Tank | +8 HP, 1 block/turn |
| 2 | Berserker | Aggro | Strike/Heavy +2, lower HP |
| 3 | Gunslinger | Combo | 2nd Strike +2 |
| 4 | Necromancer | Sustain | Heal on Guard |
| 5 | Pirate | Risk/Reward | +15 gold after wins |
| 6 | Vampire | Sustain | Lifesteal on hits |
| 7 | Merchant | Economy | +30 gold, 15% shop discount |
| 8 | Alchemist | Utility | Even hand slots +1 attack dmg |
| 9 | Timekeeper | Control | +2 energy turn 1, draw 6 |
| 10 | Pyromancer | Damage Over Time | +1 attack damage |
| 11 | Cryomancer | Defensive Control | 1 block/turn |
| 12 | Paladin | Tank Support | Block + heal on Guard |
| 13 | Assassin | Burst | First attack +2, +1 vs healthy foes |
| 14 | Chef | Preparation | +3 block turn 1 each battle |
| 15 | Dragon Knight | Scaling | +1 dmg/turn taken (max 3) |
| 16 | Gambler | High Variance | +0–2 random attack dmg |
| 17 | Bard | Utility | Draw 6 cards/turn |
| 18 | Engineer | Resource Generation | +1 energy on even turns |
| 19 | Monk | Combo | 2nd+ attacks +1 dmg |
| 20 | Warlord | Battlefield Commander | +1 dmg/turn taken (max 4), high HP |

## Architecture (30+ classes)

| File | Purpose |
|------|---------|
| `src/game/classDatabase.ts` | `ClassId` union, `CLASS_REGISTRY`, roles, stats, decks |
| `src/game/classPassives.ts` | Combat passive logic via `passiveKind` |
| `src/game/classCardPools.ts` | 2 class + 1 rare card per class |
| `src/game/classEvolutions.ts` | 3 evolutions × each base class |
| `src/game/cardDatabase.ts` | Card definitions (shared + class cards) |
| `src/components/ClassSelectionScreen.tsx` | Compare table, filters, detail panel |

## How to add class #21

1. **`classDatabase.ts`**
   - Add id to `ClassId` union (e.g. `'druid'`).
   - Add role to `ClassRole` + `CLASS_ROLE_FILTERS` if new.
   - Add `passiveKind` to `ClassPassiveKind` if new behavior.
   - Append `ClassDefinition` to `CLASS_REGISTRY` (name, role, passive, stats, starter deck).
   - Add CSS slug via `roleToCssSlug()` (auto from role string).

2. **`classPassives.ts`**
   - Implement new `passiveKind` in `getClassBonusDamage`, `getClassTurnStartBlock`, etc., **or** reuse an existing kind.

3. **`classCardPools.ts`**
   - Add entry: `classCards: [2 ids], rareClassCards: [1 id]`.

4. **`cardDatabase.ts`**
   - Add `CardId` entries + `CARD_DATABASE` definitions (reuse strike/guard stats where possible).

5. **`classEvolutions.ts`**
   - Add 3 `EvolutionDefinition` objects with `baseClassId: 'your_class'`.

6. **`styles.css`**
   - Add `.class-role-badge--your-role-slug` color if new role label.

7. **Verify**
   - `npm run build`
   - Class select screen shows 21 classes
   - Class test mode (title screen) for combat smoke test

No migration required — `class_id` is text on `lobby_players`.

## Class selection UI

- **20 playable classes** badge at top
- Role filters for all role labels
- **Compare all** table: HP, energy, passive summary
- **Class detail** grid with passive text on each card
- Confirm button shows selected class name

## Balance notes

- Passives are informational/combat-only — no hidden stat boosts outside documented rules.
- Most classes use shared strike/guard skeleton decks with a few class cards in rewards/shop.
- Evolutions reuse or extend passive kinds — no new cards per evolution in this milestone.
