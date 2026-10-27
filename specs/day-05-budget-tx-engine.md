# Specification: Day 05 — Category Seeding, Budget Calculation Engine & Transaction Logging

## 1. Objective
Build the core financial pipeline: pre-seed default expense categories, auto-generate daily budget snapshots anchored to IST (`Asia/Kolkata`), process transaction expenses with atomic balance updates (`$inc`), and dynamically calculate budget health states (`GREEN`, `YELLOW`, `RED`).

---

## 2. Invariants & Rules
- **Timezone Anchor**: Daily snapshots and transaction dates must strictly format as `YYYY-MM-DD` calculated in the user's timezone (default: `Asia/Kolkata`).
- **Atomic Concurrency Protection**: Deductions to `DailyBudget` must use MongoDB's `$inc` operator (`totalSpent: +amount`, `remainingBalance: -amount`) rather than read-modify-write patterns to prevent race conditions during rapid UPI inputs.
- **Dynamic Status Thresholds**:
  - `remainingBalance <= 0` ➔ `RED`
  - `0 < remainingBalance < (dailyCap * 0.2)` ➔ `YELLOW`
  - `remainingBalance >= (dailyCap * 0.2)` ➔ `GREEN`
- **Ownership Scoping**: All operations on budgets, transactions, and custom categories must strictly filter by `userId: req.user._id` derived from `authMiddleware`.
- **Category Integrity**: A transaction cannot be created with a non-existent or foreign custom category ID.

---

## 3. Endpoints & Features to Deliver

### A. Category Seeder (`backend/src/scripts/seedCategories.js`)
- Must seed 7 standard global categories (`userId: null`, `isDefault: true`):
  - `FOOD` (icon: `utensils`, color: `#10B981`)
  - `TRAVEL` (icon: `car`, color: `#3B82F6`)
  - `BILLS` (icon: `zap`, color: `#F59E0B`)
  - `GROCERIES` (icon: `shopping-cart`, color: `#8B5CF6`)
  - `SHOPPING` (icon: `shopping-bag`, color: `#EC4899`)
  - `ENTERTAINMENT` (icon: `film`, color: `#06B6D4`)
  - `OTHER` (icon: `tag`, color: `#6B7280`)
- Must use upsert operations (`findOneAndUpdate` with `upsert: true`) so running repeatedly does not create duplicate entries.

### B. Categories Route (`/api/v1/categories`)
- `GET /` (Protected):
  - Queries categories matching `{ $or: [{ userId: null }, { userId: req.user._id }] }`.
  - Returns HTTP `200` with list of categories.

### C. Daily Budget Route (`/api/v1/budgets`)
- `GET /today` (Protected):
  - Resolves today's date string (`YYYY-MM-DD`) in IST.
  - Searches for `DailyBudget` matching `{ userId: req.user._id, date: today }`.
  - If missing, auto-creates the document:
    - `dailyCap`: `req.user.defaultDailyCap`
    - `totalSpent`: `0`
    - `remainingBalance`: `req.user.defaultDailyCap`
    - `status`: `'GREEN'`
  - Returns HTTP `200` with the budget snapshot.

### D. Transaction Route (`/api/v1/transactions`)
- `POST /` (Protected):
  - Payload: `{ amount, merchant, categoryId, note, simulatedUpiRef }`
  - Validates `amount > 0`, `merchant` (non-empty string), and valid `categoryId`.
  - Ensures today's budget document exists (creates if not present).
  - Creates the `Transaction` document.
  - Updates `DailyBudget` using `$inc`:
    ```javascript
    { $inc: { totalSpent: amount, remainingBalance: -amount } }
    ```
  - Re-evaluates status (`GREEN`, `YELLOW`, `RED`) and updates if altered.
  - Returns HTTP `201` with created transaction and updated daily budget.
- `GET /today` (Protected):
  - Queries transactions matching `{ userId: req.user._id, date: today }`.
  - Populates `categoryId` with `name`, `icon`, and `color`.
  - Sorts descending by `createdAt: -1`.
  - Returns HTTP `200` with the transaction list.

---

## 4. File Layout

```text
backend/
├── src/
│   ├── scripts/
│   │   └── seedCategories.js             # One-time/idempotent category populator
│   ├── utils/
│   │   └── dateUtils.js                  # Standardized YYYY-MM-DD IST formatter
│   ├── controllers/
│   │   ├── categoryController.js         # getCategories
│   │   ├── budgetController.js           # getTodayBudget
│   │   └── transactionController.js      # createTransaction, getTodayTransactions
│   ├── routes/
│   │   ├── categoryRoutes.js             # GET /api/v1/categories
│   │   ├── budgetRoutes.js               # GET /api/v1/budgets/today
│   │   └── transactionRoutes.js          # POST /api/v1/transactions, GET /api/v1/transactions/today
│   └── app.js                            # Mount routers under /api/v1/