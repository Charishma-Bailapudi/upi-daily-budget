import { Delete } from 'lucide-react'

const keypadRows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
]

function PinKeypad({ pin, error, disabled, shakeKey, onDigit, onBackspace }) {
  return (
    <div className={`pin-entry ${shakeKey ? 'animate-shake' : ''}`}>
      <div
        className="pin-dots"
        role="group"
        aria-label={`${pin.length} of 4 PIN digits entered`}
      >
        {Array.from({ length: 4 }, (_, index) => (
          <span
            className={`pin-dot ${index < pin.length ? 'filled' : ''}`}
            key={index}
            aria-hidden="true"
          />
        ))}
      </div>

      <div
        className="pin-keypad"
        aria-label="UPI PIN keypad"
        aria-disabled={disabled}
      >
        {keypadRows.flat().map((digit) => (
          <button
            className="pin-key"
            key={digit}
            type="button"
            disabled={disabled || pin.length >= 4}
            onClick={() => onDigit(digit)}
            aria-label={`Enter ${digit}`}
          >
            {digit}
          </button>
        ))}
        <span className="pin-key-spacer" aria-hidden="true" />
        <button
          className="pin-key"
          type="button"
          disabled={disabled || pin.length >= 4}
          onClick={() => onDigit('0')}
          aria-label="Enter 0"
        >
          0
        </button>
        <button
          className="pin-key pin-key-action"
          type="button"
          disabled={disabled || pin.length === 0}
          onClick={onBackspace}
          aria-label="Delete last digit"
        >
          <Delete size={19} />
        </button>
      </div>
      {disabled && <p className="pin-security-note" role="status">Verifying PIN…</p>}
      {error && <p className="error-message upi-error" role="alert">{error}</p>}
      <p className="pin-security-note">Enter 4 digits to authorize this demo payment.</p>
    </div>
  )
}

export default PinKeypad
