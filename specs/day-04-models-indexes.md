# Specification: Day 04 — Daily Budget & Transaction Models (With Indexes)

## 1. Objective

Define strict, validated Mongoose schemas for `DailyBudget`, `Transaction`, and `Category` with proper indexes—specifically the compound unique index `{ userId: 1, date: 1 }` on `DailyBudget` to prevent duplicate daily snapshots.

## 2. Invariants & Rules

- **Duplicate Prevention**: A user can never have more than one `DailyBudget` snapshot for any given calendar date. The schema must enforce a compound unique index: `{ userId: 1, date: 1 }`.
- **Date Format**: Stored strictly as a string in `YYYY-MM-DD` format (IST-aligned) to prevent UTC offset shifting.
- **Category Model**: Supports default pre-seeded categories (Food, Travel, Bills, Shopping, Groceries, Entertainment) and custom user categories.
- **Atomic Math Safeguards**: Monetary values (`dailyCap`, `totalSpent`, `amount`) must enforce numeric non-negative rules (`min: 0`).

## 3. Files to Create / Update

- `backend/src/models/Category.js`
- `backend/src/models/DailyBudget.js`
- `backend/src/models/Transaction.js`
- `backend/src/models/index.js` (Barrel export)

## 4. Schema Details

### A. Category (`backend/src/models/Category.js`)

- `name`: String, required, trim
- `icon`: String, default 'tag'
- `color`: String, default '#10B981'
- `isDefault`: Boolean, default true
- `userId`: ObjectId, ref 'User', default null (null for system-wide defaults)
- Compound Index: `{ name: 1, userId: 1 }` (unique)

### B. DailyBudget (`backend/src/models/DailyBudget.js`)

- `userId`: ObjectId, ref 'User', required, index: true
- `date`: String, required (format: YYYY-MM-DD)
- `dailyCap`: Number, required, min: 0
- `totalSpent`: Number, required, default: 0, min: 0
- `remainingBalance`: Number, required
- `status`: String, enum: ['GREEN', 'YELLOW', 'RED'], default: 'GREEN'
- `nightlyRoast`: String, default: null
- **Compound Unique Index**: `{ userId: 1, date: 1 }` (unique: true)

### C. Transaction (`backend/src/models/Transaction.js`)

- `userId`: ObjectId, ref 'User', required, index: true
- `categoryId`: ObjectId, ref 'Category', required
- `date`: String, required (YYYY-MM-DD)
- `amount`: Number, required, min: [1, 'Amount must be at least ₹1']
- `merchant`: String, required, trim
- `simulatedUpiRef`: String, unique, sparse: true
- `note`: String, trim, default: ''
- Index: `{ userId: 1, date: -1 }`

## 5. Done When

Attempting to insert two budget snapshots for the same user on the same date triggers a MongoDB duplicate key error (`E11000 duplicate key error collection: ... index: userId_1_date_1`).
