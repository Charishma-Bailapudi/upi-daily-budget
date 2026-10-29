import { useEffect, useState } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import api, { getErrorMessage } from '../lib/api'

const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)

function DailyAllowanceCard({ refreshKey }) {
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get('/budgets/today')
      .then(({ data }) => {
        if (active) setBudget(data.budget)
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [refreshKey])

  const dailyCap = Number(budget?.dailyCap) || 0
  const spent = Number(budget?.totalSpent) || 0
  const progress = dailyCap > 0 ? (spent / dailyCap) * 100 : 0
  const tone = progress >= 100 ? 'danger' : progress > 75 ? 'warning' : 'success'
  const progressWidth = Math.min(progress, 100)

  return (
    <section className="card allowance-card" aria-labelledby="allowance-heading">
      <div className="card-heading">
        <div>
          <span className="eyebrow">TODAY'S OVERVIEW</span>
          <h2 id="allowance-heading">Daily allowance</h2>
        </div>
        <span className={`icon-tile ${tone}`} aria-hidden="true">
          <Activity size={21} />
        </span>
      </div>

      {loading ? (
        <p className="state-message" role="status">Loading today&apos;s budget…</p>
      ) : error ? (
        <p className="error-message" role="alert">{error}</p>
      ) : (
        <>
          <div className="allowance-amount">
            <span>{formatINR(budget?.remainingBalance)}</span>
            <span className="muted">left today</span>
          </div>
          <div
            className="progress-track allowance-progress"
            role="progressbar"
            aria-label="Daily allowance spent"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(Math.min(progress, 100))}
          >
            <div className={`progress-fill ${tone}`} style={{ width: `${progressWidth}%` }} />
          </div>
          <div className="progress-caption">
            <span>{Math.round(progress)}% used</span>
            <span>{formatINR(dailyCap)} daily cap</span>
          </div>
          <div className="metric-grid">
            <div className="metric-box">
              <span className="metric-label">Spent</span>
              <strong>{formatINR(spent)}</strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">Remaining</span>
              <strong>{formatINR(budget?.remainingBalance)}</strong>
            </div>
          </div>
          <p className="card-footnote">
            {budget?.date || 'Today'} · {budget?.status || 'Budget active'}
          </p>
        </>
      )}
      {!loading && error && (
        <button className="text-button" type="button" onClick={() => window.location.reload()}>
          <RefreshCw size={14} /> Reload dashboard
        </button>
      )}
    </section>
  )
}

export default DailyAllowanceCard
