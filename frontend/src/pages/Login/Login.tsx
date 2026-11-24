import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import ThemeToggle from '../../components/ThemeToggle'
import './Login.css'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={user.role === 'Admin' ? '/dashboard' : '/sales'} replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const loggedInUser = await login(email, password)
      navigate(loggedInUser.role === 'Admin' ? '/dashboard' : '/sales', { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to log in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <ThemeToggle className="login-theme-toggle" />
      <section className="login-card" aria-labelledby="login-title">
        <Link className="login-logo" to="/" aria-label="Sudo home">sudo<span>.</span></Link>
        <p className="login-eyebrow">ACCOUNT ACCESS</p>
        <h1 id="login-title">Log in</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="login-password">Password</label>
          <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <p className="login-error" role="alert">{error ?? ''}</p>
          <button type="submit" disabled={submitting}>{submitting ? 'Logging in…' : 'Log in'}</button>
        </form>
        <p className="login-demo"><strong>Demo accounts</strong><br />Admin: anika.botha@sudo.co.za / Admin@123<br />Customer: thandi.mokoena@example.com / Customer@123</p>
      </section>
    </main>
  )
}
