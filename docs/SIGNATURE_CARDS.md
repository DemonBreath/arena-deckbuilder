# Signature Mechanic Cards (Milestone 30)

Three **signature cards** per class interact with that class’s visible mechanic meter (M29). Cards are PvP-legal, appear in solo rewards/shops (~12% offer rate), and show mechanic text on hover.

## Files

| File | Role |
|------|------|
| `src/game/signatureCardEntries.ts` | Card definitions merged into `CARD_DATABASE` |
| `src/game/signatureCards.ts` | Effect resolver + tooltip helper |
| `src/game/cardDatabase.ts` | `CardId` union + `mechanicHint` + merged entries |
| `src/game/cardEffects.ts` | Routes signature cards when `mechanic` is passed |
| `src/game/classCardPools.ts` | `signatureCards[]` per class + reward tier |
| `src/game/gameState.ts` / `pvpBattleState.ts` | Pass meter into `resolveCardEffect`, apply spend/gain |
| `src/components/CardButton.tsx` | Signature badge + mechanic tooltip |

## Card list (by class)

| Class | Cards |
|-------|--------|
| Guardian | Brace, Shield Crush, Stand Firm |
| Berserker | Enrage, Blood Strike, Reckless Charge |
| Gunslinger | Quick Shot, Chain Fire, Reload |
| Necromancer | Harvest, Bone Spear, Soul Guard |
| Vampire | Bloodletting, Crimson Bite, Blood Shield |
| Pirate | Heist, Cannon Volley, Treasure Cache |
| Merchant | Tithe, Invoice, Hoard |
| Alchemist | Distill, Acid Flask, Elixir Surge |
| Timekeeper | Tick, Chrono Bolt, Rewind |
| Pyromancer | Kindle, Fireball, Ignite Burst |
| Cryomancer | Chill, Ice Lance, Glacier |
| Paladin | Prayer, Smite, Bulwark |
| Assassin | Poised, Shadow Cut, Ambush Prep |
| Chef | Chop, Simmer, Plated Feast |
| Dragon Knight | Hoard, Drake Fire, Armor Plate |
| Gambler | Chip, Jackpot Shot, All In |
| Bard | Verse, Crescendo, Harmony Shield |
| Engineer | Wind Up, Pulse Blast, Overcharge |
| Monk | Breath, Palm Burst, Meditation |
| Warlord | Rally, Charge, Siege Wall |

Spend cards use a **soft fail**: if you lack resource, you still get the weaker line on the card text.

## How to add a signature card

1. Add `CardId` + entry in `signatureCardEntries.ts` (`description`, `mechanicHint`).
2. Add case in `resolveSignatureMechanicCard()` in `signatureCards.ts`.
3. Append id to `CLASS_CARD_POOLS[class].signatureCards`.
4. If the card deals damage, ensure `damage` is set on the definition (attack detection).

## Testing one card per class

**Fast path — Class Test:** Each class test deck includes that class’s **first** signature card (e.g. Guardian → Brace). Open Class Test, play the signature card, watch the mechanic meter and battle log.

**Full path — Rewards / PvP:** Win a solo fight or use the online shop; ~12% of class offers roll signature tier. Hover cards for the mechanic tooltip.

### Sample checks (one card each)

| Class | Card to play | Expect |
|-------|----------------|--------|
| Guardian | Brace | +2 Resolve, 6 block |
| Berserker | Enrage | +3 Rage, −2 HP |
| Gunslinger | Quick Shot | +2 Combo, 3 damage |
| Necromancer | Harvest | +3 Souls |
| Vampire | Bloodletting | −3 HP, draw 2, +1 Blood |
| Pirate | Heist | +2 Booty, 4 damage |
| Merchant | Hoard | +3 Coin, draw 1 |
| Alchemist | Distill | +2 Brew, draw 1 |
| Timekeeper | Tick | +2 Time |
| Pyromancer | Kindle | +2 Ember, 3 damage |
| Cryomancer | Chill | +2 Frost, 5 block |
| Paladin | Prayer | +2 Faith, heal 2 |
| Assassin | Poised | +2 Edge |
| Chef | Simmer | +2 Prep, 4 block |
| Dragon Knight | Hoard | +2 Scale |
| Gambler | Chip | +2 Luck, 3 damage |
| Bard | Verse | +2 Verse, draw 1 |
| Engineer | Wind Up | +2 Charge |
| Monk | Meditation | +3 Focus, 5 block |
| Warlord | Rally | +2 Momentum |

Build: `npm run build`
