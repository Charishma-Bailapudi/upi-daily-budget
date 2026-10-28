# Specification: Day 07 — Telegram Bot Setup & Webhook Handler

## 1. Objective

Establish the inbound Telegram webhook receiver, enforce webhook token verification, and implement the default `/start` greeting responder.

---

## 2. Invariants & Security

- **Secret Token Validation**: Telegram requests must include the header `X-Telegram-Bot-Api-Secret-Token`. Reject any request missing or failing this check with HTTP 403.
- **Async Execution**: Always respond to Telegram with HTTP 200 immediately to prevent Telegram retry storms, then process the payload asynchronously.
- **Command Router**:
  - `/start`: Returns a friendly onboarding message explaining how to link their account and commands available.

---

## 3. Endpoints & Flow

- `POST /api/v1/webhook/telegram`
  - Headers: `X-Telegram-Bot-Api-Secret-Token: <SECRET>`
  - Body: Standard Telegram Update object containing `message: { chat: { id }, text }`
  - Action: Dispatches reply via `https://api.telegram.org/bot<TOKEN>/sendMessage`.

---

## 4. Done When

Texting `/start` to the bot on Telegram (or simulating the webhook via PowerShell) returns HTTP 200 and dispatches the welcome greeting.
