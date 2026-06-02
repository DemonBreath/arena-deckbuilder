# End-to-end testing (Playwright)

Browser bots drive the **live deployed** game at [https://overdrive-rosy.vercel.app](https://overdrive-rosy.vercel.app) (override with `PLAYWRIGHT_BASE_URL`).

**CI baseline (Milestone 31):** see **`docs/CI_MULTIPLAYER.md`** for the required smoke gate and failure-artifact guide.

## Setup

```bash
npm install
npx playwright install
```

## Run tests

| Command | What runs |
|---------|-----------|
| `npm run test:e2e` | **Multiplayer smoke** (`e2e/smoke.spec.ts`) — required CI gate, &lt;60s |
| `npm run test:e2e:smoke` | Same as `test:e2e` |
| `npm run test:e2e:final-duel` | Full 2-player best-of-3 series |
| `npm run test:e2e:all` | Smoke + Final Duel |
| `npm run test:e2e:headed` | Smoke with visible browser |
| `npm run test:e2e:ui` | Playwright UI mode |

## Smoke test flow (`test:e2e`)

1. **BotA** (host) — home, Guardian, fresh lobby code (`TBxxxx`)
2. **BotB** (guest) — `/lobby/<code>`, Berserker
3. Both ready; host starts round
4. Match room → intro → PvP combat (play cards, end turns)
5. Stops at **first Post-Match** screen
6. Asserts app shell is still visible (no black screen)

Uses **two isolated browser contexts** (separate `sessionStorage` session IDs).

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `PLAYWRIGHT_BASE_URL` | `https://overdrive-rosy.vercel.app` | Deployed site |
| `E2E_LOBBY_CODE` | *(auto `TB` + suffix)* | Fixed lobby; optional |

Requires **online mode** (Supabase on Vercel). If the title says “Online lobby unavailable”, fix env vars first.

### Supabase schema

Two-player lobbies use **Final Duel** (Milestone 23+). If round start fails with `final_duel_p1_wins` / schema cache, run **`supabase/fix_production_schema.sql`** and `npm run check:schema` — see `docs/PRODUCTION_MIGRATION.md`.

## Failure artifacts

On failure:

| Type | Path |
|------|------|
| Screenshot | `test-results/.../test-failed-1.png` (+ `-2` for BotB) |
| Video | `test-results/.../video.webm` |
| Trace | `test-results/.../trace.zip` → `npx playwright show-trace <path>` |
| HTML report | `playwright-report/` → `npx playwright show-report` |

Details: **`docs/CI_MULTIPLAYER.md`**.

## Test hooks (`data-testid`)

Selectors prefer `data-testid` and fall back to roles/CSS on older deploys.

| Hook | UI |
|------|-----|
| `champion-name-input` | Champion name |
| `lobby-code-input` | Lobby code |
| `join-lobby-button` | Join lobby |
| `class-card` + `data-class-id` | Class picker |
| `ready-button` | Ready |
| `start-match-button` | Start round |
| `begin-combat-button` | Match intro |
| `match-room-screen` | Match room |
| `match-intro-screen` | Scouting intro |
| `card-button` | Hand cards |
| `end-turn-button` | End turn |

## Local dev

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 npm run test:e2e
```

Run `npm run dev` and ensure `.env` has Supabase keys.
