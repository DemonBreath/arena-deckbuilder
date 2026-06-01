# Class Evolutions

Classes evolve during a run. Every player starts as a **base class** (chosen at lobby / solo start). After **3 victories**, they pick **one of three evolutions** — permanent for that run.

Evolution changes:

- **Passive ability** (combat behavior via `classPassives.ts`)
- **Future reward weighting** (class / rare card offer odds)
- **Visual class title** (e.g. `Guardian · Warden`)

Card pools stay tied to the **base class** — no new cards per evolution in this milestone.

---

## Architecture (30 bases × 3 evolutions)

| File | Role |
|------|------|
| `src/game/classEvolutions.ts` | Registry: all evolution definitions, trigger rules, lookup by base |
| `src/game/classIdentity.ts` | `PlayerClassIdentity`, `resolveClassIdentity()` merges base + evolution stats/passive/title |
| `src/game/classPassives.ts` | Passive logic keyed by resolved `passiveKind` (base + evolution kinds) |
| `src/game/classCardPools.ts` | `rollClassOfferCard(identity)` applies `rewardWeights` from evolution |
| `src/game/gameState.ts` | Solo: `evolutionId`, evolution screen, `PICK_EVOLUTION` |
| `src/services/onlineRunService.ts` | Online: `evolutionId`, `battlesWon`, `pickOnlineEvolution()` |
| `src/components/EvolutionSelectionScreen.tsx` | Shared UI for solo + online |

**Identity model:** `classId` / lobby `class_id` always stores the **base** class. `evolutionId` is stored separately (nullable until chosen).

---

## Trigger

- Constant: `EVOLUTION_TRIGGER_AFTER_BATTLES_WON = 3` in `classEvolutions.ts`
- Solo: offered after win when `battleNumber >= 3` and `evolutionId === null` (class test mode skips)
- Online: `battlesWon` in `OnlineRunState` increments on match win; same check in `MatchResultsView`

---

## How to add a new evolution

1. **Register in `classEvolutions.ts`** — append to `EVOLUTION_REGISTRY`:

```ts
{
  id: 'guardian_new_path',        // unique EvolutionId
  baseClassId: 'guardian',
  name: 'New Path',
  role: 'Tank',
  tagline: 'Short hook.',
  description: 'Player-facing summary.',
  passive: {
    id: 'new_path_passive',
    name: 'Passive Name',
    description: 'What the player sees.',
  },
  passiveKind: 'new_path_passive', // must match ClassPassiveKind in classDatabase.ts
  statModifiers: { maxHp: 4 },     // optional partial ClassStats
  rewardWeights: { classPoolBonus: 0.08, rarePoolBonus: 0.02 },
},
```

2. **Extend `ClassPassiveKind`** in `classDatabase.ts` if the passive needs new combat logic.

3. **Implement behavior** in `classPassives.ts`:
   - `getClassTurnStartBlock` / `getClassOpeningEnergyBonus` / `getClassBonusDamage` as needed
   - `applyClassPostCardEffects` for on-play effects (heal, counter `enemyDamage`, etc.)

4. **No UI changes required** — `getEvolutionsForBase(baseClassId)` drives `EvolutionSelectionScreen`.

---

## How to add a new base class with 3 evolutions

1. Add the base class in `classDatabase.ts` (`CLASS_REGISTRY`).
2. Add three entries in `EVOLUTION_REGISTRY` with `baseClassId` set to the new class id.
3. Add card pool rows in `classCardPools.ts` (`CLASS_CARD_POOLS`).
4. Implement any new `passiveKind` values in `classPassives.ts`.

The registry maps are built at load time (`EVOLUTION_BY_ID`, `EVOLUTIONS_BY_BASE`), so 30×3 entries scale without structural changes.

---

## Solo flow

1. Win battle → `resolveBattleEnd` checks `shouldOfferEvolution`
2. `screen: 'evolution'` → `EvolutionSelectionScreen`
3. `PICK_EVOLUTION` → sets `evolutionId`, refreshes max HP, generates card rewards
4. `screen: 'reward'` → shop as usual

---

## Online flow

1. Match ends → `preparePostMatchRewards(..., won)` bumps `battlesWon` on win
2. `MatchResultsView` → evolution step if eligible, then post-match card rewards
3. `pickOnlineEvolution` persists `evolutionId` and regenerates shop / reward odds
4. PvP battles load `evolutionId` from `loadOnlineRun` in `tryInitializePvpBattle`

---

## Example paths (Guardian / Berserker)

| Base | Evolution | Focus |
|------|-----------|--------|
| Guardian | Warden | +HP, +2 block per turn |
| Guardian | Sentinel | Riposte 2 on Guard |
| Guardian | Templar | Heal 2 on Guard |
| Berserker | Executioner | +3 damage on strikes |
| Berserker | Bloodlord | Lifesteal on attacks |
| Berserker | Juggernaut | Tanky damage dealer |

All 12 current bases have three themed evolutions in the registry (some are placeholder flavor until expanded).
