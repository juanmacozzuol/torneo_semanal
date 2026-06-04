import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { supabase } from '../lib/supabase'
import AdminTournamentForm from '../components/AdminTournamentForm'
import AdminCompetitorForm from '../components/AdminCompetitorForm'
import AdminBracketView from '../components/AdminBracketView'

export default function AdminPage() {
  const { user, loading, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState([])
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('list') // list | new | competitors | bracket

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/admin/login'); return }
    if (user.email?.toLowerCase() !== import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase()) {
      logout()
      navigate('/admin/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) fetchTournaments()
  }, [user])

  async function fetchTournaments() {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .order('week_start', { ascending: false })
    setTournaments(data || [])
  }

  async function activateTournament(id) {
    await supabase.from('tournaments').update({ status: 'active' }).eq('id', id)
    await fetchTournaments()
  }

  async function deleteTournament(id) {
    if (!confirm('¿Eliminar este torneo y todos sus datos?')) return
    await supabase.from('tournaments').delete().eq('id', id)
    await fetchTournaments()
  }

  async function advanceRound(tournament) {
    if (!confirm(`¿Avanzar a la ronda ${tournament.current_round + 1}?`)) return
    const { error } = await supabase.functions.invoke('advance-round', {
      body: { tournament_id: tournament.id },
    })
    if (error) alert('Error: ' + error.message)
    else await fetchTournaments()
  }

  if (loading || !user) return null

  const STATUS_LABEL = { scheduled: 'Programado', active: 'Activo', finished: 'Finalizado' }
  const STATUS_COLOR = { scheduled: '#555', active: '#2f9e44', finished: '#3b5bdb' }

  return (
    <div className="page">
      <header className="site-header">
        <h1>Admin — Torneo Semanal</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => { setView('list'); setSelected(null) }}>Torneos</button>
          <button className="btn-secondary" onClick={() => setView('new')}>+ Nuevo</button>
          <button className="btn-secondary" onClick={logout}>Salir</button>
        </div>
      </header>

      <main className="site-main">
        {view === 'new' && (
          <AdminTournamentForm
            onSaved={() => { fetchTournaments(); setView('list') }}
            onCancel={() => setView('list')}
          />
        )}

        {view === 'competitors' && selected && (
          <AdminCompetitorForm
            tournament={selected}
            onBack={() => setView('list')}
          />
        )}

        {view === 'bracket' && selected && (
          <AdminBracketView
            tournament={selected}
            onBack={() => setView('list')}
            onAdvance={() => advanceRound(selected)}
          />
        )}

        {view === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tournaments.length === 0 && (
              <p style={{ color: '#555' }}>No hay torneos. Creá uno con "+ Nuevo".</p>
            )}
            {tournaments.map(t => (
              <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{t.category}</div>
                  <div style={{ fontSize: '0.78rem', color: '#555', marginTop: 2 }}>
                    Inicio: {t.week_start} &nbsp;·&nbsp;
                    <span style={{ color: STATUS_COLOR[t.status] }}>{STATUS_LABEL[t.status]}</span>
                    {t.status === 'active' && ` · Ronda ${t.current_round}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => { setSelected(t); setView('competitors') }}
                  >
                    Competidores
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => { setSelected(t); setView('bracket') }}
                  >
                    Bracket
                  </button>
                  {t.status === 'scheduled' && (
                    <button className="btn-primary" onClick={() => activateTournament(t.id)}>
                      Activar
                    </button>
                  )}
                  {t.status === 'active' && t.current_round < 5 && (
                    <button className="btn-secondary" onClick={() => { setSelected(t); advanceRound(t) }}>
                      Avanzar ronda
                    </button>
                  )}
                  <button className="btn-danger" onClick={() => deleteTournament(t.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
