# Class-Specific Card Pools (Milestone 21)

## Pool structure

Each class has three reward sources (see `src/game/classCardPools.ts`):

| Pool | Contents | Roll odds |
|------|----------|-----------|
| **sharedCards** | `SHOP_CARD_POOL` — Strike+, Guard+, Heavy Strike, Quick Jab, Shield Bash, Double Guard | 65% |
| **classCards** | 2 unique cards per class | 30% |
| **rareClassCards** | 1 powerful class card | 5% |

Used in:
- Solo post-battle rewards (`gameState.ts`)
- Solo shop offers (`gameState.ts`)
- Online shop (`onlineRunService.ts`)
- Post-match “Add card” rewards (`postMatchRewards.ts`)

## Class cards (2 + 1 rare each)

| Class | Class cards | Rare |
|-------|-------------|------|
| Guardian | Shield Slam, Stonewall | Bastion |
| Berserker | Blood Rush, Reckless Swing | Rampage |
| Gunslinger | Quickdraw, Fan the Hammer | Dead Eye |
| Necromancer | Soul Tax, Bone Armor | Grave Pact |
| Pyromancer | Flame Bolt, Ignite | Inferno |
| Cryomancer | Frost Wall, Glacial Strike | Absolute Zero |
| Paladin | Lay on Hands, Consecrate | Divine Shield |
| Assassin | Ambush, Rupture | Death Mark |
| Alchemist | Unstable Concoction, Grand Elixir | Philosopher's Stone |
| Timekeeper | Temporal Draw, Borrowed Power | Time Stop |
| Merchant | Spare Change, Liquidation | Golden Contract |
| Vampire | Sanguine Strike, Essence Drain | Blood Feast |

Card logic lives in `src/game/cardEffects.ts`. PvP battles allow class cards in deck (`isPvpAllowedCard`).

## UI badges

`CardButton` shows:
- **Class name** badge — class-specific card for any class
- **Rare class** badge — gold styling for rare pool cards

Pass `viewerClassId` so your own class cards highlight normally.

## Testing

### Solo
1. Start run as **Guardian** (or any class).
2. Win a fight → reward screen: ~30% chance to see a class card (e.g. Shield Slam).
3. Continue to shop → offers use same odds; buy a class card.
4. Next battle → play the class card; verify effect in log.

### Online
1. Two-tab lobby, different classes.
2. Finish a match → post-match rewards: “Add card” can roll class-specific cards.
3. Shop phase: offers respect each player’s `classId` in local run state.
4. PvP match: if deck contains class cards from shop, they are playable in fight.

### Quick odds check (dev)
Run many reward generations in console or Class Test Lab + shop cycles; expect mostly shared upgrades with occasional class/rare cards.

## Adding cards later

1. Add `CardId` + definition in `cardDatabase.ts`
2. Add effect in `cardEffects.ts`
3. Append to `CLASS_CARD_POOLS[classId].classCards` or `rareClassCards`
4. Class cards are automatically PvP-legal via `getAllClassCardIds()`
