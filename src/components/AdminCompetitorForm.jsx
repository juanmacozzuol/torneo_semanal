import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function AdminCompetitorForm({ tournament, onBack }) {
  const [competitors, setCompetitors] = useState([])
  const [form, setForm] = useState({ name: '', image_url: '' })
  const [batch, setBatch] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { fetchCompetitors() }, [tournament.id])

  async function fetchCompetitors() {
    const { data } = await supabase
      .from('competitors')
      .select('*')
      .eq('tournament_id', tournament.id)
      .order('created_at')
    setCompetitors(data || [])
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (competitors.length >= 32) return setErr('Ya hay 32 competidores.')
    setBusy(true)
    setErr('')
    const { error } = await supabase.from('competitors').insert({
      tournament_id: tournament.id,
      name: form.name.trim(),
      image_url: form.image_url.trim() || null,
    })
    if (error) setErr(error.message)
    else { setForm({ name: '', image_url: '' }); fetchCompetitors() }
    setBusy(false)
  }

  async function handleBatch() {
    const names = batch.split('\n').map(n => n.trim()).filter(Boolean)
    if (!names.length) return
    const available = 32 - competitors.length
    if (names.length > available) return setErr(`Solo podés agregar ${available} más.`)
    setBusy(true)
    setErr('')
    const rows = names.map(name => ({ tournament_id: tournament.id, name }))
    const { error } = await supabase.from('competitors').insert(rows)
    if (error) setErr(error.message)
    else { setBatch(''); fetchCompetitors() }
    setBusy(false)
  }

  async function handleDelete(id) {
    await supabase.from('competitors').delete().eq('id', id)
    fetchCompetitors()
  }

  async function generateBracket() {
    if (competitors.length !== 32) return alert('Necesitás exactamente 32 competidores.')
    if (!confirm('¿Generar el bracket de la ronda 1? Los cruces serán aleatorios.')) return

    const shuffled = shuffle(competitors)
    const matchups = []
    for (let i = 0; i < 16; i++) {
      matchups.push({
        tournament_id: tournament.id,
        round: 1,
        match_number: i + 1,
        competitor_a_id: shuffled[i * 2].id,
        competitor_b_id: shuffled[i * 2 + 1].id,
      })
    }

    const { error } = await supabase.from('matchups').insert(matchups)
    if (error) alert('Error: ' + error.message)
    else alert('Bracket generado. Ya podés activar el torneo.')
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <button className="btn-secondary" onClick={onBack}>← Volver</button>
        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
          {tournament.category} — Competidores ({competitors.length}/32)
        </h2>
      </div>

      <div style={s.panels}>
        {/* Individual */}
        <div style={s.panel}>
          <p style={s.panelTitle}>Agregar uno</p>
          <form onSubmit={handleAdd} style={s.form}>
            <input className="input" placeholder="Nombre *" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <input className="input" placeholder="URL de imagen (opcional)" value={form.image_url}
              onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
            <button className="btn-primary" type="submit" disabled={busy || competitors.length >= 32}>
              {busy ? '...' : 'Agregar'}
            </button>
          </form>
        </div>

        {/* Batch */}
        <div style={s.panel}>
          <p style={s.panelTitle}>Carga en batch — un nombre por línea</p>
          <textarea
            className="input"
            placeholder={"Messi\nRonaldo\nMbappé\n..."}
            value={batch}
            onChange={e => setBatch(e.target.value)}
            rows={5}
            style={{ resize: 'vertical' }}
          />
          <button className="btn-primary" onClick={handleBatch} disabled={busy || !batch.trim() || competitors.length >= 32}>
            {busy ? '...' : `Agregar ${batch.split('\n').filter(l => l.trim()).length || ''} nombres`}
          </button>
        </div>
      </div>

      {err && <p style={{ color: '#e03131', fontSize: '0.82rem', margin: '0.5rem 0' }}>{err}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: '1rem' }}>
        {competitors.map((c, i) => (
          <div key={c.id} style={s.row}>
            <span style={s.num}>{i + 1}</span>
            {c.image_url && <img src={c.image_url} alt={c.name} style={s.img} />}
            <span style={{ flex: 1 }}>{c.name}</span>
            <button className="btn-danger" onClick={() => handleDelete(c.id)}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}>✕</button>
          </div>
        ))}
      </div>

      {competitors.length === 32 && (
        <button className="btn-primary" onClick={generateBracket} style={{ marginTop: '1.25rem' }}>
          Generar bracket aleatorio (ronda 1)
        </button>
      )}
    </div>
  )
}

const s = {
  panels: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' },
  panel: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 260 },
  panelTitle: { fontSize: '0.78rem', color: '#666', fontWeight: 600 },
  form: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  row: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#13131e', border: '1px solid #1e1e2e',
    borderRadius: 6, padding: '0.4rem 0.75rem',
  },
  num: { fontSize: '0.75rem', color: '#555', minWidth: 20 },
  img: { width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' },
}
