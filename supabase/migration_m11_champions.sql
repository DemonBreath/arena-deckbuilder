-- Milestone 11: public Daily Champions leaderboard (no login)

create table if not exists public.daily_champions (
  id uuid primary key default gen_random_uuid(),
  champion_name text not null,
  lobby_code text not null,
  date date not null,
  opponents_defeated int not null default 0,
  final_deck_size int not null default 0,
  relic_count int not null default 0,
  total_gold_earned int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists daily_champions_date_idx on public.daily_champions (date);
create index if not exists daily_champions_created_at_idx on public.daily_champions (created_at desc);

alter table public.daily_champions enable row level security;

create policy "daily_champions_select_anon"
  on public.daily_champions for select
  to anon, authenticated
  using (true);

create policy "daily_champions_insert_anon"
  on public.daily_champions for insert
  to anon, authenticated
  with check (true);
