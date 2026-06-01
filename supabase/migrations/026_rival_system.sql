-- Milestone 26: Rival System — per-opponent head-to-head history for the lobby run

alter table public.lobby_players
  add column if not exists rival_history jsonb not null default '{}'::jsonb;
