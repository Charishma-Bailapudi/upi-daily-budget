import { useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  Smartphone,
  WalletCards,
  ShoppingBag,
} from 'lucide-react'

const paymentApps = [
  { name: 'PhonePe', icon: Smartphone, tone: 'phonepe' },
  { name: 'Google Pay', icon: WalletCards, tone: 'gpay' },
  { name: 'Amazon Pay', icon: ShoppingBag, tone: 'amazon' },
  { name: 'Razorpay', icon: CreditCard, tone: 'razorpay' },
]

function PaymentSimulatorCard({ onContinueCheckout = () => {} }) {
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [selectedApp, setSelectedApp] = useState('')

  function handleContinue(event) {
    event.preventDefault()
    if (!selectedApp) return
    onContinueCheckout({
      name: merchant.trim(),
      amount: Number(amount),
      app: selectedApp,
    })
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
      <p className="card-description">Enter a merchant and amount, choose a payment app, then complete the demo checkout. No real UPI payment is made.</p>

      <form className="payment-form" onSubmit={handleContinue}>
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
        <fieldset className="payment-app-fieldset">
          <legend>Choose a payment app</legend>
          <div className="payment-app-grid">
            {paymentApps.map(({ name, icon: Icon, tone }) => (
              <button
                className={`payment-app-option ${selectedApp === name ? 'selected' : ''}`}
                key={name}
                type="button"
                onClick={() => setSelectedApp(name)}
                aria-pressed={selectedApp === name}
              >
                <span className={`payment-app-icon ${tone}`}><Icon size={18} /></span>
                <span>{name}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <button className="button button-primary full-width" type="submit" disabled={!selectedApp}>
          Continue to PIN
          <ArrowRight size={17} />
        </button>
        <p className="security-note">Demo only — the selected app is for display and does not open a real payment app.</p>
      </form>
    </section>
  )
}

export default PaymentSimulatorCard
