-- Milestone 25: Scouting and Intelligence — persist evolution + career stats per lobby player

alter table public.lobby_players
  add column if not exists evolution_id text,
  add column if not exists scouting_stats jsonb not null default '{
    "matchesWon": 0,
    "damageDealt": 0,
    "damageTaken": 0,
    "cardsPlayed": 0,
    "cardPlayCounts": {}
  }'::jsonb;
