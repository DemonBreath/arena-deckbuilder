# Supabase setup — online PvP arena

No login or authentication. Players join with a **champion name** and **lobby code** (up to 8 players).

## 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and create a project.
2. Wait for the database to finish provisioning.

## 2. Run the database schema

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste the contents of `supabase/schema.sql` and run it (new projects).

## 3. Upgrading from earlier milestones

| If you have… | Also run… |
|--------------|-----------|
| M7 only | `migration_m8_matches.sql`, `migration_m9_pvp_combat.sql`, `migration_m10_arena.sql` |
| M8 | `migration_m9_pvp_combat.sql`, `migration_m10_arena.sql` |
| M9 | `migration_m10_arena.sql`, `migration_m11_champions.sql` |
| M10 | `migration_m11_champions.sql` |

## 4. Enable Realtime

Add tables to `supabase_realtime`: `lobbies`, `lobby_players`, `matches`, `lobby_pairing_byes`.

## 5. Environment variables

Copy `.env.example` → `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Restart `npm run dev`.

## 6. Run the game

```bash
npm install
npm run dev
```

- **Without `.env`:** Solo run and daily champions still work.
- **With `.env`:** Full online arena from lobby → PvP battles → shop → champion.

## Milestone 11 — Daily Champions table

Run `supabase/migration_m11_champions.sql` (included in full `schema.sql`).

Table `daily_champions`: `champion_name`, `lobby_code`, `date`, `opponents_defeated`, `final_deck_size`, `relic_count`, `total_gold_earned`, `created_at`.

Open anon SELECT/INSERT policies (prototype). No auth required.

## Milestone 10 — arena fields

- `lobby_players`: `gold`, `opponents_defeated`, `shop_done`, `deck`, `relics`
- `lobbies`: `round_number`, `champion_player_id`, statuses `shop` and `finished`

## Security note

Open anon RLS policies are for prototyping only. Tighten before production.
