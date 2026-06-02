# Fun Audit — Milestone 32 (Closed Alpha Readiness)

**Scope:** Read-only review of the **current shipped game** as implemented in this repo and exercised on production (`https://overdrive-rosy.vercel.app`). No new features or systems are proposed here—only what exists today and how it feels in flow.

**Method:** Code inspection of combat, classes, rewards, lobby, and Final Duel; cross-check with Milestone 31 E2E smoke/final-duel runs (Guardian vs Berserker bots).

**North star:** *What would make players want one more run?*

---

## Executive summary

The game has a **strong arena skeleton**: readable combat, fair post-match rewards, escalating phases, scouting, rivals, arena drafts, and a real Final Duel climax. Multiplayer is stable (Milestone 31).

The main fun gap is **pacing mismatch**: players spend a long time in **lobby → connection → intro → post-match UI**, then fight **very short combats** (often 2–3 turns) where **12 of 20 classes** open with the **same generic Strike/Guard deck**. Class identity, signature cards, and economy payoffs mostly arrive **after** the fight—or never in a single match.

For closed alpha, the hook is there; the **first minute of each round** does not yet sell “pick this class again.”

---

## 1. Playtest review (by flow)

### Class system

| Fact (code) | Fun impact |
|-------------|------------|
| **20 playable classes** in `classDatabase.ts` (`CLASS_REGISTRY`) | Huge variety on paper; hard to learn in alpha. |
| **Baseline:** 30 HP, 3 energy, 5-card hand (`PVP_MAX_HP`, `PVP_HAND_SIZE` in `pvpBattleState.ts`) | Simple, teachable core loop. |
| **HP spread:** 24 (Berserker) → 38 (Guardian) | Meaningful in longer fights; compressed in Final Duel (−10 HP penalty in `arenaPhase.ts`). |
| **12 classes** start with **only** Strike, Guard, Strike+, Guard+, Heavy Strike | First fights feel **samey** regardless of class pick. |
| **8 classes** add 3 **non-signature** class cards in starters (Pirate, Chef, Dragon Knight, etc.) | Slightly more identity at game 1. |
| **All 20** have 3 **signature** cards in `classCardPools.ts` — **none** in starter decks | Signatures appear via rewards/shop (12% signature roll); often **not seen** in a short match. |
| Passives + mechanic meters (`classPassives.ts`, `classMechanics.ts`) | Good UI hooks; many meters never reach thresholds before HP hits 0. |
| Evolutions after **3 wins** (`EVOLUTION_TRIGGER_AFTER_BATTLES_WON` in `classEvolutions.ts`) | Strong mid-run goal; irrelevant in a single early elimination. |

**Class picker** (`ClassSelectionScreen.tsx`) shows role, difficulty, and tagline—useful—but **in-combat differentiation** lags what the picker promises.

---

### Combat flow

| Step | What happens | Typical player time |
|------|----------------|---------------------|
| Match room | Wait for both clients loaded (`MatchRoomView.tsx`, `markPlayerLoadedInMatch`) | Variable (network) |
| Intro | Scouting report + rival panel + **Begin combat** (`MatchIntroductionScreen.tsx`) | Read or skip—extra gate before cards |
| Turn start | Clear hand, draw 5 (6 for Bard/Timekeeper), +block passives, refill 3 energy | Automatic |
| Play phase | Spend energy on cards; passives/mechanics modify damage/heal | **Often &lt;10s** of clicks |
| End turn | Manual **End Turn** (`PvpCombatView.tsx`) | 1 click |
| Win | HP ≤ 0 (`applyPlayCard` in `pvpBattleState.ts`) | Sudden end |

**Timers** (`arenaPhase.ts`, `pvpTimers.ts`):

- Normal / SD1: **60s** per turn, **20 min** match cap  
- SD2: **45s** turn, **12 min** match  
- Final Duel: **50s** turn, **15 min** match, **−10 HP** at start  

**Observed in E2E (production bots):** Guardian vs Berserker fights routinely end in **2–3 turns** (~20–40s of combat). Turn timers are almost never the constraint—**damage outpaces defense** in the opening deck meta.

**Combat strengths:** Clear Strike/Guard math (6/9/14 damage, 5/8 block in `cardDatabase.ts`), visible turn banner, mechanic meter, battle log, emotes.

**Combat friction:** Opponent hand hidden (fine for PvP), but **no in-match comeback tools** if you draw guard-heavy while behind on HP.

---

