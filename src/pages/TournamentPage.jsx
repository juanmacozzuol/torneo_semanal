import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTournament } from '../hooks/useTournament'
import { useMatchups } from '../hooks/useMatchups'
import MatchupCard from '../components/MatchupCard'
import BracketView from '../components/BracketView'
import ChampionBanner from '../components/ChampionBanner'

const ROUND_LABELS = {
  1: 'Ronda de 32',
  2: 'Ronda de 16',
  3: 'Cuartos de Final',
  4: 'Semifinal',
  5: 'Final',
}

const ROUND_DAYS = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
}

export default function TournamentPage() {
  const { tournament, loading } = useTournament()
  const [viewRound, setViewRound] = useState(null)
  const [tab, setTab] = useState('votar')

  const isFinished = tournament?.status === 'finished'
  const currentRound = tournament?.current_round ?? 1
  const round = viewRound ?? currentRound

  const { matchups, loading: loadingMatchups, refetch } = useMatchups(
    tournament?.id,
    isFinished ? null : round  // don't auto-fetch when finished
  )

  if (loading) return <div style={s.center}>Cargando torneo...</div>

  if (!tournament) return (
    <div className="page">
      <Header />
      <main className="site-main">
        <div style={s.empty}>
          <p style={{ color: '#555', fontSize: '1rem' }}>No hay ningún torneo activo esta semana.</p>
          <p style={{ color: '#444', fontSize: '0.85rem', marginTop: 8 }}>Volvé pronto.</p>
        </div>
      </main>
    </div>
  )

  // Torneo finalizado: mostrar campeón + bracket
  if (isFinished) {
    return (
      <div className="page">
        <Header />
        <main className="site-main">
          <ChampionBanner tournament={tournament} />
          <h3 style={{ fontSize: '0.85rem', color: '#555', marginBottom: '0.75rem', fontWeight: 600 }}>
            Bracket completo
          </h3>
          <BracketView tournamentId={tournament.id} currentRound={5} />
        </main>
      </div>
    )
  }

  const completedRounds = Array.from({ length: currentRound }, (_, i) => i + 1)

  return (
    <div className="page">
      <Header />
      <main className="site-main">
        <div style={s.tournamentHeader}>
          <div>
            <h2 style={s.category}>{tournament.category}</h2>
            {tournament.description && <p style={s.desc}>{tournament.description}</p>}
          </div>
          <div style={s.status}>
            <span style={s.statusBadge}>{ROUND_LABELS[currentRound]}</span>
            <span style={s.day}>{ROUND_DAYS[currentRound]}</span>
          </div>
        </div>

        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(tab === 'votar' ? s.tabActive : {}) }}
            onClick={() => setTab('votar')}
          >
            Votar hoy
          </button>
          <button
            style={{ ...s.tab, ...(tab === 'bracket' ? s.tabActive : {}) }}
            onClick={() => setTab('bracket')}
          >
            Bracket
          </button>
        </div>

        {tab === 'bracket' ? (
          <BracketView tournamentId={tournament.id} currentRound={currentRound} />
        ) : (
          <>
            <div style={s.roundNav}>
              {completedRounds.map(r => (
                <button
                  key={r}
                  style={{ ...s.roundBtn, ...(round === r ? s.roundBtnActive : {}) }}
                  onClick={() => setViewRound(r)}
                >
                  {r < currentRound ? `R${r} ✓` : ROUND_LABELS[r]}
                </button>
              ))}
            </div>

            {round !== currentRound && (
              <div style={s.pastBanner}>
                Resultados de {ROUND_LABELS[round]} — {ROUND_DAYS[round]}
              </div>
            )}

            {loadingMatchups ? (
              <div style={s.center}>Cargando partidos...</div>
            ) : (
              <div style={s.grid}>
                {matchups.map(m => (
                  <MatchupCard
                    key={m.id}
                    matchup={m}
                    category={tournament.category}
                    onVoted={refetch}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function Header() {
  return (
    <header className="site-header">
      <h1>Torneo Semanal</h1>
      <Link to="/historial" style={{ fontSize: '0.8rem', color: '#555', transition: 'color 0.15s' }}>
        Historial
      </Link>
    </header>
  )
}

const s = {
  center: { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' },
  tournamentHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap',
  },
  category: { fontSize: '1.4rem', fontWeight: 700, color: '#e8e8e8' },
  desc: { fontSize: '0.85rem', color: '#666', marginTop: 4 },
  status: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  statusBadge: {
    background: '#13131e', border: '1px solid #1e1e2e',
    borderRadius: 6, padding: '0.25rem 0.65rem',
    fontSize: '0.78rem', fontWeight: 600, color: '#4f6ef7',
  },
  day: { fontSize: '0.75rem', color: '#555' },
  tabs: { display: 'flex', gap: 6, marginBottom: '1rem' },
  tab: {
    padding: '0.35rem 0.9rem', background: 'none',
    border: '1px solid #1e1e2e', borderRadius: 6,
    color: '#555', fontSize: '0.82rem', cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
  tabActive: { borderColor: '#3b5bdb', color: '#4f6ef7', background: 'rgba(59,91,219,0.06)' },
  roundNav: { display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' },
  roundBtn: {
    padding: '0.3rem 0.75rem', background: 'none',
    border: '1px solid #1e1e2e', borderRadius: 6,
    color: '#666', fontSize: '0.78rem', cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
  roundBtnActive: { borderColor: '#3b5bdb', color: '#4f6ef7' },
  pastBanner: {
    background: '#13131e', border: '1px solid #1e1e2e',
    borderRadius: 6, padding: '0.5rem 0.75rem',
    fontSize: '0.8rem', color: '#666', marginBottom: '1rem',
  },
  grid: { display: 'flex', flexDirection: 'column', gap: 10 },
}
