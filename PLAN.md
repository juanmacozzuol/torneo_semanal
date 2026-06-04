# Torneo Semanal — Plan de Implementación

## Concepto
App de torneo de votación semanal. Cada semana una categoría diferente, 32 competidores,
bracket estilo eliminación directa de lunes a viernes. Votación anónima con UUID en localStorage.

## Rondas
| Día       | Ronda | Partidos |
|-----------|-------|----------|
| Lunes     | 1     | 16       |
| Martes    | 2     | 8        |
| Miércoles | 3 (QF)| 4       |
| Jueves    | 4 (SF)| 2       |
| Viernes   | 5 (F) | 1       |

## Stack
- Frontend: React + Vite (mismo)
- Hosting: Cloudflare Pages (mismo)
- DB/Backend: Supabase (mismo, nueva schema)
- Auth: Supabase Auth solo para admin
- Usuarios: UUID en localStorage, sin login

---

## Fase 1 — Limpieza [ ]
- [ ] Borrar todos los componentes viejos (AuthModal, PoliticianCard, MapSection, etc.)
- [ ] Borrar todos los hooks viejos (useAuth, useVotes, useNews, etc.)
- [ ] Borrar data/ (categories, politicians, provinces)
- [ ] Desinstalar: react-simple-maps, recharts
- [ ] Renombrar proyecto en package.json a "torneo-semanal"
- [ ] Limpiar App.jsx e index.css

## Fase 2 — DB Schema en Supabase [ ]
Ejecutar en SQL Editor de Supabase:

```sql
-- Torneos
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text,
  week_start date not null unique,
  status text not null default 'scheduled', -- scheduled | active | finished
  current_round int not null default 1,
  created_at timestamptz default now()
);

-- Competidores (32 por torneo)
create table competitors (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  name text not null,
  image_url text,
  seed int not null check (seed between 1 and 32),
  created_at timestamptz default now()
);

-- Cruces del bracket
create table matchups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  round int not null check (round between 1 and 5),
  match_number int not null,
  competitor_a_id uuid references competitors(id),
  competitor_b_id uuid references competitors(id),
  winner_id uuid references competitors(id),
  votes_a int default 0,
  votes_b int default 0,
  created_at timestamptz default now()
);

-- Votos (un voto por usuario por partido)
create table votes (
  id uuid primary key default gen_random_uuid(),
  matchup_id uuid references matchups(id) on delete cascade,
  competitor_id uuid references competitors(id),
  voter_id text not null,
  created_at timestamptz default now(),
  unique(matchup_id, voter_id)
);

-- RLS
alter table tournaments enable row level security;
alter table competitors enable row level security;
alter table matchups enable row level security;
alter table votes enable row level security;

-- Lectura pública
create policy "public read tournaments" on tournaments for select using (true);
create policy "public read competitors" on competitors for select using (true);
create policy "public read matchups" on matchups for select using (true);
create policy "public read votes" on votes for select using (true);

-- Insertar votos (anónimo)
create policy "insert vote" on votes for insert with check (true);
```

## Fase 3 — Estructura de archivos [ ]
```
src/
  lib/supabase.js          (ya existe, mantener)
  hooks/
    useTournament.js       (torneo activo)
    useMatchups.js         (partidos de la ronda actual)
    useVoter.js            (UUID en localStorage)
    useAdminAuth.js        (auth admin)
  pages/
    TournamentPage.jsx     (página pública principal)
    AdminPage.jsx          (panel admin)
  components/
    Bracket.jsx            (grilla visual del torneo)
    MatchupCard.jsx        (un partido individual con botones de voto)
    RoundNav.jsx           (navegación entre rondas — ver rondas pasadas)
    AdminLogin.jsx         (formulario login admin)
    AdminTournamentForm.jsx (crear/editar torneo)
    AdminCompetitorList.jsx (cargar los 32 competidores)
  App.jsx
  index.css
  main.jsx
```

## Fase 4 — Lógica de votación [ ]
- Al votar: INSERT en `votes`, UPDATE en `matchups` (votes_a/votes_b con trigger o en cliente)
- LocalStorage guarda: `{ voter_id: uuid, voted: { [matchup_id]: competitor_id } }`
- UI bloquea botón si ya votó ese partido (check localStorage primero, DB como respaldo)

## Fase 5 — Avance automático de ronda [ ]
Edge Function `advance-round`:
1. Busca torneo `active` con `current_round` cuya fecha corresponde al día anterior
2. Marca winners en matchups (el que tenga más votes_a/votes_b)
3. Crea matchups de la siguiente ronda (ganadores se emparejan por match_number)
4. Incrementa `current_round` en el torneo
5. Si era ronda 5, cambia status a `finished`

pg_cron: `SELECT cron.schedule('advance-round', '0 3 * * *', 'SELECT net.http_post(...)')` (3am Argentina)

## Fase 6 — Panel Admin [ ]
Rutas: `/admin/login`, `/admin`
Funciones:
- [ ] Ver todos los torneos (scheduled, active, finished)
- [ ] Crear torneo (categoría, descripción, fecha de inicio)
- [ ] Cargar 32 competidores (nombre + imagen URL + seed)
- [ ] Activar torneo manualmente (por si el cron falla)
- [ ] Ver bracket en tiempo real con conteo de votos

## Fase 7 — Deploy [ ]
- [ ] Variables de entorno en Cloudflare Pages (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Verificar que react-router-dom funcione en Cloudflare (SPA routing)

---

## Estado actual
- [ ] Fase 1 — Limpieza
- [ ] Fase 2 — DB Schema
- [ ] Fase 3+4 — Frontend base
- [ ] Fase 5 — Cron
- [ ] Fase 6 — Admin
- [ ] Fase 7 — Deploy
