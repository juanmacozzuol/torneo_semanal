import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const { tournament_id } = await req.json().catch(() => ({}))

  // Si viene un tournament_id específico (llamada manual desde admin), usar ese.
  // Si no, buscar el torneo activo automáticamente.
  let tournament
  if (tournament_id) {
    const { data } = await supabase.from('tournaments').select('*').eq('id', tournament_id).single()
    tournament = data
  } else {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'active')
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle()
    tournament = data
  }

  if (!tournament) {
    return new Response(JSON.stringify({ error: 'No hay torneo activo' }), { status: 404 })
  }

  const currentRound = tournament.current_round

  // Obtener todos los partidos de la ronda actual
  const { data: matchups } = await supabase
    .from('matchups')
    .select('*')
    .eq('tournament_id', tournament.id)
    .eq('round', currentRound)

  if (!matchups || matchups.length === 0) {
    return new Response(JSON.stringify({ error: 'No hay partidos en la ronda actual' }), { status: 400 })
  }

  // Determinar ganadores de cada partido
  const winners: { matchupId: string; winnerId: string; matchNumber: number }[] = []

  for (const m of matchups) {
    if (m.winner_id) {
      // Ya tiene ganador (avance manual previo)
      winners.push({ matchupId: m.id, winnerId: m.winner_id, matchNumber: m.match_number })
      continue
    }

    let winnerId: string
    if (m.votes_a >= m.votes_b) {
      winnerId = m.competitor_a_id
    } else {
      winnerId = m.competitor_b_id
    }

    await supabase.from('matchups').update({ winner_id: winnerId }).eq('id', m.id)
    winners.push({ matchupId: m.id, winnerId, matchNumber: m.match_number })
  }

  // Si era la final (ronda 5), finalizar torneo
  if (currentRound === 5) {
    await supabase.from('tournaments').update({ status: 'finished' }).eq('id', tournament.id)
    return new Response(JSON.stringify({ message: 'Torneo finalizado' }), { status: 200 })
  }

  // Crear partidos de la siguiente ronda
  // Los ganadores se emparejan por match_number: winner(1) vs winner(2), winner(3) vs winner(4), etc.
  const nextRound = currentRound + 1
  const sorted = winners.sort((a, b) => a.matchNumber - b.matchNumber)
  const nextMatchups = []

  for (let i = 0; i < sorted.length; i += 2) {
    nextMatchups.push({
      tournament_id: tournament.id,
      round: nextRound,
      match_number: Math.floor(i / 2) + 1,
      competitor_a_id: sorted[i].winnerId,
      competitor_b_id: sorted[i + 1].winnerId,
    })
  }

  const { error } = await supabase.from('matchups').insert(nextMatchups)
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // Avanzar ronda en el torneo
  await supabase.from('tournaments').update({ current_round: nextRound }).eq('id', tournament.id)

  return new Response(
    JSON.stringify({ message: `Ronda ${nextRound} generada con ${nextMatchups.length} partidos` }),
    { status: 200 }
  )
})
