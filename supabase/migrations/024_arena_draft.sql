-- Milestone 24: Arena Draft System

alter table public.lobbies
  add column if not exists active_draft_ids jsonb not null default '[]'::jsonb,
  add column if not exists draft_history jsonb not null default '[]'::jsonb,
  add column if not exists draft_session jsonb,
  add column if not exists last_draft_result jsonb;

alter table public.lobbies
  drop constraint if exists lobbies_status_check;

alter table public.lobbies
  add constraint lobbies_status_check
  check (status in ('waiting', 'starting', 'in_match', 'shop', 'arena_draft', 'finished'));
