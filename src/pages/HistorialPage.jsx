import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BracketView from '../components/BracketView'

export default function HistorialPage() {
  const [tournaments, setTournaments] = useState([])
  const [champions, setChampions] = useState({}) // tournament_id → winner
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const [{ data: ts }, { data: finals }] = await Promise.all([
        supabase.from('tournaments').select('*').eq('status', 'finished').order('week_start', { ascending: false }),
        supabase.from('matchups')
          .select('tournament_id, winner:competitors!matchups_winner_id_fkey(name, image_url)')
          .eq('round', 5)
          .not('winner_id', 'is', null),
      ])

      const champMap = {}
      for (const f of finals || []) champMap[f.tournament_id] = f.winner

      setTournaments(ts || [])
      setChampions(champMap)
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <div className="page">
      <header className="site-header">
        <h1>Torneo Semanal</h1>
        <Link to="/" style={{ fontSize: '0.82rem', color: '#555' }}>← Torneo actual</Link>
      </header>

      <main className="site-main">
        <h2 style={s.title}>Historial</h2>

        {loading && <p style={{ color: '#555' }}>Cargando...</p>}

        {!loading && tournaments.length === 0 && (
          <p style={{ color: '#555' }}>Todavía no hay torneos finalizados.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tournaments.map(t => {
            const champ = champions[t.id]
            const isOpen = expanded === t.id

            return (
              <div key={t.id} style={s.card}>
                <div style={s.cardHeader}>
                  <div style={s.info}>
                    <span style={s.category}>{t.category}</span>
                    <span style={s.week}>{formatDate(t.week_start)}</span>
                  </div>

                  {champ && (
                    <div style={s.champRow}>
                      {champ.image_url && <img src={champ.image_url} alt={champ.name} style={s.champImg} />}
                      <span style={s.champName}>🏆 {champ.name}</span>
                    </div>
                  )}

                  <button
                    style={s.toggleBtn}
                    onClick={() => setExpanded(isOpen ? null : t.id)}
                  >
                    {isOpen ? 'Cerrar bracket ↑' : 'Ver bracket ↓'}
                  </button>
                </div>

                {isOpen && (
                  <div style={s.bracketWrap}>
                    <BracketView tournamentId={t.id} currentRound={5} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const s = {
  title: { fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' },
  card: {
    background: '#13131e', border: '1px solid #1e1e2e',
    borderRadius: 8, overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    padding: '0.85rem 1rem', flexWrap: 'wrap',
  },
  info: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  category: { fontWeight: 600, fontSize: '0.95rem' },
  week: { fontSize: '0.75rem', color: '#555' },
  champRow: { display: 'flex', alignItems: 'center', gap: 6 },
  champImg: { width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' },
  champName: { fontSize: '0.82rem', fontWeight: 600, color: '#2f9e44' },
  toggleBtn: {
    background: 'none', border: '1px solid #1e1e2e', borderRadius: 6,
    color: '#555', fontSize: '0.75rem', cursor: 'pointer',
    padding: '0.3rem 0.7rem', whiteSpace: 'nowrap',
    transition: 'color 0.15s, border-color 0.15s',
  },
  bracketWrap: { borderTop: '1px solid #1e1e2e', padding: '1rem', overflowX: 'auto' },
}
