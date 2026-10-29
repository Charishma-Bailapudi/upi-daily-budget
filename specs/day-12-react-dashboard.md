# Specification: Day 12 — React Frontend Dashboard

## 1. Objective

Build an intuitive, responsive React dashboard inside `frontend/` that connects authenticated users to their daily budget metrics, Telegram pairing workflow, UPI payment simulator, and historical spending analytics.

---

## 2. API Integration Points

- `GET /api/v1/budgets/today`: Fetches today's allowance, total spent, remaining balance, and health status.
- `POST /api/v1/auth/telegram-code`: Generates a fresh 6-digit OTP code for Telegram linking.
- `GET /api/v1/budgets/analytics?days={7|30|31}`: Retrieves aggregated spending metrics and category breakdown.
- `POST /api/v1/upi/pay`: Simulates a payment transaction, updating the budget and triggering Telegram alerts.

---

## 3. UI Component Structure (`frontend/src/`)

- `components/DailyAllowanceCard.jsx`:
  - Visual progress bar: `(totalSpent / dailyCap) * 100`.
  - Status indicator: Green (<80%), Yellow (80-100%), Red (>100%).
  - Currency formatted in INR (₹).
- `components/TelegramLinkCard.jsx`:
  - Displays linking status.
  - Button to generate 6-digit OTP with countdown timer or expiry prompt.
  - Step-by-step instruction on messaging the bot.
- `components/AnalyticsCard.jsx`:
  - Period selector: `7 Days`, `30 Days`, `31 Days`.
  - Metrics row: Total Spent, Daily Average, Green Days compliance.
  - Category breakdown with visual percentage bars.
- `components/PaymentSimulatorCard.jsx`:
  - Inputs: Amount, Merchant, UPI PIN.
  - Triggers payment and refreshes sibling components.

---

## 4. Done When

- Dashboard loads all cards cleanly without errors.
- Triggering a simulated payment immediately updates the daily gauge and triggers a Telegram alert.
- Clicking "Generate Telegram Code" displays a valid 6-digit OTP.
- Switching between 7 and 31 days re-fetches and updates the analytics breakdown.
