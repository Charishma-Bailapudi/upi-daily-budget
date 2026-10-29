# Specification: Day 14 — Automated Integration & Edge Case Test Suite

## 1. Objective

Establish an automated test suite covering all critical business logic and API contracts using Jest, Supertest, and an in-memory/test MongoDB instance.

---

## 2. Test Cases to Cover

### A. Authentication & Pairing (`backend/tests/auth.test.js`)

- `POST /api/v1/auth/register`: Create user with default daily cap.
- `POST /api/v1/auth/login`: Authenticate and return valid JWT.
- `POST /api/v1/auth/telegram-code`: Generate a 6-digit linking code with expiration.

### B. UPI Payments & Atomic Deductions (`backend/tests/upi.test.js`)

- `POST /api/v1/upi/pay`:
  - Valid payment reduces `remainingBalance` atomically.
  - Overspending triggers `RED` health status.
  - Incorrect UPI PIN returns 400 without deducting budget.
  - Missing fields (amount, merchant) return validation errors.

### C. Midnight Rollover (`backend/tests/rollover.test.js`)

- Triggering `executeDailyRollover()`:
  - Marks yesterday's budget as `CLOSED`.
  - Computes unspent allowance as surplus.
  - Initializes today's budget with fresh allowance anchored to `Asia/Kolkata`.

### D. Analytics Engine (`backend/tests/analytics.test.js`)

- `GET /api/v1/budgets/analytics`:
  - Returns accurate `totalSpent`, `dailyAverage`, and `budgetComplianceRate`.
  - Handles arbitrary day ranges (7, 30, 31).
  - Safely handles zero-transaction scenarios without throwing NaN or 500 errors.

---

## 3. Execution Standard

- Tests run via `npm test` inside `backend/`.
- Must mock external network calls (Telegram Bot API) so tests run offline and reliably in CI.
