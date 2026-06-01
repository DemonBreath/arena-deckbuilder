-- Milestone 18: persist player class selection on lobby_players
alter table public.lobby_players
  add column if not exists class_id text not null default 'guardian';
