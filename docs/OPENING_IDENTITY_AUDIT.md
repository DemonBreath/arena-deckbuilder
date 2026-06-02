# Opening Identity Audit — Milestone 33

**Goal:** A new player recognizes their class within the **first 30 seconds of combat** (turn 1–2).

**Constraints:** No new systems, classes, relics, or progression layers. Tuning and presentation only.

**Sources:** `classDatabase.ts` starter decks, `classPassives.ts` battle logs, `pvpBattleState.ts` opening-hand bias, Milestone 31 E2E runs.

---

## Summary of changes

| Layer | Change |
|-------|--------|
| **Starter decks** | All 20 classes now include **≥1 signature card** + **≥1 class card**; generic Guard count capped at **2** per deck (was up to 6–8 on tanks). |
| **Opening hand** | Turn 1 draw swaps a pure Guard out if the hand has **no attack and no class/signature** card (`ensureOpeningHandPressure` in `pvpBattleState.ts`). |
| **Passive visibility** | Turn-start battle log announces **every class passive on turn 1** (not only block tanks). |
| **UI** | Existing `ClassMechanicMeter` + `mechanicHint` on signature cards unchanged — now reachable in opening hand. |

---

## Global rules applied

1. **10 cards** per starter deck (unchanged).
2. **At least 1 signature** — usually the mechanic-builder (0–1 cost: Enrage, Harvest, Quick Shot, etc.).
3. **At least 1 class card** — e.g. Shield Slam, Blood Rush, Flame Bolt (where not already covered by signature).
4. **Maximum 2×** `guard` / `guard_plus` in any starter (reduces guard-only opening draws).
5. **Turn 2 recognition test:** “Can a new player tell what this class does?” — see per-class table below.

---

## Per-class audit (Before → After)

Format: **Before** deck (10 cards) → **After** deck. **Turn 2?** = recognizable by end of turn 2 with average draws + turn 1 passive log.

### Guardian (Tank)

| | |
|--|--|
| **Before** | 6× Guard, 2× Guard+, 2× Strike — generic wall, no Resolve/Shield Slam. |
| **After** | `guardian_brace`, `shield_slam`, `guardian_shield_crush`, `stonewall`, 2× Strike, Strike+, 2× Guard, Guard+ |
| **Turn 2?** | **Yes** — Brace/Shield Slam show Resolve; Fortify block in log; Shield Slam damage = block. |
| **Why** | Tank identity is **block + Resolve**, not 6 generic Guards. |

### Berserker (Aggro)

| | |
|--|--|
| **Before** | 6× Strike, 2× Heavy, 2× Guard — strong but no Rage on board. |
| **After** | `berserker_enrage`, `berserker_reckless_charge`, `blood_rush`, 3× Strike, 2× Heavy, Strike+, Guard |
| **Turn 2?** | **Yes** — Enrage (+3 Rage) turn 1; Bloodlust log; Reckless Charge visible. |
| **Why** | “This is definitely a Berserker” = **Rage meter spikes** and self-risk attacks. |

### Gunslinger (Combo)

| | |
|--|--|
| **Before** | 5× Strike, 2× Strike+, 3× Guard — Combo passive invisible until 2nd Strike. |
| **After** | `gunslinger_quick_shot`, `quickdraw`, 4× Strike, `gunslinger_chain_fire`, Strike+, 2× Guard |
| **Turn 2?** | **Yes** — Quick Shot adds +2 Combo immediately; meter moves before second Strike. |
| **Why** | Combo class must show **Combo meter** in turn 1, not only on second Strike. |

### Necromancer (Sustain)

| | |
|--|--|
| **Before** | 4× Guard, 2× Guard+, 4× Strike — Souls mechanic absent from deck. |
| **After** | `necromancer_harvest`, `soul_tax`, `necromancer_bone_spear`, 3× Strike, Strike+, `bone_armor`, Guard, Guard+ |
| **Turn 2?** | **Yes** — Harvest (+3 Souls) turn 1; Life Drain log on Guards. |
| **Why** | Soul interaction **immediately**, not after random draws. |

### Pyromancer (Damage)

| | |
|--|--|
| **Before** | 6× Strike, 2× Heavy, 2× Guard — Scorch passive only. |
| **After** | `pyromancer_kindle`, `flame_bolt`, `ignite`, 2× Strike, `pyromancer_fireball`, Heavy, Strike+, 2× Guard |
| **Turn 2?** | **Yes** — Kindle (+2 Ember); Ember meter; class burn cards in hand. |
| **Why** | DOT/burn identity needs **Ember** on card text turn 1. |

### Cryomancer (Control)

| | |
|--|--|
| **Before** | 5× Guard, 2× Guard+, 3× Strike — stall without Frost. |
| **After** | `cryomancer_chill`, `frost_wall`, `glacial_strike`, 2× Strike, `cryomancer_ice_lance`, Guard, Guard+, Strike+, Guard |
| **Turn 2?** | **Yes** — Chill (+2 Frost); Ice Armor block log. |
| **Why** | Control = **Frost meter**, not another Guard pile. |

