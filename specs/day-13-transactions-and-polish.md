# Specification: Day 13 — Transaction History, Toast Feedback & Dashboard Polish

## 1. Objective

Add recent transaction visibility, reactive feedback, and polish the user experience across the React dashboard.

---

## 2. API Contract

- **Endpoint**: `GET /api/v1/upi/transactions`
- **Auth**: Protected route (`protect`).
- **Query Params**: `?limit=10&page=1` (default limit: 10).
- **Response Format**:
  ```json
  {
    "success": true,
    "count": 5,
    "transactions": [
      {
        "_id": "67...",
        "amount": 75,
        "merchant": "Chai Point",
        "category": "Food",
        "createdAt": "2026-10-29T10:30:00.000Z"
      }
    ]
  }
  ```
