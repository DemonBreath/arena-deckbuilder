-- Milestone 23: Sudden Death Arena + Final Duel (best-of-3)

alter table public.lobbies
  add column if not exists final_duel_player_1_id uuid references public.lobby_players (id) on delete set null,
  add column if not exists final_duel_player_2_id uuid references public.lobby_players (id) on delete set null,
  add column if not exists final_duel_p1_wins int not null default 0,
  add column if not exists final_duel_p2_wins int not null default 0;

alter table public.matches
  add column if not exists arena_phase text not null default 'normal'
    check (arena_phase in ('normal', 'sudden_death_1', 'sudden_death_2', 'final_duel')),
  add column if not exists final_duel_game int;
