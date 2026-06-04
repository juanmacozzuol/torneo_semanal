import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

export default function AdminLogin() {
  const { user, loading, sendOtp, verifyOtp } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [step, setStep] = useState('email') // email | otp
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate('/admin')
  }, [user, loading, navigate])

  async function handleEmail(e) {
    e.preventDefault()
    if (email.toLowerCase() !== import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase()) {
      setErr('Email no autorizado.')
      return
    }
    setBusy(true)
    setErr('')
    const error = await sendOtp(email)
    if (error) setErr(error.message)
    else setStep('otp')
    setBusy(false)
  }

  async function handleOtp(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const error = await verifyOtp(email, token)
    if (error) setErr(error.message)
    else navigate('/admin')
    setBusy(false)
  }

  if (loading) return null

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Admin</h1>

        {step === 'email' ? (
          <form onSubmit={handleEmail} style={s.form}>
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtp} style={s.form}>
            <p style={s.hint}>Código enviado a {email}</p>
            <input
              className="input"
              type="text"
              placeholder="Código de 6 dígitos"
              value={token}
              onChange={e => setToken(e.target.value)}
              maxLength={6}
              inputMode="numeric"
              required
              autoFocus
            />
            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? 'Verificando...' : 'Entrar'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setStep('email')}>
              Volver
            </button>
          </form>
        )}

        {err && <p style={s.err}>{err}</p>}
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: '#0d0d14',
  },
  card: {
    background: '#13131e', border: '1px solid #1e1e2e',
    borderRadius: 10, padding: '2rem', width: '100%', maxWidth: 360,
  },
  title: { fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#e8e8e8' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  hint: { fontSize: '0.82rem', color: '#666' },
  err: { marginTop: '0.75rem', color: '#e03131', fontSize: '0.82rem' },
}
