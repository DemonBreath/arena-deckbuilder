-- Milestone 14: reconnect / presence (optional — app works without this column)
alter table public.lobby_players
  add column if not exists last_seen_at timestamptz;
