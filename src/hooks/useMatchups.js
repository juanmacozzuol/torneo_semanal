import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useMatchups(tournamentId, round) {
  const [matchups, setMatchups] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMatchups = useCallback(async () => {
    if (!tournamentId || !round) return
    setLoading(true)
    const { data } = await supabase
      .from('matchups')
      .select(`
        *,
        competitor_a:competitors!matchups_competitor_a_id_fkey(*),
        competitor_b:competitors!matchups_competitor_b_id_fkey(*),
        winner:competitors!matchups_winner_id_fkey(*)
      `)
      .eq('tournament_id', tournamentId)
      .eq('round', round)
      .order('match_number')

    setMatchups(data || [])
    setLoading(false)
  }, [tournamentId, round])

  useEffect(() => { fetchMatchups() }, [fetchMatchups])

  return { matchups, loading, refetch: fetchMatchups }
}
