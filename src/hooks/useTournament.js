import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useTournament() {
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetch() {
      setLoading(true)

      // Prefer active tournament; fall back to most recent finished
      const { data: active, error: err } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'active')
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (err) { setError(err.message); setLoading(false); return }

      if (active) { setTournament(active); setLoading(false); return }

      const { data: finished } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'finished')
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle()

      setTournament(finished)
      setLoading(false)
    }
    fetch()
  }, [])

  return { tournament, loading, error }
}
