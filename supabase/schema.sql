-- ================================================
-- Torneo Semanal — Schema
-- Ejecutar en Supabase SQL Editor
-- ================================================

-- Torneos
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text,
  week_start date not null unique,
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'finished')),
  current_round int not null default 1 check (current_round between 1 and 5),
  created_at timestamptz default now()
);

-- Competidores (32 por torneo)
create table competitors (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null,
  image_url text,
  created_at timestamptz default now()
);

-- Cruces del bracket
create table matchups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round int not null check (round between 1 and 5),
  match_number int not null,
  competitor_a_id uuid references competitors(id),
  competitor_b_id uuid references competitors(id),
  winner_id uuid references competitors(id),
  votes_a int not null default 0,
  votes_b int not null default 0,
  created_at timestamptz default now(),
  unique(tournament_id, round, match_number)
);

-- Votos (un voto por usuario por partido)
create table votes (
  id uuid primary key default gen_random_uuid(),
  matchup_id uuid not null references matchups(id) on delete cascade,
  competitor_id uuid not null references competitors(id),
  voter_id text not null,
  created_at timestamptz default now(),
  unique(matchup_id, voter_id)
);

-- ================================================
-- Row Level Security
-- ================================================

alter table tournaments enable row level security;
alter table competitors enable row level security;
alter table matchups enable row level security;
alter table votes enable row level security;

-- Lectura pública para todos
create policy "public read tournaments" on tournaments for select using (true);
create policy "public read competitors" on competitors for select using (true);
create policy "public read matchups" on matchups for select using (true);
create policy "public read votes" on votes for select using (true);

-- Votar (anónimo)
create policy "insert vote" on votes for insert with check (true);

-- Actualizar contadores de votos (anónimo, solo votes_a/votes_b)
create policy "update vote counts" on matchups for update using (true) with check (true);

-- Admin: acceso total (autenticado)
create policy "admin all tournaments" on tournaments for all using (auth.role() = 'authenticated');
create policy "admin all competitors" on competitors for all using (auth.role() = 'authenticated');
create policy "admin all matchups" on matchups for all using (auth.role() = 'authenticated');

-- ================================================
-- Índices
-- ================================================

create index on matchups(tournament_id, round);
create index on votes(matchup_id, voter_id);
create index on competitors(tournament_id, seed);
