import { useEffect, useState } from 'react'
import { Check, Copy, MessageCircle, Send } from 'lucide-react'
import api, { getErrorMessage } from '../lib/api'

function TelegramLinkCard({ isLinked }) {
  const [code, setCode] = useState('')
  const [expiresAt, setExpiresAt] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!expiresAt) return undefined

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      setSecondsLeft(remaining)
    }

    updateCountdown()
    const intervalId = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(intervalId)
  }, [expiresAt])

  async function generateCode() {
    setLoading(true)
    setError('')
    setCopied(false)
    try {
      const { data } = await api.post('/auth/telegram-code')
      setCode(data.code)
      setExpiresAt(Date.now() + Number(data.expiresInMinutes || 10) * 60 * 1000)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      setError('Could not access the clipboard. Select and copy the code instead.')
    }
  }

  const linked = Boolean(isLinked)

  return (
    <section className="card telegram-card" aria-labelledby="telegram-heading">
      <div className="card-heading">
        <div>
          <span className="eyebrow">STAY IN THE LOOP</span>
          <h2 id="telegram-heading">Telegram alerts</h2>
        </div>
        <span className={`icon-tile ${linked ? 'success' : 'neutral'}`} aria-hidden="true">
          <MessageCircle size={21} />
        </span>
      </div>

      <div className={`link-status ${linked ? 'linked' : 'unlinked'}`}>
        <span className="status-dot" />
        {linked ? 'Telegram account linked' : 'Telegram account not linked'}
      </div>

      {linked ? (
        <p className="card-description">
          Payment alerts and daily updates will be sent to your Telegram chat.
        </p>
      ) : (
        <>
          <p className="card-description">
            Link your Telegram account to receive payment alerts and daily budget updates.
          </p>
          <ol className="link-steps">
            <li>Generate a one-time linking code.</li>
            <li>Open your Telegram budget bot and send <code>/link &lt;code&gt;</code>.</li>
          </ol>
          {code && secondsLeft > 0 && (
            <div className="otp-panel">
              <div>
                <span className="metric-label">YOUR LINKING CODE</span>
                <strong className="otp-code" aria-label={`Code ${code}`}>{code}</strong>
                <span className="otp-expiry">Expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</span>
              </div>
              <button className="icon-button" type="button" onClick={copyCode} aria-label="Copy linking code">
                {copied ? <Check size={17} /> : <Copy size={17} />}
              </button>
            </div>
          )}
          {code && secondsLeft === 0 && (
            <p className="error-message" role="status">This code expired. Generate a new one to continue.</p>
          )}
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="button button-secondary full-width" type="button" onClick={generateCode} disabled={loading}>
            <Send size={16} />
            {loading ? 'Generating code…' : code ? 'Generate a new code' : 'Generate Telegram code'}
          </button>
        </>
      )}
    </section>
  )
}

export default TelegramLinkCard
