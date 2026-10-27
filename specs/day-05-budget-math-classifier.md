# Specification: Day 05 — Daily Budget Math & Auto-Categorizer

## 1. Objective

Implement the financial allocation math and merchant auto-categorization services.

## 2. Invariants & Formula

- **Formula**: `dailyAllowance = Math.floor((monthlyIncome - monthlySavingsGoal) / daysInMonth)`
- **Days in Month**: Dynamically calculated for the current IST month (e.g., October = 31, February = 28/29).
- **Auto-Categorizer Rules (Case-insensitive pattern matching)**:
  - `Starbucks`, `Swiggy`, `Zomato`, `McDonalds`, `KFC` -> `food_dining`
  - `Blinkit`, `Zepto`, `Instamart`, `BigBasket` -> `groceries`
  - `Uber`, `Ola`, `Rapido`, `Metro` -> `travel`
  - `Amazon`, `Flipkart`, `Myntra`, `Zara` -> `shopping`
  - `Airtel`, `Jio`, `BESCOM`, `Electricity`, `Wifi` -> `bills`
  - Fallback -> `other`

## 3. Files to Create

- `backend/src/utils/dateUtils.js`
- `backend/src/services/budgetEngine.js`
- `backend/src/services/categoryClassifier.js`
- `backend/tests/day05.test.js`

## 4. Done When

Unit test confirms:

1. ₹1,00,000 income with ₹0 savings goal for 31 days returns exactly `₹3,225/day`.
2. Merchant string "Starbucks" (and "starbucks coffee", "SWIGGY") automatically categorizes as `food_dining`.
3. "Zepto" and "Blinkit" automatically categorize as `groceries`.
