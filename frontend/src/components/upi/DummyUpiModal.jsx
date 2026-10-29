import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, X } from 'lucide-react'
import api, { getErrorMessage } from '../../lib/api'
import { useToast } from '../ToastProvider'
import PinKeypad from './PinKeypad'

function DummyUpiModal({
  isOpen,
  merchant,
  amount,
  selectedApp,
  onClose,
  onPaymentSuccess,
}) {
  const toast = useToast()
  const [pin, setPin] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [error, setError] = useState('')
  const [shakeKey, setShakeKey] = useState(0)
  const submitted = useRef(false)

  useEffect(() => {
    if (!isOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isSubmitting && !submitted.current && !paymentComplete) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, paymentComplete, isSubmitting])

  useEffect(() => {
    if (!isOpen) return
    setPin('')
    setIsSubmitting(false)
    setPaymentComplete(false)
    setError('')
    submitted.current = false
  }, [isOpen, merchant, amount])

  useEffect(() => {
    if (!paymentComplete) return undefined
    const timeoutId = window.setTimeout(onClose, 1300)
    return () => window.clearTimeout(timeoutId)
  }, [onClose, paymentComplete])

  if (!isOpen) return null

  function appendDigit(digit) {
    if (isSubmitting || submitted.current || paymentComplete || pin.length >= 4) return
    setError('')
    const nextPin = `${pin}${digit}`
    setPin(nextPin)
    if (nextPin.length === 4) {
      submitPayment(nextPin)
    }
  }

  function deleteDigit() {
    if (isSubmitting || submitted.current || paymentComplete) return
    setError('')
    setPin((current) => current.slice(0, -1))
  }

  async function submitPayment(pinValue = pin) {
    if (pinValue.length !== 4 || submitted.current || isSubmitting) return
    submitted.current = true
    setIsSubmitting(true)
    setError('')

    try {
      await api.post('/upi/pay', {
        amount: Number(amount),
        merchant: merchant.trim(),
        upiPin: pinValue,
      })
      setPaymentComplete(true)
      onPaymentSuccess()
      toast.success(`₹${Number(amount).toFixed(2)} paid to ${merchant}.`)
    } catch (requestError) {
      const message = getErrorMessage(requestError)
      setError(message)
      setPin('')
      submitted.current = false
      if (
        requestError.response?.status === 401 &&
        requestError.response?.data?.error === 'INCORRECT_PIN'
      ) {
        setShakeKey((key) => key + 1)
      }
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="upi-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isSubmitting &&
          !submitted.current &&
          !paymentComplete
        ) {
          onClose()
        }
      }}
    >
      <section
        className="upi-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upi-modal-heading"
        aria-busy={isSubmitting}
      >
        <header className="upi-modal-header">
          <button
            className="upi-modal-back"
            type="button"
            onClick={onClose}
            disabled={isSubmitting || submitted.current || paymentComplete}
            aria-label="Close checkout"
          >
            <ArrowLeft size={18} />
          </button>
          <span id="upi-modal-heading">UPI checkout</span>
          <button
            className="upi-modal-close"
            type="button"
            onClick={onClose}
            disabled={isSubmitting || submitted.current || paymentComplete}
            aria-label="Close checkout"
          >
            <X size={18} />
          </button>
        </header>

        <div className="upi-merchant-summary">
          <span className="upi-merchant-avatar">{merchant.trim().charAt(0).toUpperCase() || 'M'}</span>
          <span className="upi-merchant-caption">Paying {merchant} with {selectedApp}</span>
          <strong className="upi-amount">₹{Number(amount).toFixed(2)}</strong>
          <span className="upi-demo-note">Demo checkout only — no real UPI ID or phone number is used.</span>
        </div>

        {paymentComplete ? (
          <div className="upi-success" role="status">
            <span className="upi-success-check"><Check size={38} strokeWidth={3} /></span>
            <strong>Payment successful</strong>
            <span>₹{Number(amount).toFixed(2)} sent to {merchant}</span>
          </div>
        ) : (
          <div className="upi-pin-screen">
            <div className="upi-pin-heading">
              <strong>Enter your UPI PIN</strong>
              <span>Securely authorize this payment</span>
            </div>
            <PinKeypad
              key={shakeKey}
              pin={pin}
              error={error}
              shakeKey={shakeKey}
              disabled={isSubmitting || submitted.current}
              onDigit={appendDigit}
              onBackspace={deleteDigit}
            />
          </div>
        )}
      </section>
    </div>
  )
}

export default DummyUpiModal
