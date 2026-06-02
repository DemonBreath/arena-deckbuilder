-- =============================================================================
-- Arena Deckbuilder — production schema repair (Milestones 8–26)
-- =============================================================================
--
-- Purpose:
--   Bring an existing Supabase production database in line with the current app
--   (through Milestone 26). Safe to run multiple times (idempotent).
--
-- Source migrations consolidated:
--   supabase/migration_m8_matches.sql
--   supabase/migration_m9_pvp_combat.sql
--   supabase/migration_m10_arena.sql
--   supabase/migration_m11_champions.sql
--   supabase/migration_m14_reconnect.sql
--   supabase/migration_m15_timers.sql
--   supabase/migration_m18_class_id.sql
--   supabase/migrations/023_sudden_death_arena.sql   ← Final Duel columns
--   supabase/migrations/024_arena_draft.sql
--   supabase/migrations/025_scouting_intelligence.sql
--   supabase/migrations/026_rival_system.sql
--
-- Canonical reference: supabase/schema.sql
--
-- How to run: Supabase Dashboard → SQL Editor → paste → Run
-- Then: NOTIFY pgrst, 'reload schema';  (or wait ~1 min for API cache refresh)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Milestone 8: matches + lobby_pairing_byes (if never created)
-- -----------------------------------------------------------------------------

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.lobbies (id) on delete cascade,
  lobby_code text not null,
  player_1_id uuid not null references public.lobby_players (id) on delete cascade,
  player_2_id uuid references public.lobby_players (id) on delete cascade,
  player_1_loaded boolean not null default false,
  player_2_loaded boolean not null default false,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'completed')),
  created_at timestamptz not null default now()
);

comment on table public.matches is 'M8: PvP match rooms (one row per pairing per round)';

create index if not exists matches_lobby_id_idx on public.matches (lobby_id);
create index if not exists matches_player_1_idx on public.matches (player_1_id);
create index if not exists matches_player_2_idx on public.matches (player_2_id);

