import { useEffect, useState } from 'react'
import { Clock3, ReceiptText } from 'lucide-react'
import api, { getErrorMessage } from '../lib/api'

const formatINR = (amount) =>
  `-₹${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)}`

const formatISTDate = (date) => {
  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable'

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
    timeZoneName: 'short',
  }).format(parsedDate)
}

function TransactionHistoryCard({ refreshKey }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get('/upi/transactions', { params: { limit: 10 } })
      .then(({ data }) => {
        if (active) {
          setTransactions(Array.isArray(data.transactions) ? data.transactions : [])
        }
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

  return (
    <section className="card transaction-card" aria-labelledby="transactions-heading">
      <div className="card-heading">
        <div>
          <span className="eyebrow">RECENT ACTIVITY</span>
          <h2 id="transactions-heading">Transaction history</h2>
        </div>
        <span className="icon-tile neutral" aria-hidden="true"><ReceiptText size={21} /></span>
      </div>

      {loading ? (
        <p className="state-message" role="status">Loading transactions…</p>
      ) : error ? (
        <p className="error-message" role="alert">{error}</p>
      ) : transactions.length === 0 ? (
        <div className="transaction-empty">
          <span className="empty-icon"><ReceiptText size={21} /></span>
          <strong>No transactions yet</strong>
          <span>Your recent payments will appear here.</span>
        </div>
      ) : (
        <div className="transaction-list">
          {transactions.map((transaction) => (
            <article className="transaction-row" key={transaction._id}>
              <span className="transaction-avatar" aria-hidden="true">
                {(transaction.merchant || '?').trim().charAt(0).toUpperCase() || '?'}
              </span>
              <div className="transaction-main">
                <strong className="transaction-merchant">{transaction.merchant || 'Unknown merchant'}</strong>
                <span className="transaction-time">
                  <Clock3 size={12} aria-hidden="true" />
                  {formatISTDate(transaction.createdAt)}
                </span>
              </div>
              <span className="category-pill">{transaction.category || 'Other'}</span>
              <strong className="transaction-amount">{formatINR(transaction.amount)}</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default TransactionHistoryCard
