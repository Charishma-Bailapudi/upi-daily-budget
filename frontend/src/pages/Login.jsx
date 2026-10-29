import { useState } from 'react'
import { ArrowRight, LockKeyhole, WalletCards } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api, { getErrorMessage } from '../lib/api'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim(),
        password,
      })
      if (typeof data.token !== 'string' || !data.token) {
        throw new Error('Login succeeded but no authentication token was returned.')
      }
      window.localStorage.setItem('token', data.token)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-brand-row">
        <Link className="brand" to="/login" aria-label="Paisawise login">
          <span className="brand-icon"><WalletCards size={21} /></span>
          <span>paisa<span className="brand-accent">wise</span></span>
        </Link>
        <span className="auth-brand-note">Your daily budget, made simple</span>
      </div>

      <section className="auth-card" aria-labelledby="login-heading">
        <div className="auth-card-icon"><LockKeyhole size={21} /></div>
        <span className="eyebrow">WELCOME BACK</span>
        <h1 id="login-heading">Sign in to Paisawise</h1>
        <p className="auth-subtitle">Pick up where you left off and stay on top of today&apos;s spending.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <div className="password-label-row">
            <label htmlFor="login-password">Password</label>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && <p className="error-message auth-error" role="alert">{error}</p>}

          <button className="button button-primary full-width auth-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="auth-security"><LockKeyhole size={13} /> Your account is protected with secure sign-in.</p>
      </section>

      <footer className="auth-footer">Spend with intention. Save with confidence.</footer>
    </main>
  )
}

export default Login
