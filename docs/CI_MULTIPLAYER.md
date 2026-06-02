# CI multiplayer baseline (Milestone 31)

Every milestone that touches online PvP must keep the **multiplayer smoke test** green before it is considered done.

Target deployment: [https://overdrive-rosy.vercel.app](https://overdrive-rosy.vercel.app)  
Requires production Supabase schema through Milestone 26 (`docs/PRODUCTION_MIGRATION.md`).

---

## Required gate: `npm run test:e2e`

This is the **default multiplayer smoke test**. It runs `e2e/smoke.spec.ts` only.

```bash
npm install
npx playwright install
npm run test:e2e
```

**Target runtime:** under **60 seconds**.

### What it verifies

| Step | Check |
|------|--------|
| 1 | BotA opens home, joins a **fresh** lobby as host (Guardian) |
| 2 | BotB opens invite URL, joins as guest (Berserker) |
| 3 | Both appear on the arena roster |
| 4 | Both click **Ready for Round** (Supabase connected) |
| 5 | Host clicks **Start Round** |
| 6 | Both reach **match room** / intro (leave “Connecting players…”) |
| 7 | Both acknowledge intro and enter **PvP combat** |
| 8 | Bots play cards and end turns |
| 9 | At least one bot reaches **Post-Match** (first game in Final Duel) |
| 10 | No blank screen — `.app` shell still visible |

Flow in one line:

**join lobby → ready → start round → match room → intro → combat → post-match**

Console output is prefixed `[BotA]` and `[BotB]` for debugging.

---

## Optional commands

| Command | Spec | Purpose | Typical runtime |
|---------|------|---------|-----------------|
| `npm run test:e2e` | `e2e/smoke.spec.ts` | **CI gate** — smoke | &lt; 60s |
| `npm run test:e2e:smoke` | same as above | Explicit alias | &lt; 60s |
| `npm run test:e2e:final-duel` | `e2e/final-duel.spec.ts` | Full best-of-3 series | 5–15 min |
| `npm run test:e2e:all` | all `e2e/*.spec.ts` | Smoke + Final Duel | varies |
| `npm run test:e2e:headed` | smoke (headed) | Watch bots in browser | &lt; 60s |
| `npm run test:e2e:ui` | Playwright UI | Interactive debug | — |
| `npm run check:schema` | `scripts/check_schema.ts` | Supabase column check | few seconds |

### Full Final Duel: `npm run test:e2e:final-duel`

Plays a **complete 2-player best-of-3** on production:

- Up to three games in the series
- Post-match rewards + shop between games
- Ready → start round for each subsequent game
- Asserts **series winner** (Arena Champion or `Series 2–x` / `Series x–2`)
- Asserts **no black screen** on either bot

Use before large releases or after schema/combat changes. Not required on every PR if smoke passes.

---

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PLAYWRIGHT_BASE_URL` | `https://overdrive-rosy.vercel.app` | Site under test |
| `E2E_LOBBY_CODE` | auto `TBxxxx` | Fixed lobby code (optional) |

Local dev example:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 npm run test:e2e
```

---

## Failure artifacts

When a test fails, Playwright writes artifacts under the project root:

| Artifact | Location | How to open |
|----------|----------|-------------|
| **Screenshot** | `test-results/<test-folder>/test-failed-1.png` (and `-2.png` for second context) | Any image viewer |
| **Video** | `test-results/<test-folder>/video.webm` | VLC, browser, or VS Code |
| **Trace** | `test-results/<test-folder>/trace.zip` | `npx playwright show-trace test-results/<folder>/trace.zip` |
| **HTML report** | `playwright-report/index.html` | `npx playwright show-report` |

Tips:

- Two browser contexts (BotA + BotB) → often **two** screenshots (`test-failed-1`, `test-failed-2`).
- Traces include DOM snapshots, network, and console — best for “stuck on Connecting” or strict-mode issues.
- Videos are only retained **on failure** (`retain-on-failure` in `playwright.config.ts`).

Clean up locally:

```bash
rm -rf test-results playwright-report
```

(CI should upload `test-results/` as a build artifact.)

---

## Schema check (run before E2E if lobby errors)

```bash
# .env must contain VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run check:schema
```

If `final_duel_p1_wins` or related columns fail, run `supabase/fix_production_schema.sql` on the Supabase project.

---

## Milestone checklist

Before marking a milestone **done**:

- [ ] `npm run test:e2e` passes on production (or documented reason + follow-up issue)
- [ ] No new Supabase migrations without `check:schema` + migration doc update
- [ ] If combat/lobby UI changed, smoke still finds match room and post-match (update selectors only if needed)

---

## Related docs

- `docs/E2E_TESTING.md` — selector hooks and setup
- `docs/PRODUCTION_MIGRATION.md` — Supabase repair SQL
