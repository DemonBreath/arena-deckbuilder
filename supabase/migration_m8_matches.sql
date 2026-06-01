-- Milestone 8: PvP match rooms + bye tracking
-- Run this if you already applied schema.sql from Milestone 7.

-- Shared PvP matches (2 players per row; null player_2 only during invalid states)
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

create index if not exists matches_lobby_id_idx on public.matches (lobby_id);
create index if not exists matches_player_1_idx on public.matches (player_1_id);
create index if not exists matches_player_2_idx on public.matches (player_2_id);

-- Players with a bye when odd ready count (not in a 1v1 match this round)
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

-- Realtime: add matches and lobby_pairing_byes to supabase_realtime publication
-- Dashboard → Database → Publications → supabase_realtime