### Reward flow

| Step | Screen | Clicks |
|------|--------|--------|
| Match ends | `MatchResultsView.tsx` → `result` | Stats + **Choose your reward** (or evolution) |
| Evolution | Winners at 3+ wins, no evolution yet | Pick evolution + confirm |
| Rewards | 3 offers (`postMatchRewards.ts`) | Pick 1 of add / upgrade / remove / +30 gold |
| Summary | Deck + gold | **Continue to Shop** |

**Design win:** Same reward quality for winners and losers (stated in UI and `generatePostMatchRewardOffers`).

**Friction:**

- **3–4 screens** after a 30-second fight feels top-heavy.  
- **Continue to Shop** label is wrong in **Final Duel** mid-series—lobby returns with status `waiting`, not `shop` (`applyFinalDuelMatchResult` in `arenaService.ts`).  
- **Pirate** gets +15 gold on every reward claim (`getClassVictoryGoldBonus`) even on losses—strong but opaque in UI.

---

### Lobby flow

| Step | Requirement |
|------|-------------|
| Join | Up to 8 players (`ARENA_MAX_PLAYERS`) |
| Ready | Supabase connected; toggle ready (`useOnlineLobby.ts`) |
| Start | **Host only** (`canHostStart`, `OnlineLobbyView.tsx`) |
| Pairing | ≥2 ready actives; shuffle pairs; bye grants 30 gold (`matchService.ts`) |
| Route | `resolvePlayerAssignment` → match / bye / shop / draft / champion / spectator |

**Strengths:** Roster table, invite link, phase banners, reconnect paths.

**Friction:**

- **Host gate** every round—non-hosts wait even when everyone is ready.  
- **`in_match`** hides ready UI—feels frozen while assignment resolves.  
- **Bye screen** does not auto-route to shop; player must **Back to Lobby** (`ByeView.tsx` vs lobby hook mount).  
- **Parallel matches** (4+ players): `applyMatchArenaProgression` runs per match completion—first finisher can advance lobby before other tables end (`arenaService.ts`).

---

### Final Duel flow

| Rule | Source |
|------|--------|
| Trigger | 2 active players → `ensureFinalDuelLobby` |
| Series | Best of 3, first to **2** wins (`FINAL_DUEL_WINS_REQUIRED`) |
| Lives | **No life loss** on defeat (`applyFinalDuelMatchResult` vs `applyStandardMatchResult`) |
| Between games | Lobby `waiting`, **no shop**—ready → host start again |
| End | `crownChampion` → champion screen (`OnlineChampionView.tsx`) |

**Strengths:** Clear series score in UI (`formatFinalDuelSeriesScore`), high stakes without elimination, rival/champion payoff.

**Friction:**

- Same **post-match reward ceremony** between games without shop power spike—rhythm is fight → rewards → lobby → host wait → fight.  
- **−10 HP** makes low-HP classes (Berserker **14 HP**) die in **one strong turn**—series can feel swingy rather than tactical.  
- Host must start **each** game in the series.

---

## 2. Class rankings (current build, grounded in rules + flow)

These are **audit judgments** from stats, starter decks, phase penalties, and typical fight length—not live telemetry.

### Strongest class (PvP / Final Duel as implemented)

**Berserker** — `bloodlust` adds +2 to Strike and Heavy Strike (`classPassives.ts`). With 6× Strike / 2× Heavy in starter deck, burst aligns with **short fights**. In Final Duel, 24 − 10 = **14 max HP** for opponents but damage output stays full—favors the aggressor.

**Runners-up:** **Assassin** (first-attack passive + Edge mechanic), **Pyromancer** (+1 on all attacks), **Gunslinger** (multi-Strike turns when draws cooperate).

### Weakest class (same conditions)

**Merchant** — −4 HP, combat power from **Coin** meter and gold (`classDatabase.ts`); **Final Duel skips shop** between games, muting the economy fantasy. In combat, plays like a generic striker with worse stats.

**Runners-up:** **Cryomancer** / **Paladin** (stall passives, low kill pressure per `intendedWeakness` in registry), **Guardian** in timed finals (cannot close before HP penalties stack).

### Most fun class (agency + visible payoff)

**Gunslinger** — Combo Shot rewards sequencing Strikes in one turn; meter threshold at 3 Strikes is reachable in a 3-turn fight.

