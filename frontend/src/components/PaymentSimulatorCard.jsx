import { useState } from 'react'
import { ArrowUpRight, LockKeyhole } from 'lucide-react'
import api, { getErrorMessage } from '../lib/api'
import { useToast } from './ToastProvider'

function PaymentSimulatorCard({ onPaymentSuccess }) {
  const toast = useToast()
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [upiPin, setUpiPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await api.post('/upi/pay', {
        amount: Number(amount),
        merchant: merchant.trim(),
        upiPin,
      })
      setSuccess('Payment simulated successfully. Your budget and analytics have been refreshed.')
      setAmount('')
      setMerchant('')
      setUpiPin('')
      onPaymentSuccess()
      toast.success('Payment simulated successfully.')
    } catch (requestError) {
      const message = getErrorMessage(requestError)
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card payment-card" aria-labelledby="payment-heading">
      <div className="card-heading">
        <div>
          <span className="eyebrow">TRY IT OUT</span>
          <h2 id="payment-heading">Simulate a payment</h2>
        </div>
        <span className="icon-tile accent" aria-hidden="true"><ArrowUpRight size={21} /></span>
      </div>
      <p className="card-description">Record a test UPI payment and see your daily allowance update instantly.</p>

      <form className="payment-form" onSubmit={handleSubmit}>
        <label>
          Amount
          <span className="input-prefix">
            <span aria-hidden="true">₹</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              required
            />
          </span>
        </label>
        <label>
          Merchant
          <input
            type="text"
            value={merchant}
            onChange={(event) => setMerchant(event.target.value)}
            placeholder="e.g. Coffee shop"
            maxLength={120}
            required
          />
        </label>
        <label>
          UPI PIN
          <span className="input-prefix pin-input">
            <LockKeyhole size={16} aria-hidden="true" />
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              minLength={4}
              maxLength={6}
              pattern="\d{4}(\d{2})?"
              value={upiPin}
              onChange={(event) => setUpiPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="4 or 6 digit PIN"
              required
            />
          </span>
        </label>
        {error && <p className="error-message form-feedback" role="alert">{error}</p>}
        {success && <p className="success-message form-feedback" role="status">{success}</p>}
        <button className="button button-primary full-width" type="submit" disabled={loading}>
          {loading ? 'Processing…' : 'Send payment'}
          {!loading && <ArrowUpRight size={17} />}
        </button>
        <p className="security-note"><LockKeyhole size={13} /> The PIN is sent only with this payment request.</p>
      </form>
    </section>
  )
}

export default PaymentSimulatorCard
