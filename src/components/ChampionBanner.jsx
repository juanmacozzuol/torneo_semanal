import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ChampionBanner({ tournament }) {
  const [champion, setChampion] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('matchups')
        .select('winner:competitors!matchups_winner_id_fkey(id, name, image_url)')
        .eq('tournament_id', tournament.id)
        .eq('round', 5)
        .maybeSingle()

      setChampion(data?.winner ?? null)
      setLoading(false)
    }
    fetch()
  }, [tournament.id])

  if (loading) return null

  return (
    <div style={s.wrap}>
      <p style={s.label}>Campeón de</p>
      <h2 style={s.category}>{tournament.category}</h2>

      <div style={s.champion}>
        {champion?.image_url && (
          <img src={champion.image_url} alt={champion.name} style={s.img} />
        )}
        <div style={s.crown}>🏆</div>
        <span style={s.name}>{champion?.name ?? '—'}</span>
      </div>

      <p style={s.week}>Semana del {formatDate(tournament.week_start)}</p>
    </div>
  )
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const s = {
  wrap: {
    background: 'linear-gradient(135deg, #13131e 0%, #1a1a2e 100%)',
    border: '1px solid #2a2a4e',
    borderRadius: 12,
    padding: '2rem',
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  label: { fontSize: '0.78rem', color: '#555', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 },
  category: { fontSize: '1.4rem', fontWeight: 700, color: '#e8e8e8', marginBottom: '1.5rem' },
  champion: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: '1rem', position: 'relative' },
  img: { width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #2f9e44' },
  crown: { fontSize: '1.8rem', lineHeight: 1 },
  name: { fontSize: '1.6rem', fontWeight: 800, color: '#2f9e44', letterSpacing: '-0.01em' },
  week: { fontSize: '0.78rem', color: '#444', marginTop: 4 },
}