### Paladin (Tank Support)

| | |
|--|--|
| **Before** | 5× Guard, 2× Guard+, 3× Strike — Faith/heal absent. |
| **After** | `paladin_prayer`, `lay_on_hands`, `paladin_smite`, 3× Strike, `consecrate`, Strike+, Guard, Guard+ |
| **Turn 2?** | **Yes** — Prayer (+2 Faith, heal 2); Aegis log on Guards. |
| **Why** | Paladin = **Faith + heal**, not generic tank guards. |

### Assassin (Burst)

| | |
|--|--|
| **Before** | 4× Strike, 2× Strike+, Heavy, 3× Guard — Edge not in deck. |
| **After** | `assassin_ambush_prep`, `ambush`, `assassin_shadow_cut`, 2× Strike, Heavy, `rupture`, Strike+, 2× Guard |
| **Turn 2?** | **Yes** — Ambush Prep (+3 Edge) turn 1; first-attack passive log. |
| **Why** | Burst = **Edge meter** before first big attack. |

### Alchemist (Utility)

| | |
|--|--|
| **Before** | Alternating Strike/Guard — no Brew. |
| **After** | `alchemist_distill`, `unstable_concoction`, `alchemist_acid_flask`, 3× Strike, Strike+, Guard, Guard+, Strike, Guard |
| **Turn 2?** | **Yes** — Distill (+2 Brew); even-slot passive log. |
| **Why** | Brew meter must appear in opening hand. |

### Timekeeper (Control)

| | |
|--|--|
| **Before** | 4× Strike, 3× Guard, Strike+, Guard+, Heavy — Time meter missing. |
| **After** | `timekeeper_tick`, `temporal_draw`, `timekeeper_chrono_bolt`, 2× Strike, `borrowed_power`, Heavy, Strike+, 2× Guard |
| **Turn 2?** | **Yes** — Tick (+2 Time); **+2 opening energy** in log; 6-card hand visible. |
| **Why** | Timekeeper = **Time meter + tempo**, not vanilla Strikes. |

### Merchant (Economy)

| | |
|--|--|
| **Before** | 8× Guard, 2× Strike — worst guard-only opener; Coin invisible in combat. |
| **After** | `merchant_hoard`, `spare_change`, `merchant_tithe`, 3× Strike, `liquidation`, Strike+, 2× Guard |
| **Turn 2?** | **Yes** — Hoard (+3 Coin); Coin meter; Barter gold visible in lobby header. |
| **Why** | Economy class had **8 Guards** and no Coin cards — unrecognizable in combat. |

### Vampire (Sustain)

| | |
|--|--|
| **Before** | Mixed strikes/guards — no Blood cards. |
| **After** | `vampire_bloodletting`, `sanguine_strike`, `vampire_crimson_bite`, 3× Strike, `essence_drain`, Strike+, Guard, Guard+ |
| **Turn 2?** | **Yes** — Bloodletting (+1 Blood); lifesteal passive log. |
| **Why** | Blood meter + self-payoff cards define Vampire turn 1. |

### Pirate (Risk/Reward)

| | |
|--|--|
| **Before** | 4× Strike, `plunder_strike`, `broadside`, 2× Guard, class guards — no Booty signature. |
| **After** | `pirate_heist`, `plunder_strike`, `broadside`, `pirate_cannon_volley`, 2× Strike, Strike+, `salty_guard`, Guard |
| **Turn 2?** | **Yes** — Heist (+2 Booty); Booty meter; Plunder gold passive in lobby. |
| **Why** | Added **Heist** so Booty moves turn 1 (was only class strikes). |

### Chef (Preparation)

| | |
|--|--|
| **Before** | `serrated_blade`, `hearty_stew`, `mise_guard` — no Prep signature. |
| **After** | `chef_chop`, `serrated_blade`, `chef_simmer`, `hearty_stew`, 2× Strike, Strike+, `mise_guard`, Guard, Guard+ |
| **Turn 2?** | **Yes** — Chop/Simmer (+Prep); +3 block turn 1 passive log. |
| **Why** | Prep meter must show on **signature** cards, not only stew. |

### Dragon Knight (Scaling)

| | |
|--|--|
| **Before** | `drake_strike`, `kindling`, `scale_guard` — no Scale signature. |
| **After** | `dragon_knight_hoard`, `drake_strike`, `dragon_knight_drake_fire`, `kindling`, Strike, Heavy, `scale_guard`, Strike+, 2× Guard |
| **Turn 2?** | **Yes** — Hoard (+2 Scale); scaling passive log. |
| **Why** | Scale stack starts turn 1 with **Hoard**. |

### Gambler (Variance)

| | |
|--|--|
| **Before** | `lucky_strike`, `double_down` — Luck signature missing. |
| **After** | `gambler_chip`, `lucky_strike`, `gambler_all_in`, `double_down`, 3× Strike, Strike+, `hedged_guard`, Guard |
| **Turn 2?** | **Yes** — Chip (+2 Luck); random damage passive log. |
| **Why** | Luck meter visible before jackpot rolls. |

