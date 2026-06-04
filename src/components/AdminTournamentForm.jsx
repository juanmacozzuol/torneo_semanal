import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminTournamentForm({ onSaved, onCancel }) {
  const [form, setForm] = useState({ category: '', description: '', week_start: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const { error } = await supabase.from('tournaments').insert({
      category: form.category.trim(),
      description: form.description.trim() || null,
      week_start: form.week_start,
      status: 'scheduled',
      current_round: 1,
    })
    if (error) setErr(error.message)
    else onSaved()
    setBusy(false)
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h2 style={s.title}>Nuevo torneo</h2>
      <form onSubmit={handleSubmit} style={s.form}>
        <label style={s.label}>Categoría *</label>
        <input className="input" placeholder="Ej: Mejores presidentes argentinos" value={form.category} onChange={set('category')} required />

        <label style={s.label}>Descripción (opcional)</label>
        <input className="input" placeholder="Subtítulo o contexto" value={form.description} onChange={set('description')} />

        <label style={s.label}>Lunes de inicio *</label>
        <input className="input" type="date" value={form.week_start} onChange={set('week_start')} required />

        {err && <p style={s.err}>{err}</p>}

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Guardando...' : 'Crear torneo'}
          </button>
          <button className="btn-secondary" type="button" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}

const s = {
  title: { fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  label: { fontSize: '0.8rem', color: '#888', marginBottom: -4 },
  err: { color: '#e03131', fontSize: '0.82rem' },
}
