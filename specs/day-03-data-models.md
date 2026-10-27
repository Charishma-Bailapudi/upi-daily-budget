# Specification: Day 03 — Data Modeling & Schema Design

## 1. Objective

Define strict, validated Mongoose schemas for User, DailyBudget, and Transaction to support atomic deductions, daily spending tracking, and nightly roasts.

## 2. Invariants & Rules

- Date format for daily records must be strict ISO date string: `YYYY-MM-DD`.
- Compound unique index on DailyBudget: `{ userId: 1, date: 1 }` to prevent duplicate daily snapshots.
- Number fields (amount, dailyCap, totalSpent) must enforce `min: 0`.
- All models must include automatic timestamps (`createdAt`, `updatedAt`).

## 3. Files to Create

- `backend/src/models/User.js`
- `backend/src/models/DailyBudget.js`
- `backend/src/models/Transaction.js`
- `backend/src/models/index.js` (barrel export file)

## 4. Schema Specifications

### A. User (`backend/src/models/User.js`)

- `name`: String, required, trim
- `email`: String, required, unique, lowercase, trim
- `upiId`: String, required, unique, lowercase, trim (e.g., "user@upi")
- `defaultDailyCap`: Number, required, default 3300, min 100
- `timezone`: String, default 'Asia/Kolkata'

### B. DailyBudget (`backend/src/models/DailyBudget.js`)

- `userId`: ObjectId, ref 'User', required, indexed
- `date`: String, required (format: YYYY-MM-DD)
- `dailyCap`: Number, required, min 0
- `totalSpent`: Number, required, default 0, min 0
- `remainingBalance`: Number, required
- `status`: String, enum: ['GREEN', 'YELLOW', 'RED'], default 'GREEN'
- `nightlyRoast`: String, default null
- Index: `{ userId: 1, date: 1 }` (unique)

### C. Transaction (`backend/src/models/Transaction.js`)

- `userId`: ObjectId, ref 'User', required, indexed
- `date`: String, required (YYYY-MM-DD)
- `amount`: Number, required, min 1
- `merchant`: String, required, trim
- `category`: String, enum: ['FOOD', 'TRAVEL', 'SHOPPING', 'BILLS', 'GROCERIES', 'ENTERTAINMENT', 'OTHER'], default 'OTHER'
- `simulatedUpiRef`: String, unique, sparse (e.g., 'UPI-20261027-XXXX')
- `note`: String, trim