create table if not exists public.lobby_pairing_byes (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.lobbies (id) on delete cascade,
  player_id uuid not null references public.lobby_players (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.lobby_pairing_byes is 'M8: players with a bye when ready count is odd';

create index if not exists lobby_pairing_byes_lobby_id_idx on public.lobby_pairing_byes (lobby_id);

-- -----------------------------------------------------------------------------
-- Milestone 9: PvP combat state on matches; lives on lobby_players
-- -----------------------------------------------------------------------------

alter table public.lobby_players
  add column if not exists lives int not null default 3;

comment on column public.lobby_players.lives is 'M9: remaining arena lives (default 3)';

alter table public.lobby_players
  add column if not exists eliminated boolean not null default false;

comment on column public.lobby_players.eliminated is 'M9: true when lives reach 0';

alter table public.matches
  add column if not exists battle_state jsonb;

comment on column public.matches.battle_state is 'M9: serialized PvP battle state';

alter table public.matches
  add column if not exists state_version int not null default 0;

comment on column public.matches.state_version is 'M9: optimistic concurrency for battle sync';

alter table public.matches
  add column if not exists winner_player_id uuid references public.lobby_players (id) on delete set null;

comment on column public.matches.winner_player_id is 'M9: set when match status is completed';

create index if not exists matches_state_version_idx on public.matches (state_version);

-- -----------------------------------------------------------------------------
-- Milestone 10: full arena run fields
-- -----------------------------------------------------------------------------

alter table public.lobby_players
  add column if not exists gold int not null default 0;

comment on column public.lobby_players.gold is 'M10: shop gold for this lobby run';

alter table public.lobby_players
  add column if not exists opponents_defeated int not null default 0;

comment on column public.lobby_players.opponents_defeated is 'M10: opponents defeated this run';

alter table public.lobby_players
  add column if not exists shop_done boolean not null default false;

comment on column public.lobby_players.shop_done is 'M10: player finished post-round shop';

alter table public.lobby_players
  add column if not exists deck jsonb;

comment on column public.lobby_players.deck is 'M10: current deck card ids (json array)';

alter table public.lobby_players
  add column if not exists relics jsonb not null default '[]'::jsonb;

comment on column public.lobby_players.relics is 'M10: relic ids owned this run';

alter table public.lobbies
  add column if not exists round_number int not null default 1;

comment on column public.lobbies.round_number is 'M10: current arena round number';

alter table public.lobbies
  add column if not exists champion_player_id uuid references public.lobby_players (id) on delete set null;

comment on column public.lobbies.champion_player_id is 'M10: crowned champion when status is finished';

-- -----------------------------------------------------------------------------
-- Milestone 11: daily_champions leaderboard
-- -----------------------------------------------------------------------------

create table if not exists public.daily_champions (
  id uuid primary key default gen_random_uuid(),
  champion_name text not null,
  lobby_code text not null,
  date date not null,
  opponents_defeated int not null default 0,
  final_deck_size int not null default 0,
  relic_count int not null default 0,
  total_gold_earned int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.daily_champions is 'M11: public daily leaderboard (no auth)';

create index if not exists daily_champions_date_idx on public.daily_champions (date);
create index if not exists daily_champions_created_at_idx on public.daily_champions (created_at desc);

-- -----------------------------------------------------------------------------
-- Milestone 14: reconnect / presence
-- -----------------------------------------------------------------------------

alter table public.lobby_players
  add column if not exists last_seen_at timestamptz;

comment on column public.lobby_players.last_seen_at is 'M14: last heartbeat for presence';

-- -----------------------------------------------------------------------------
-- Milestone 15: PvP turn timers
-- -----------------------------------------------------------------------------

alter table public.matches
  add column if not exists turn_start_at timestamptz;

comment on column public.matches.turn_start_at is 'M15: server timestamp when current turn started';

alter table public.matches
  add column if not exists battle_started_at timestamptz;

comment on column public.matches.battle_started_at is 'M15: when battle phase became active';

-- -----------------------------------------------------------------------------
-- Milestone 18: class selection persisted per player
-- -----------------------------------------------------------------------------

alter table public.lobby_players
  add column if not exists class_id text not null default 'guardian';

comment on column public.lobby_players.class_id is 'M18: selected ClassId for this run';

-- -----------------------------------------------------------------------------
-- Milestone 23: Sudden Death Arena + Final Duel (best-of-3)
-- Introduces: final_duel_p1_wins, final_duel_p2_wins, and related fields
-- -----------------------------------------------------------------------------

alter table public.lobbies
  add column if not exists final_duel_player_1_id uuid references public.lobby_players (id) on delete set null;

comment on column public.lobbies.final_duel_player_1_id is 'M23: finalist slot 1 when 2 players remain';

alter table public.lobbies
  add column if not exists final_duel_player_2_id uuid references public.lobby_players (id) on delete set null;

comment on column public.lobbies.final_duel_player_2_id is 'M23: finalist slot 2 when 2 players remain';

alter table public.lobbies
  add column if not exists final_duel_p1_wins int not null default 0;

comment on column public.lobbies.final_duel_p1_wins is 'M23: Final Duel game wins for player 1 (first to 2 wins series)';

alter table public.lobbies
  add column if not exists final_duel_p2_wins int not null default 0;

comment on column public.lobbies.final_duel_p2_wins is 'M23: Final Duel game wins for player 2 (first to 2 wins series)';

-- arena_phase: add nullable first, backfill, then enforce NOT NULL + check
alter table public.matches
  add column if not exists arena_phase text;

comment on column public.matches.arena_phase is 'M23: sudden death / final duel phase for this match';

update public.matches
set arena_phase = 'normal'
where arena_phase is null;

alter table public.matches
  alter column arena_phase set default 'normal';

alter table public.matches
  alter column arena_phase set not null;

alter table public.matches
  add column if not exists final_duel_game int;

comment on column public.matches.final_duel_game is 'M23: game number within Final Duel series (1, 2, or 3)';

-- -----------------------------------------------------------------------------
-- Milestone 24: Arena Draft System
-- -----------------------------------------------------------------------------

alter table public.lobbies
  add column if not exists active_draft_ids jsonb not null default '[]'::jsonb;

comment on column public.lobbies.active_draft_ids is 'M24: ids of in-progress arena drafts';

alter table public.lobbies
  add column if not exists draft_history jsonb not null default '[]'::jsonb;

comment on column public.lobbies.draft_history is 'M24: completed draft records';

alter table public.lobbies
  add column if not exists draft_session jsonb;

comment on column public.lobbies.draft_session is 'M24: current live draft session payload';

alter table public.lobbies
  add column if not exists last_draft_result jsonb;

comment on column public.lobbies.last_draft_result is 'M24: most recent draft outcome for UI';

-- -----------------------------------------------------------------------------
-- Milestone 25: Scouting and Intelligence
-- -----------------------------------------------------------------------------

alter table public.lobby_players
  add column if not exists evolution_id text;

comment on column public.lobby_players.evolution_id is 'M25: picked evolution branch id';

alter table public.lobby_players
  add column if not exists scouting_stats jsonb not null default '{
    "matchesWon": 0,
    "damageDealt": 0,
    "damageTaken": 0,
    "cardsPlayed": 0,
    "cardPlayCounts": {}
  }'::jsonb;

comment on column public.lobby_players.scouting_stats is 'M25: per-run scouting aggregates for match intro';

-- -----------------------------------------------------------------------------
-- Milestone 26: Rival System
-- -----------------------------------------------------------------------------

alter table public.lobby_players
  add column if not exists rival_history jsonb not null default '{}'::jsonb;

comment on column public.lobby_players.rival_history is 'M26: head-to-head record keyed by opponent player id';

-- -----------------------------------------------------------------------------
-- Constraints (safe replace: drop if exists, then add)
-- -----------------------------------------------------------------------------

-- M10 + M24: lobby status must include shop, arena_draft, finished, etc.
alter table public.lobbies
  drop constraint if exists lobbies_status_check;

alter table public.lobbies
  add constraint lobbies_status_check
  check (status in ('waiting', 'starting', 'in_match', 'shop', 'arena_draft', 'finished'));

comment on constraint lobbies_status_check on public.lobbies is 'M10/M24: allowed lobby lifecycle statuses';

-- M23: arena_phase enum values on matches
alter table public.matches
  drop constraint if exists matches_arena_phase_check;

alter table public.matches
  add constraint matches_arena_phase_check
  check (arena_phase in ('normal', 'sudden_death_1', 'sudden_death_2', 'final_duel'));

comment on constraint matches_arena_phase_check on public.matches is 'M23: sudden death and final duel phases';

-- M8: match status (re-assert if an old DB used different values)
alter table public.matches
  drop constraint if exists matches_status_check;

alter table public.matches
  add constraint matches_status_check
  check (status in ('waiting', 'active', 'completed'));

comment on constraint matches_status_check on public.matches is 'M8: match lifecycle';

-- -----------------------------------------------------------------------------
-- Row Level Security (open anon policies — matches schema.sql)
-- Only created if missing
-- -----------------------------------------------------------------------------

alter table public.lobbies enable row level security;
alter table public.lobby_players enable row level security;
alter table public.matches enable row level security;
alter table public.lobby_pairing_byes enable row level security;
alter table public.daily_champions enable row level security;

do $$
begin
  create policy "lobbies_select_anon"
    on public.lobbies for select to anon, authenticated using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "lobbies_insert_anon"
    on public.lobbies for insert to anon, authenticated with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "lobbies_update_anon"
    on public.lobbies for update to anon, authenticated using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "lobby_players_select_anon"
    on public.lobby_players for select to anon, authenticated using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "lobby_players_insert_anon"
    on public.lobby_players for insert to anon, authenticated with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "lobby_players_update_anon"
    on public.lobby_players for update to anon, authenticated using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "lobby_players_delete_anon"
    on public.lobby_players for delete to anon, authenticated using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "matches_select_anon"
    on public.matches for select to anon, authenticated using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "matches_insert_anon"
    on public.matches for insert to anon, authenticated with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "matches_update_anon"
    on public.matches for update to anon, authenticated using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "lobby_pairing_byes_select_anon"
    on public.lobby_pairing_byes for select to anon, authenticated using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "lobby_pairing_byes_insert_anon"
    on public.lobby_pairing_byes for insert to anon, authenticated with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "lobby_pairing_byes_delete_anon"
    on public.lobby_pairing_byes for delete to anon, authenticated using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "daily_champions_select_anon"
    on public.daily_champions for select to anon, authenticated using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "daily_champions_insert_anon"
    on public.daily_champions for insert to anon, authenticated with check (true);
exception
  when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- Refresh PostgREST schema cache (fixes "schema cache" errors in the API)
-- -----------------------------------------------------------------------------

notify pgrst, 'reload schema';
