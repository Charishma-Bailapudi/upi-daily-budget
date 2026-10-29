import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import api, { getErrorMessage } from '../lib/api'

function ProtectedRoute() {
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let active = true
    const token = window.localStorage.getItem('token')

    if (!token) {
      setAuthenticated(false)
      setChecking(false)
      return () => {
        active = false
      }
    }

    api
      .get('/users/me')
      .then(({ data }) => {
        if (!active) return
        setUser(data.user)
        setAuthenticated(true)
      })
      .catch((error) => {
        if (!active) return
        const status = error.response?.status
        if (status === 401 || status === 403) {
          window.localStorage.removeItem('token')
          setAuthenticated(false)
        } else {
          setSessionError(getErrorMessage(error))
        }
      })
      .finally(() => {
        if (active) setChecking(false)
      })

    return () => {
      active = false
    }
  }, [retryCount])

  if (checking) {
    return (
      <main className="auth-loading" role="status">
        <span className="loading-mark" />
        Checking your session…
      </main>
    )
  }

  if (sessionError) {
    return (
      <main className="auth-loading auth-session-error" role="alert">
        <p>Could not verify your session: {sessionError}</p>
        <button
          className="button button-primary"
          type="button"
          onClick={() => {
            setSessionError('')
            setChecking(true)
            setRetryCount((count) => count + 1)
          }}
        >
          Try again
        </button>
      </main>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet context={{ user }} />
}

export default ProtectedRoute
