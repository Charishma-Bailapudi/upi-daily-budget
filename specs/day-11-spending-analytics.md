# Specification: Day 11 — Spending Analytics & Telegram /stats Command

## 1. Objective

Aggregate user spending data across recent days to produce structured analytical insights (category breakdowns, daily average spend, total transactions, and largest expenses) available via REST API and on-demand Telegram command.

---

## 2. Aggregation Logic (`analyticsService.js`)

Accept parameters: `userId`, `days = 7`.

1. **Date Range**: Calculate `startDate` as `Date.now() - (days * 24 * 60 * 60 * 1000)`.
2. **Transaction Aggregation**:
   - Filter `Transaction` documents matching `user: userId` and `createdAt >= startDate`.
   - Aggregate metrics:
     - `totalSpent`: Sum of all amounts.
     - `transactionCount`: Count of matching records.
     - `categoryBreakdown`: Group by `category`, sum amounts, sort descending.
     - `topMerchant`: Merchant with the highest aggregate spend.
     - `dailyAverage`: `totalSpent / days`.
3. **Daily Budget Compliance**:
   - Query `DailyBudget` documents for the same window.
   - Count days with `healthStatus === 'GREEN'` vs `healthStatus === 'RED'`.
   - Calculate compliance percentage: `(greenDays / totalTrackedDays) * 100`.

---

## 3. Endpoints & Commands

### A. REST Endpoint: `GET /api/v1/budgets/analytics`

- **Auth**: Protected route (`protect`).
- **Query Params**: `?days=<integer>` (default: 7; accepts any integer from 1 to 365).
- **Response Format**:
  ```json
  {
    "success": true,
    "data": {
      "periodDays": 7,
      "totalSpent": 3450,
      "dailyAverage": 492.85,
      "transactionCount": 12,
      "topCategory": "Food",
      "categoryBreakdown": [
        { "category": "Food", "amount": 2100, "percentage": 60.8 },
        { "category": "Shopping", "amount": 950, "percentage": 27.5 },
        { "category": "Travel", "amount": 400, "percentage": 11.6 }
      ],
      "budgetComplianceRate": 71.4
    }
  }
  ```
