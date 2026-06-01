-- Milestone 10: full PvP arena elimination flow

alter table public.lobby_players
  add column if not exists gold int not null default 0,
  add column if not exists opponents_defeated int not null default 0,
  add column if not exists shop_done boolean not null default false,
  add column if not exists deck jsonb,
  add column if not exists relics jsonb not null default '[]'::jsonb;

alter table public.lobbies
  add column if not exists round_number int not null default 1,
  add column if not exists champion_player_id uuid references public.lobby_players (id) on delete set null;

-- Expand lobby status values (drop/recreate check if present)
alter table public.lobbies drop constraint if exists lobbies_status_check;
alter table public.lobbies
  add constraint lobbies_status_check
  check (status in ('waiting', 'starting', 'in_match', 'shop', 'finished'));
