import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SLOT_H = 60    // height allocated per round-1 slot
const CARD_H = 48    // actual match card height
const COL_W = 150    // round column width
const CONN_W = 28    // connector width between columns
const LABEL_H = 28   // space for round labels
const TOTAL_H = 16 * SLOT_H  // 960px

const ROUND_LABELS = { 1: 'R32', 2: 'R16', 3: 'QF', 4: 'SF', 5: 'Final' }

function slotH(round) { return SLOT_H * Math.pow(2, round - 1) }
function matchTop(round, matchNum) { return (matchNum - 1) * slotH(round) + (slotH(round) - CARD_H) / 2 }
function matchCenterY(round, matchNum) { return matchTop(round, matchNum) + CARD_H / 2 }
function colLeft(round) { return (round - 1) * (COL_W + CONN_W) }

export default function BracketView({ tournamentId, currentRound }) {
  const [allMatchups, setAllMatchups] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tournamentId) return
    fetchAll()
  }, [tournamentId])

  async function fetchAll() {
    const { data } = await supabase
      .from('matchups')
      .select(`
        *,
        competitor_a:competitors!matchups_competitor_a_id_fkey(id, name),
        competitor_b:competitors!matchups_competitor_b_id_fkey(id, name)
      `)
      .eq('tournament_id', tournamentId)
      .order('round')
      .order('match_number')

    const grouped = {}
    for (const m of data || []) {
      if (!grouped[m.round]) grouped[m.round] = []
      grouped[m.round].push(m)
    }
    setAllMatchups(grouped)
    setLoading(false)
  }

  if (loading) return <div style={{ color: '#555', padding: '2rem' }}>Cargando bracket...</div>

  const totalW = 5 * COL_W + 4 * CONN_W

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
      <div style={{ position: 'relative', width: totalW, height: TOTAL_H + LABEL_H }}>

        {/* Round labels */}
        {[1,2,3,4,5].map(round => (
          <div key={round} style={{
            position: 'absolute',
            top: 0,
            left: colLeft(round),
            width: COL_W,
            textAlign: 'center',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: round === currentRound ? '#4f6ef7' : '#444',
            letterSpacing: '0.05em',
            paddingTop: 6,
          }}>
            {ROUND_LABELS[round]}
          </div>
        ))}

        {/* SVG connecting lines */}
        <svg style={{
          position: 'absolute',
          top: LABEL_H,
          left: 0,
          width: totalW,
          height: TOTAL_H,
          pointerEvents: 'none',
        }}>
          {[1,2,3,4].flatMap(round => {
            const matches = allMatchups[round] || []
            return matches
              .filter((_, i) => i % 2 === 0)
              .map((m, pairIdx) => {
                const m2 = matches[pairIdx * 2 + 1]
                if (!m2) return null

                const x1 = colLeft(round) + COL_W
                const x2 = colLeft(round + 1)
                const connX = x1 + (x2 - x1) / 2

                const y1 = matchCenterY(round, m.match_number)
                const y2 = matchCenterY(round, m2.match_number)
                const midY = (y1 + y2) / 2

                return (
                  <g key={`${round}-${m.match_number}`}>
                    <polyline
                      points={`${x1},${y1} ${connX},${y1} ${connX},${midY}`}
                      fill="none" stroke="#252538" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                    />
                    <polyline
                      points={`${x1},${y2} ${connX},${y2} ${connX},${midY}`}
                      fill="none" stroke="#252538" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                    />
                    <line
                      x1={connX} y1={midY} x2={x2} y2={midY}
                      stroke="#252538" strokeWidth={1.5} strokeLinecap="round"
                    />
                  </g>
                )
              })
          })}
        </svg>

        {/* Match cards */}
        {[1,2,3,4,5].map(round => {
          const matches = allMatchups[round] || []
          const expected = 16 / Math.pow(2, round - 1)

          return (
            <div key={round}>
              {matches.map(m => (
                <MatchCard key={m.id} matchup={m} round={round} isActive={round === currentRound} />
              ))}
              {/* Placeholder slots for rounds not yet played */}
              {Array.from({ length: expected - matches.length }).map((_, i) => (
                <div key={`ph-${round}-${i}`} style={{
                  position: 'absolute',
                  top: LABEL_H + matchTop(round, matches.length + i + 1),
                  left: colLeft(round) + 2,
                  width: COL_W - 4,
                  height: CARD_H,
                  background: '#0a0a10',
                  border: '1px dashed #181828',
                  borderRadius: 4,
                }} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MatchCard({ matchup, round, isActive }) {
  const a = matchup.competitor_a
  const b = matchup.competitor_b
  const total = (matchup.votes_a || 0) + (matchup.votes_b || 0)
  const pctA = total > 0 ? Math.round(matchup.votes_a / total * 100) : null
  const pctB = total > 0 ? 100 - pctA : null

  return (
    <div style={{
      position: 'absolute',
      top: LABEL_H + matchTop(round, matchup.match_number),
      left: colLeft(round) + 2,
      width: COL_W - 4,
      height: CARD_H,
      background: isActive ? '#14142a' : '#13131e',
      border: `1px solid ${isActive ? '#2a2a50' : '#1e1e2e'}`,
      borderRadius: 4,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Slot name={a?.name} isWinner={matchup.winner_id === a?.id} pct={pctA} />
      <div style={{ height: 1, background: '#1e1e2e', flexShrink: 0 }} />
      <Slot name={b?.name} isWinner={matchup.winner_id === b?.id} pct={pctB} />
    </div>
  )
}

function Slot({ name, isWinner, pct }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      padding: '0 5px',
      gap: 3,
      minHeight: 0,
      background: isWinner ? 'rgba(47,158,68,0.12)' : 'transparent',
    }}>
      <span style={{
        fontSize: '0.67rem',
        fontWeight: isWinner ? 700 : 400,
        color: isWinner ? '#2f9e44' : (name ? '#ccc' : '#2a2a3e'),
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {name || 'TBD'}
      </span>
      {pct !== null && (
        <span style={{ fontSize: '0.6rem', color: '#555', flexShrink: 0 }}>{pct}%</span>
      )}
    </div>
  )
}
