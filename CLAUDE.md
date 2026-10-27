# Agent Instructions & Project Rules: UPI Daily Budget App

## 1. Non-Negotiable Invariants

- Timezone: All daily allocations, midnight sweeps, and cron schedules MUST use `Asia/Kolkata` (IST).
- Database: All budget updates MUST use atomic MongoDB operators (`$inc`, `$set`).
- Security: Never expose or commit secrets or `.env` files.
- Business Logic:
  - Daily limit = `floor((monthlyIncome - monthlySavingsTarget) / daysInMonth)`.
  - Unspent daily money goes to `savingsPotBalance` at night.

## 2. Directory Layout

- `/backend`: Node.js + Express API.
- `/frontend`: React JS (Vite) + Tailwind CSS.
- `/specs`: Day-by-day specifications.
