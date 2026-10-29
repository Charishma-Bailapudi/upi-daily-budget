import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import api, { getErrorMessage } from '../lib/api'

const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)

function AnalyticsCard({ refreshKey }) {
  const [days, setDays] = useState(7)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get('/budgets/analytics', { params: { days } })
      .then(({ data }) => {
        if (active) setAnalytics(data.data)
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
  }, [days, refreshKey])

  const categories = Array.isArray(analytics?.categoryBreakdown)
    ? analytics.categoryBreakdown
    : []

  return (
    <section className="card analytics-card" aria-labelledby="analytics-heading">
      <div className="card-heading analytics-heading">
        <div>
          <span className="eyebrow">YOUR SPENDING</span>
          <h2 id="analytics-heading">Analytics</h2>
        </div>
        <div className="analytics-controls">
          <span className="icon-tile neutral" aria-hidden="true"><BarChart3 size={21} /></span>
          <label className="sr-only" htmlFor="analytics-days">Analytics period</label>
          <select
            id="analytics-days"
            className="select-control"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={31}>31 days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="state-message" role="status">Loading analytics…</p>
      ) : error ? (
        <p className="error-message" role="alert">{error}</p>
      ) : (
        <>
          <div className="analytics-metrics">
            <div>
              <span className="metric-label">Total spent</span>
              <strong>{formatINR(analytics?.totalSpent)}</strong>
            </div>
            <div>
              <span className="metric-label">Daily average</span>
              <strong>{formatINR(analytics?.dailyAverage)}</strong>
            </div>
            <div>
              <span className="metric-label">Budget discipline</span>
              <strong>{Number(analytics?.budgetComplianceRate) || 0}%</strong>
            </div>
          </div>
          <div className="category-list">
            <div className="category-list-heading">
              <h3>Spending by category</h3>
              <span>{analytics?.transactionCount || 0} transactions</span>
            </div>
            {categories.length === 0 ? (
              <p className="empty-state">No transactions recorded in this period.</p>
            ) : (
              categories.map((item) => {
                const percentage = Math.max(0, Math.min(Number(item.percentage) || 0, 100))
                return (
                  <div className="category-row" key={item.category}>
                    <div className="category-label">
                      <span>{item.category || 'Other'}</span>
                      <span>{formatINR(item.amount)} <small>{Number(item.percentage) || 0}%</small></span>
                    </div>
                    <div className="progress-track category-progress" aria-hidden="true">
                      <div className="progress-fill accent" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default AnalyticsCard
