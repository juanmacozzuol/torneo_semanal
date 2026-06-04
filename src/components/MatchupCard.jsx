import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useVoter } from '../hooks/useVoter'

export default function MatchupCard({ matchup, category, onVoted }) {
  const { voterId, saveLocalVote, hasVoted, getVoteFor } = useVoter()
  const [voting, setVoting] = useState(false)
  const [copied, setCopied] = useState(false)

  const a = matchup.competitor_a
  const b = matchup.competitor_b
  const alreadyVoted = hasVoted(matchup.id)
  const myVote = getVoteFor(matchup.id)
  const isFinished = !!matchup.winner_id
  const total = (matchup.votes_a || 0) + (matchup.votes_b || 0)

  const pctA = total > 0 ? Math.round((matchup.votes_a / total) * 100) : 50
  const pctB = total > 0 ? Math.round((matchup.votes_b / total) * 100) : 50

  async function vote(competitorId, side) {
    if (alreadyVoted || isFinished || voting) return
    setVoting(true)

    const voteField = side === 'a' ? 'votes_a' : 'votes_b'
    const newCount = (matchup[voteField] || 0) + 1

    const [{ error: voteErr }] = await Promise.all([
      supabase.from('votes').insert({ matchup_id: matchup.id, competitor_id: competitorId, voter_id: voterId }),
      supabase.from('matchups').update({ [voteField]: newCount }).eq('id', matchup.id),
    ])

    if (!voteErr) {
      saveLocalVote(matchup.id, competitorId)
      onVoted?.()
    }
    setVoting(false)
  }

  async function handleShare() {
    const votedFor = myVote === a?.id ? a?.name : b?.name
    const text = `Voté a ${votedFor} en el Torneo Semanal${category ? ` de ${category}` : ''}. ¿Y vos?`
    const url = window.location.href

    if (navigator.share) {
      navigator.share({ title: 'Torneo Semanal', text, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div>
      <div style={s.card}>
        <Competitor
          competitor={a}
          pct={pctA}
          isWinner={matchup.winner_id === a?.id}
          isLoser={isFinished && matchup.winner_id !== a?.id}
          myVote={myVote === a?.id}
          showPct={alreadyVoted || isFinished}
          disabled={alreadyVoted || isFinished || voting}
          onClick={() => vote(a.id, 'a')}
        />

        <div style={s.vs}>
          <span style={s.vsText}>VS</span>
          {total > 0 && (
            <span style={s.totalVotes}>{total.toLocaleString()}</span>
          )}
        </div>

        <Competitor
          competitor={b}
          pct={pctB}
          isWinner={matchup.winner_id === b?.id}
          isLoser={isFinished && matchup.winner_id !== b?.id}
          myVote={myVote === b?.id}
          showPct={alreadyVoted || isFinished}
          disabled={alreadyVoted || isFinished || voting}
          onClick={() => vote(b.id, 'b')}
        />
      </div>

      {alreadyVoted && (
        <div style={s.footer}>
          <button style={s.shareBtn} onClick={handleShare}>
            {copied ? '¡Copiado!' : '↗ Compartir'}
          </button>
        </div>
      )}
    </div>
  )
}

function Competitor({ competitor, pct, isWinner, isLoser, myVote, showPct, disabled, onClick }) {
  if (!competitor) return <div style={s.competitorEmpty}>TBD</div>

  return (
    <button
      style={{
        ...s.competitor,
        ...(isWinner ? s.winner : {}),
        ...(isLoser ? s.loser : {}),
        ...(myVote ? s.myVote : {}),
        ...(disabled ? s.disabled : {}),
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {competitor.image_url && (
        <img src={competitor.image_url} alt={competitor.name} style={s.img} />
      )}
      <span style={s.name}>{competitor.name}</span>
      {showPct && (
        <div style={s.barWrap}>
          <div style={{ ...s.bar, width: `${pct}%`, background: isWinner ? '#2f9e44' : '#3b5bdb' }} />
          <span style={s.pct}>{pct}%</span>
        </div>
      )}
      {myVote && <span style={s.votedBadge}>Tu voto</span>}
    </button>
  )
}

const s = {
  card: {
    background: '#13131e',
    border: '1px solid #1e1e2e',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'stretch',
    overflow: 'hidden',
    minHeight: 80,
  },
  competitor: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: '0.75rem',
    background: 'none', border: 'none', cursor: 'pointer',
    transition: 'background 0.15s', position: 'relative',
  },
  competitorEmpty: {
    flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#444', fontSize: '0.8rem',
  },
  winner: { background: 'rgba(47,158,68,0.08)' },
  loser: { opacity: 0.4 },
  myVote: { background: 'rgba(59,91,219,0.1)' },
  disabled: { cursor: 'default' },
  img: { width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' },
  name: { fontSize: '0.85rem', fontWeight: 600, color: '#e8e8e8', textAlign: 'center' },
  barWrap: { width: '100%', position: 'relative', height: 4, background: '#1e1e2e', borderRadius: 2 },
  bar: { position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2, transition: 'width 0.3s' },
  pct: { fontSize: '0.7rem', color: '#666', marginTop: 4, display: 'block', textAlign: 'center' },
  votedBadge: {
    fontSize: '0.65rem', color: '#4f6ef7', fontWeight: 600,
    position: 'absolute', top: 4, right: 6,
  },
  vs: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '0 0.5rem', gap: 4,
    borderLeft: '1px solid #1e1e2e', borderRight: '1px solid #1e1e2e',
    minWidth: 40,
  },
  vsText: { color: '#333', fontSize: '0.7rem', fontWeight: 700 },
  totalVotes: { color: '#444', fontSize: '0.62rem', whiteSpace: 'nowrap' },
  footer: {
    display: 'flex', justifyContent: 'flex-end',
    paddingTop: 4,
  },
  shareBtn: {
    background: 'none', border: 'none', color: '#555',
    fontSize: '0.75rem', cursor: 'pointer', padding: '0.2rem 0.4rem',
    transition: 'color 0.15s',
  },
}
