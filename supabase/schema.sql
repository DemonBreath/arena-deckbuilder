-- Arena Deckbuilder — online lobby tables (no authentication)
-- Run this in the Supabase SQL Editor for your project.

-- Lobbies: one row per shared room code
create table if not exists public.lobbies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null default 'waiting'
    check (status in ('waiting', 'starting', 'in_match', 'shop', 'arena_draft', 'finished')),
  round_number int not null default 1,
  champion_player_id uuid references public.lobby_players (id) on delete set null,
  final_duel_player_1_id uuid references public.lobby_players (id) on delete set null,
  final_duel_player_2_id uuid references public.lobby_players (id) on delete set null,
  final_duel_p1_wins int not null default 0,
  final_duel_p2_wins int not null default 0,
  active_draft_ids jsonb not null default '[]'::jsonb,
  draft_history jsonb not null default '[]'::jsonb,
  draft_session jsonb,
  last_draft_result jsonb,
  created_at timestamptz not null default now()
);

-- Lobby players: anonymous sessions join with champion name + ready flag
create table if not exists public.lobby_players (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.lobbies (id) on delete cascade,
  session_id text not null,
  champion_name text not null,
  class_id text not null default 'guardian',
  ready boolean not null default false,
  lives int not null default 3,
  eliminated boolean not null default false,
  gold int not null default 0,
  opponents_defeated int not null default 0,
  shop_done boolean not null default false,
  deck jsonb,
  relics jsonb not null default '[]'::jsonb,
  evolution_id text,
  scouting_stats jsonb not null default '{
    "matchesWon": 0,
    "damageDealt": 0,
    "damageTaken": 0,
    "cardsPlayed": 0,
    "cardPlayCounts": {}
  }'::jsonb,
  rival_history jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz,
  unique (lobby_id, session_id)
);

create index if not exists lobby_players_lobby_id_idx on public.lobby_players (lobby_id);

-- Row Level Security: open read/write for anon (no login) — tighten before production
alter table public.lobbies enable row level security;
alter table public.lobby_players enable row level security;

create policy "lobbies_select_anon"
  on public.lobbies for select
  to anon, authenticated
  using (true);

create policy "lobbies_insert_anon"
  on public.lobbies for insert
  to anon, authenticated
  with check (true);

create policy "lobbies_update_anon"
  on public.lobbies for update
  to anon, authenticated
  using (true);

create policy "lobby_players_select_anon"
  on public.lobby_players for select
  to anon, authenticated
  using (true);

create policy "lobby_players_insert_anon"
  on public.lobby_players for insert
  to anon, authenticated
  with check (true);

create policy "lobby_players_update_anon"
  on public.lobby_players for update
  to anon, authenticated
  using (true);

create policy "lobby_players_delete_anon"
  on public.lobby_players for delete
  to anon, authenticated
  using (true);

-- Milestone 8: PvP match rooms
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.lobbies (id) on delete cascade,
  lobby_code text not null,
  player_1_id uuid not null references public.lobby_players (id) on delete cascade,
  player_2_id uuid references public.lobby_players (id) on delete cascade,
  player_1_loaded boolean not null default false,
  player_2_loaded boolean not null default false,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'completed')),
  battle_state jsonb,
  state_version int not null default 0,
  winner_player_id uuid references public.lobby_players (id) on delete set null,
  created_at timestamptz not null default now(),
  turn_start_at timestamptz,
  battle_started_at timestamptz,
  arena_phase text not null default 'normal'
    check (arena_phase in ('normal', 'sudden_death_1', 'sudden_death_2', 'final_duel')),
  final_duel_game int
);

create index if not exists matches_lobby_id_idx on public.matches (lobby_id);
create index if not exists matches_state_version_idx on public.matches (state_version);

create table if not exists public.lobby_pairing_byes (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.lobbies (id) on delete cascade,
  player_id uuid not null references public.lobby_players (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists lobby_pairing_byes_lobby_id_idx on public.lobby_pairing_byes (lobby_id);

alter table public.matches enable row level security;
alter table public.lobby_pairing_byes enable row level security;

create policy "matches_select_anon"
  on public.matches for select to anon, authenticated using (true);
create policy "matches_insert_anon"
  on public.matches for insert to anon, authenticated with check (true);
create policy "matches_update_anon"
  on public.matches for update to anon, authenticated using (true);

create policy "lobby_pairing_byes_select_anon"
  on public.lobby_pairing_byes for select to anon, authenticated using (true);
create policy "lobby_pairing_byes_insert_anon"
  on public.lobby_pairing_byes for insert to anon, authenticated with check (true);
create policy "lobby_pairing_byes_delete_anon"
  on public.lobby_pairing_byes for delete to anon, authenticated using (true);

-- Milestone 11: Daily Champions leaderboard (no login)
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

create index if not exists daily_champions_date_idx on public.daily_champions (date);
create index if not exists daily_champions_created_at_idx on public.daily_champions (created_at desc);

alter table public.daily_champions enable row level security;

create policy "daily_champions_select_anon"
  on public.daily_champions for select
  to anon, authenticated
  using (true);

create policy "daily_champions_insert_anon"
  on public.daily_champions for insert
  to anon, authenticated
  with check (true);

-- Realtime: enable replication for lobby + match tables
-- Dashboard → Database → Publications → supabase_realtime → add:
--   lobbies, lobby_players, matches, lobby_pairing_byes
