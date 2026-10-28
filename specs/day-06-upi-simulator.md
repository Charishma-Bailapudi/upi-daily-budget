# Specification: Day 06 — Custom Built-in UPI Simulator Engine

## 1. Objective
Build a realistic mock UPI payment processing endpoint (`POST /api/v1/upi/pay`). It validates PIN structure, auto-classifies merchant strings, atomically executes budget deductions via `$inc`, updates budget health states, and returns structured payment receipts.

---

## 2. Invariants & Rules
- **PIN Verification**: Reject payloads where `upiPin` is not a 4-digit or 6-digit numeric string with HTTP 400 (`"Invalid UPI PIN format. Must be 4 or 6 numeric digits."`).
- **Atomic Deduction**: The `DailyBudget` balance update must strictly execute with MongoDB's `$inc` operator (`totalSpent: +amount`, `remainingBalance: -amount`) to prevent concurrency races.
- **Dynamic Category Resolution**: If `categoryId` is omitted in the payload, use `classifyMerchant(merchant)` from Day 5 to resolve to an existing database category (`FOOD`, `GROCERIES`, `TRAVEL`, `BILLS`, `SHOPPING`, `OTHER`).
- **Budget Auto-Creation**: If no budget snapshot exists for today (`YYYY-MM-DD` in IST), auto-initialize one using the user's `defaultDailyCap` before deducting.
- **Dynamic Status Transitions**:
  - `remainingBalance <= 0` ➔ `RED`
  - `0 < remainingBalance < (dailyCap * 0.2)` ➔ `YELLOW`
  - `remainingBalance >= (dailyCap * 0.2)` ➔ `GREEN`

---

## 3. Endpoints & Features

### POST `/api/v1/upi/pay` (Protected)
- **Request Body**:
  ```json
  {
    "amount": 250,
    "merchant": "Starbucks Coffee",
    "upiPin": "1234",
    "note": "Caramel Macchiato",
    "paymentApp": "GPAY"
  }