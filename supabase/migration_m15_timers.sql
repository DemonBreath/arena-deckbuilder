-- Milestone 15: PvP turn timers (server timestamps on matches)
alter table public.matches
  add column if not exists turn_start_at timestamptz;

alter table public.matches
  add column if not exists battle_started_at timestamptz;