**Honorable mentions:** **Assassin** (timing first attack), **Monk** (2nd+ attack bonuses), **Engineer** (even-turn energy spikes), **Timekeeper** (6-card hands, turn-1 energy bonus in `getClassOpeningEnergyBonus`).

### Most boring class (low decision variance in practice)

**Guardian** — Starter is 6× Guard / 2× Guard+ / 2× Strike; Fortify block is strong but **damage is low** (`intendedWeakness`). Mirrors devolve into block trades that **timers outlive**—or lose to burst before identity matters.

**Honorable mentions:** **Cryomancer** (same stall pattern), **Merchant** (weak combat, economy not felt in Bo3 series).

---

## 3. Turn feel

### Turns that feel too long

| Situation | Why |
|-----------|-----|
| **60s / 50s turn clock** with 3 energy | Optimal line is often 3–4 clicks; most seconds are waiting. |
| **Opponent’s turn** | No parallel actions—pure wait. |
| **Match intro** | Full scouting panel before first card (`MatchIntroductionScreen.tsx`). |
| **Post-match chain** | Multiple screens after a short fight. |
| **Lobby → host start** | Especially between Final Duel games. |
| **Arena draft vote** | Up to **45s** (`ARENA_DRAFT_VOTE_DURATION_MS`) even after you voted. |
| **Shop sync** | Blocked until all survivors click Continue (`tryAdvanceLobbyFromShop`). |

### Turns that feel too short

| Situation | Why |
|-----------|-----|
| **Whole combat** | Often **2–3 turns** total in E2E and bot play (dump energy, end turn, repeat). |
| **Mechanic thresholds** | e.g. Guardian Resolve 5, Vampire Blood 6—unreachable if fight ends turn 3. |
| **Scaling classes** | Warlord / Dragon Knight turn-based damage (`scalingDamageFromTurns`) needs turns that do not exist. |
| **Final Duel game** | Can end before either player shops or sees a signature card. |

### Dead turns

| Situation | Why |
|-----------|-----|
| **Low damage hand** | Only Guards in hand while behind—playing them **delays loss** without threatening win; correct play is passive. |
| **Energy left, no attacks** | 1 energy + only Guard+ after attacks—end turn is mandatory. |
| **Disconnected opponent** | 90s forfeit window (`MATCH_DISCONNECT_FORFEIT_MS`)—winner waits. |
| **Non-host ready** | Everyone ready but host AFK—no round start. |

### Repetitive turns

| Pattern | Why |
|---------|-----|
| **Strike → Strike → Guard → End** | Core cards dominate starters; bots and humans converge on this (`playBestCard` in E2E). |
| **Same intro flow** | Every match: connect → scouting → begin combat. |
| **Same reward UI** | Pick 1 of 3 structurally identical offers. |
| **Generic openers** | 12 classes share the same 10-card skeleton. |

---

## 4. Top 10 gameplay issues (alpha-blocking fun)

1. **Setup-to-fight ratio is inverted** — Minutes of lobby/intro/post-match vs ~30s of combat (E2E-confirmed).
2. **Class pick does not change game 1 enough** — 12/20 starters are generic Strike/Guard packages (`classDatabase.ts`).
3. **Signature cards rarely shape a run** — Not in starters; 12% reward roll; fights end early (`classCardPools.ts`).
4. **Turn timers exceed decision time** — 45–60s clocks vs 3-energy turns (`arenaPhase.ts`).
5. **Final Duel HP penalty + burst** — −10 HP and Berserker-style passives end games before series tension builds.
6. **Host-gated round start** — Repeated friction, especially between Bo3 games (`OnlineLobbyView.tsx`).
7. **Post-match UI is heavy for fight length** — 3–4 steps per match (`MatchResultsView.tsx`).
8. **Economy classes muted in finals** — Merchant/Pirate passives matter in shop phase; Final Duel skips shop (`arenaService.ts`).
9. **Tank mirrors lack kill pressure** — Guardian/Cryomancer/Paladin kits per registry weaknesses; timers favor stall or timeout.
10. **8-player round race** — Lobby can advance when one table finishes (`applyMatchArenaProgression`).

---

## 5. Top 10 gameplay strengths (keep these)

