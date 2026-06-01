-- Milestone 9: synchronized PvP combat state + arena lives on lobby players

alter table public.lobby_players
  add column if not exists lives int not null default 3,
  add column if not exists eliminated boolean not null default false;

alter table public.matches
  add column if not exists battle_state jsonb,
  add column if not exists state_version int not null default 0,
  add column if not exists winner_player_id uuid references public.lobby_players (id) on delete set null;

create index if not exists matches_state_version_idx on public.matches (state_version);
