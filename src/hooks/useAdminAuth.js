import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAdminAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function sendOtp(email) {
    const { error } = await supabase.auth.signInWithOtp({ email })
    return error
  }

  async function verifyOtp(email, token) {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    return error
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return { user, loading, sendOtp, verifyOtp, logout }
}