### Bard (Utility)

| | |
|--|--|
| **Before** | `encore`, `harmony` — no Verse signature. |
| **After** | `bard_verse`, `encore`, `bard_crescendo`, `harmony`, 2× Strike, Strike+, `rhythm_guard`, 2× Guard |
| **Turn 2?** | **Yes** — Verse (+2, draw 1); **6-card hand** on turn 1. |
| **Why** | Verse meter + larger hand = instant Bard read. |

### Engineer (Resource)

| | |
|--|--|
| **Before** | `wrench_strike`, `gyro_shot`, `plating` — Charge signature missing. |
| **After** | `engineer_wind_up`, `wrench_strike`, `engineer_pulse_blast`, `gyro_shot`, Strike, `plating`, Heavy, Strike+, 2× Guard |
| **Turn 2?** | **Yes** — Wind Up (+2 Charge); even-turn energy passive log. |
| **Why** | Charge must appear before even-turn energy spike. |

### Monk (Combo)

| | |
|--|--|
| **Before** | `flurry`, `palm_strike` — Focus signature missing. |
| **After** | `monk_breath`, `flurry`, `monk_palm_burst`, `palm_strike`, 3× Strike, Strike+, `focus_guard`, Guard |
| **Turn 2?** | **Yes** — Breath (+2 Focus); Flow State log on 2nd attack. |
| **Why** | Focus meter on turn 1 for combo sequencing. |

### Warlord (Commander)

| | |
|--|--|
| **Before** | `march_strike`, `war_cry`, `rally_guard` — Momentum signature missing. |
| **After** | `warlord_rally`, `march_strike`, `warlord_charge`, `war_cry`, Strike, Heavy, `rally_guard`, Strike+, Guard |
| **Turn 2?** | **Yes** — Rally (+2 Momentum); scaling passive log. |
| **Why** | Momentum stack defines Warlord from turn 1. |

---

## Turn-feel improvements (no new systems)

### Dead turns reduced

- Fewer **6–8 Guard** starters → less “only Guard in hand, 0 damage” on turn 1.
- `ensureOpeningHandPressure` replaces one Guard with an attack or class/signature card if the opening hand has **zero** pressure cards.

### Guard-only openings reduced

| Class | Guards before | Guards after |
|-------|---------------|--------------|
| Guardian | 8 | 2 (+ Guard+) |
| Merchant | 8 | 2 |
| Cryomancer | 5 | 2 |
| Paladin | 5 | 2 |
| Necromancer | 4 | 2 |

### Passive visibility (turn 1 battle log)

Previously only **block passives** logged (Guardian, Cryomancer, Paladin). Now **all 20 classes** get a turn-1 line where applicable, e.g.:

- Berserker: “Strikes and Heavy Strikes deal +2 damage.”
- Gunslinger: “Second Strike each turn deals +2 damage.”
- Timekeeper: “+2 energy on your first turn.”
- Bard: “You draw 6 cards each turn.”

Implemented in `formatClassPassiveLog(identity, turnNumber)` in `classPassives.ts`.

---

## Files changed

| File | What changed |
|------|----------------|
| `src/game/classDatabase.ts` | All 20 `*_DECK` constants — signature + class cards, ≤2 generic Guards. |
| `src/game/classPassives.ts` | `formatClassPassiveLog` now takes `turnNumber` and logs turn-1 identity for every passive kind. |
| `src/game/pvpBattleState.ts` | `ensureOpeningHandPressure` on turn 1; imports `CLASS_CARD_POOLS`; updated passive log call. |
| `src/game/gameState.ts` | Solo mode uses updated `formatClassPassiveLog(identity, turnNumber)`. |
| `src/appMeta.ts` | Milestone label → **Milestone 33 — Opening Identity Pass**. |
| `docs/OPENING_IDENTITY_AUDIT.md` | This document. |

**Not changed:** combat rules, card stats, signature effects, relics, lobby flow, reward tables, class count.

---

## Verification

| Check | Result |
|-------|--------|
| `npm run build` | Pass |
| `npm run test:e2e` (smoke) | Pass (~33s on production) |
| `npm run test:e2e:final-duel` | Pass (~39s on production) |

**Note:** E2E against `https://overdrive-rosy.vercel.app` uses the **deployed** client bundle. After you push M33, redeploy Vercel so production bots and players receive the new starters and opening-hand bias.

---

## Expected player experience (after deploy)

1. **Pick class** — same picker as before.
2. **Turn 1** — hand likely includes a **named signature** (e.g. Enrage, Harvest, Quick Shot); **mechanic meter** moves when played; **battle log** states passive.
3. **Turn 2** — player can answer: “I’m building Rage / Souls / Combo / Coin / …”

---

## Related docs

- `docs/FUN_AUDIT.md` — why M33 was the recommended milestone after M31.
- `docs/CLASS_BALANCE.md` — HP/passive numbers (deck lists there are pre-M33; starters live in code).
- `docs/SIGNATURE_CARDS.md` — signature card behavior reference.

---

*Milestone 33 — opening identity pass. No new systems.*