1. **Readable core combat** — Strike/Guard/Heavy costs and numbers are easy to parse (`cardDatabase.ts`).
2. **Fair post-match rewards** — Losers get same offer quality; +30 gold option (`postMatchRewards.ts`, UI copy).
3. **Final Duel climax** — Bo3, no life loss, series score, champion screen (`arenaPhase.ts`, `OnlineChampionView.tsx`).
4. **Phase escalation** — Normal → Sudden Death I/II → Final Duel with HP penalties and banners (`resolveArenaPhase`).
5. **Scouting + rivals** — Pre-fight intel and rival history (`MatchIntroductionScreen.tsx`, `rivalIntel.ts`)—unique flavor.
6. **Arena drafts** — Lobby-wide modifiers every 2 rounds add surprise (`arenaDrafts.ts`, `arenaDraftService.ts`).
7. **Visible class mechanics** — Meters and hints in combat UI (`ClassMechanicMeter`, `classMechanics.ts`).
8. **Emotes in PvP** — Social presence without chat toxicity (`PvpCombatView.tsx`).
9. **Evolution milestone at 3 wins** — Mid-run power spike choice (`classEvolutions.ts`).
10. **Stable multiplayer baseline** — Milestone 31 smoke test proves full loop on production (`docs/CI_MULTIPLAYER.md`).

---

## 6. “One more run” — what already works vs what’s missing

| Works today | Missing for hook |
|-------------|------------------|
| Winning a Bo3 crown | Feeling **your class** won, not generic Strikes |
| Draft modifiers stacking | **First match** that shows class fantasy |
| Rival rematch narrative | Faster **rematch** loop (less UI between fights) |
| Building deck via rewards | **Visible** deck change before next fight in finals |
| 8-player stories | **2-player** duels (most tested) need punchier mid-series pacing |

Players will queue again when:

- The **next fight** promises a different puzzle (class card, meter threshold, draft modifier).
- **Loss** still gave a tangible pick (already good) and a quick path to rematch.
- **Win** felt earned from a sequence, not 3 turns of defaults.

---

## 7. Recommended next gameplay milestone (no new systems)

### Milestone 33: **Combat pacing & opening identity pass**

**Goal:** Align time spent fighting with time spent in menus; make class choice matter in the **first 60 seconds** of combat.

**Tune / UX only (existing systems):**

| Area | Direction |
|------|-----------|
| **Opening decks** | Give every class at least **1 non-signature class card** in starters (pattern already used by Pirate/Chef/etc.). |
| **Fight length** | Target **4–6 turns** average for starter-deck mirrors—adjust global damage/HP or phase penalties, not new rules. |
| **Turn timer** | Align with actual play (~20–30s normal) or add clear “time bank” UX—reduce dead wait. |
| **Post-match** | Collapse result + reward + continue where possible; fix **Continue to Shop** copy in Final Duel. |
| **Final Duel rhythm** | Optional minimal shop or single between-game reward pick (existing shop/reward code)—only if it stays one system, not a new layer. |
| **Host start** | Auto-start when all ready in **2-player Final Duel** (lobby already knows count). |
| **Alpha roster** | Feature 6–8 classes in UI for closed alpha (`getPlayableClasses`) so picks are learnable. |

**Success metrics for alpha:**

- Smoke test still passes (`npm run test:e2e`).
- Playtesters can name **what their class did** in game 1 without reading a wiki.
- Median combat lasts long enough for **one** mechanic threshold to fire.
- Rematch after loss takes **&lt;90s** wall clock (lobby → fight) in 2-player lobbies.

---

## 8. Sources referenced

| Topic | Files |
|-------|--------|
| Classes | `src/game/classDatabase.ts`, `classPassives.ts`, `classMechanics.ts`, `classCardPools.ts` |
| Combat | `src/game/pvpBattleState.ts`, `src/components/PvpCombatView.tsx`, `src/game/cardDatabase.ts` |
| Phases | `src/game/arenaPhase.ts`, `src/game/pvpTimers.ts` |
| Rewards | `src/game/postMatchRewards.ts`, `src/components/MatchResultsView.tsx` |
| Shop | `src/hooks/useOnlineShop.ts`, `src/components/OnlineShopView.tsx` |
| Lobby / pairing | `src/hooks/useOnlineLobby.ts`, `src/services/matchService.ts` |
| Final Duel | `src/services/arenaService.ts` |
| Draft | `src/game/arenaDrafts.ts`, `src/services/arenaDraftService.ts` |
| E2E timing | `e2e/smoke.spec.ts`, `e2e/helpers/playerBot.ts`, `docs/CI_MULTIPLAYER.md` |
| Balance notes | `docs/CLASS_BALANCE.md` (M20; still directionally accurate) |

---

*Milestone 32 deliverable — analysis only. No gameplay code changed.*
