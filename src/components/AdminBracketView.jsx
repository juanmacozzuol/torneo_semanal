import { useState } from 'react'
import { useMatchups } from '../hooks/useMatchups'

const ROUND_LABELS = {
  1: 'Ronda de 32',
  2: 'Ronda de 16',
  3: 'Cuartos de Final',
  4: 'Semifinal',
  5: 'Final',
}

export default function AdminBracketView({ tournament, onBack, onAdvance }) {
  const [round, setRound] = useState(tournament.current_round)
  const { matchups, loading } = useMatchups(tournament.id, round)

  const maxRound = tournament.current_round

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={onBack}>← Volver</button>
        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{tournament.category}</h2>
        {tournament.status === 'active' && tournament.current_round < 5 && (
          <button className="btn-primary" onClick={onAdvance}>Avanzar ronda manualmente</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {Array.from({ length: maxRound }, (_, i) => i + 1).map(r => (
          <button
            key={r}
            style={{
              padding: '0.3rem 0.75rem', borderRadius: 6, fontSize: '0.78rem',
              border: '1px solid', cursor: 'pointer',
              borderColor: round === r ? '#3b5bdb' : '#1e1e2e',
              color: round === r ? '#4f6ef7' : '#666',
              background: 'none',
            }}
            onClick={() => setRound(r)}
          >
            {ROUND_LABELS[r]}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#555' }}>Cargando...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {matchups.map(m => (
            <MatchupRow key={m.id} matchup={m} />
          ))}
        </div>
      )}
    </div>
  )
}

function MatchupRow({ matchup }) {
  const a = matchup.competitor_a
  const b = matchup.competitor_b
  const total = (matchup.votes_a || 0) + (matchup.votes_b || 0)
  const pctA = total > 0 ? Math.round((matchup.votes_a / total) * 100) : 50
  const pctB = 100 - pctA

  return (
    <div style={s.row}>
      <span style={s.matchNum}>#{matchup.match_number}</span>
      <div style={{ flex: 1 }}>
        <CompRow name={a?.name} votes={matchup.votes_a} pct={pctA} isWinner={matchup.winner_id === a?.id} />
        <CompRow name={b?.name} votes={matchup.votes_b} pct={pctB} isWinner={matchup.winner_id === b?.id} />
      </div>
      <span style={{ fontSize: '0.75rem', color: '#444', minWidth: 60, textAlign: 'right' }}>
        {total} votos
      </span>
    </div>
  )
}

function CompRow({ name, votes, pct, isWinner }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.2rem 0' }}>
      <span style={{ ...s.name, color: isWinner ? '#2f9e44' : '#e8e8e8' }}>
        {isWinner ? '✓ ' : ''}{name || 'TBD'}
      </span>
      <div style={s.barWrap}>
        <div style={{ ...s.bar, width: `${pct}%`, background: isWinner ? '#2f9e44' : '#3b5bdb' }} />
      </div>
      <span style={s.pct}>{pct}% ({votes || 0})</span>
    </div>
  )
}

const s = {
  row: {
    background: '#13131e', border: '1px solid #1e1e2e',
    borderRadius: 6, padding: '0.6rem 0.75rem',
    display: 'flex', alignItems: 'center', gap: '0.75rem',
  },
  matchNum: { fontSize: '0.72rem', color: '#444', minWidth: 24 },
  name: { fontSize: '0.82rem', fontWeight: 600, minWidth: 140 },
  barWrap: { flex: 1, height: 4, background: '#1e1e2e', borderRadius: 2, position: 'relative', overflow: 'hidden' },
  bar: { position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2 },
  pct: { fontSize: '0.72rem', color: '#555', minWidth: 70, textAlign: 'right' },
}
