# UPI Daily Budget

A full-stack budget tracker for recording simulated UPI payments, monitoring a
daily spending allowance, viewing spending analytics, and receiving optional
Telegram alerts. The application is a demo/simulator: its checkout screens do
not initiate real payments or connect to PhonePe, Google Pay, Amazon Pay, or
Razorpay.

## Contents

- [Features](#features)
- [System architecture](#system-architecture)
- [Budget, concurrency, and timezone rules](#budget-concurrency-and-timezone-rules)
- [Requirements and local setup](#requirements-and-local-setup)
- [Environment configuration](#environment-configuration)
- [API reference](#api-reference)
- [Telegram bot setup and commands](#telegram-bot-setup-and-commands)
- [Tests](#tests)
- [Project structure](#project-structure)
- [Security and operational notes](#security-and-operational-notes)

## Features

- Email/password authentication with bcrypt password hashing and JWT bearer
  tokens.
- Responsive React dashboard with a daily allowance meter, Telegram linking,
  date-range analytics, transaction history, and demo UPI checkout.
- Demo payment processing with merchant categorization, PIN verification,
  budget deductions, and optional Telegram payment alerts.
- Analytics over configurable periods from 1 to 365 days.
- IST-based daily budget snapshots and midnight rollover with savings-pot
  credit for positive unspent balances.
- Telegram `/start`, `/link`, `/balance`, and `/stats` commands.

## System architecture

```text
Browser (React 19 + Vite)
  ├─ React Router: /login and protected /
  ├─ Axios API client: attaches the saved access token to API requests
  ├─ Dashboard cards and demo UPI checkout modal
  └─ Toast feedback
          │ HTTP/JSON
          ▼
Express API (Node.js)
  ├─ JWT authentication middleware
  ├─ Auth, user, category, budget, transaction, UPI, and webhook routes
  ├─ Budget, analytics, deduction, rollover, and Telegram services
  └─ Mongoose models and indexes
          │
          ▼
MongoDB

Telegram Bot API ◄──── outbound notifications and bot replies
       │
       └────────────── inbound webhook ─────► Express API
```

The backend is an Express application under `backend/src`. `backend/server.js`
loads environment configuration, connects to MongoDB, starts the IST midnight
cron task, and listens on `PORT` (5000 by default). The frontend is a Vite
single-page application under `frontend/`; its API base URL defaults to
`http://localhost:5000/api/v1`.

The frontend stores the JWT in `localStorage` under the key `token`. The
protected route verifies it against `GET /api/v1/users/me` before rendering the
dashboard. All API requests made through the shared Axios client include the
bearer token when one is present.

Payment app selection in the checkout is presentation only. Confirming a demo
payment calls the application API, which records an internal transaction and
updates the budget; no bank, payment provider, or real UPI address is contacted.

## Budget, concurrency, and timezone rules

### Timezone

- Daily budget dates, payment dates, and rollover scheduling use
  `Asia/Kolkata` (IST).
- The daily cron is scheduled for midnight using
  `node-cron`'s `timezone: "Asia/Kolkata"` option.
- Transaction history timestamps are stored as normal MongoDB timestamps
  (UTC instants) and displayed in IST by the frontend.
- Analytics use a rolling duration of `days × 24 hours` ending at request time;
  they are not calendar-month reports.

### Budget calculations and statuses

- The standalone budget calculation utility implements:
  `floor((monthlyIncome - monthlySavingsGoal) / daysInMonth)`.
  The current user model and dashboard use `defaultDailyCap` as the daily cap;
  this utility is not wired to monthly-income fields in the current account
  flow.
- A new daily budget snapshot starts with `totalSpent = 0` and
  `remainingBalance = dailyCap`.
- Status thresholds after spending are:
  - `GREEN`: remaining balance is at least 20% of the daily cap.
  - `YELLOW`: remaining balance is positive but less than 20% of the cap.
  - `RED`: remaining balance is zero or below.
  - `CLOSED`: the previous day's snapshot has been finalized by rollover.

### Concurrency guarantees and boundaries

- Daily snapshots are created with an upsert using `$setOnInsert`. A unique
  `{ userId, date }` index prevents multiple snapshots for the same user/day;
  the upsert helper handles duplicate-key races by reading the winning record.
- Payment spending counters are changed with one MongoDB `$inc` update:
  `totalSpent += amount` and `remainingBalance -= amount`. This prevents
  concurrent payment requests from overwriting one another's counter updates.
- Budget health status is calculated from the post-increment balance and saved
  when it changes. The counters are atomic; the transaction record, counter
  update, and status save are separate database operations, not one MongoDB
  transaction. A process or database failure between those operations can
  leave a transaction and its budget snapshot temporarily inconsistent.
- Rollover conditionally changes an open previous-day snapshot to `CLOSED`;
  only the request that successfully closes it credits positive leftover
  balance through `$inc` on `savingsPotBalance`. Snapshot closure, savings
  credit, and creation of today's snapshot are separate operations, not a
  multi-document transaction. Monitor and reconcile failures for production
  financial use.
- Payment transaction references are generated uniquely by the simulator and
  stored with a sparse unique index. They are not an idempotency key supplied
  by a client.

## Requirements and local setup

- Node.js compatible with the package dependencies (use an active LTS release).
- npm.
- MongoDB connection string for a running MongoDB deployment.
- Optional Telegram bot token and webhook secret if Telegram integration is
  enabled.

Install dependencies in each application:

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

Create `backend/.env` using the variables in
[Environment configuration](#environment-configuration). Do not commit this
file or expose its values.

Seed the shared default categories once the database is available:

```powershell
cd backend
node src/scripts/seedCategories.js
```

Start the API and frontend in separate terminals:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

By default, Vite serves the frontend on `http://localhost:5173` and the API on
`http://localhost:5000`. Open the Vite URL and sign in. Accounts can be created
through the registration API; the current frontend provides a login page and
dashboard, not a registration page.

For a production frontend deployment, build and serve the static bundle:

```powershell
cd frontend
npm run build
npm run preview
```

Set `VITE_API_BASE_URL` to the public API base URL at build time when it differs
from the local default.

## Environment configuration

| Variable | Required | Purpose |
|---|---:|---|
| `MONGODB_URI` | Yes | MongoDB connection string. |
| `JWT_SECRET` | Yes | Secret used to sign and verify authentication JWTs. Use a long, unique, randomly generated value. |
| `JWT_EXPIRES_IN` | Yes | JWT lifetime accepted by `jsonwebtoken` (for example, `1d`). |
| `PORT` | No | API listening port; defaults to `5000`. |
| `CLIENT_URL` | No | Allowed frontend origin for CORS; defaults to `http://localhost:5173`. |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram Bot API token used for outbound messages and webhook setup. |
| `TELEGRAM_WEBHOOK_SECRET` | Optional | Secret expected in Telegram's `X-Telegram-Bot-Api-Secret-Token` webhook header. |
| `VITE_API_BASE_URL` | No | Frontend API base URL; defaults to `http://localhost:5000/api/v1`. |

`backend/server.js` loads dotenv before starting the API. Never place secrets in
frontend variables: Vite variables are bundled into browser code. Do not commit
`.env` files.

## API reference

All routes below are prefixed with `/api/v1`, except `/health` and `/`. Routes
marked **Bearer** require `Authorization: Bearer <JWT>`. JSON endpoints accept
and return JSON.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/health` | Public | Basic API health response. |
| `GET` | `/` | Public | API status and current server time. |
| `POST` | `/auth/register` | Public | Create an account and return a JWT and public user profile. |
| `POST` | `/auth/login` | Public | Authenticate with email/password and return a JWT. |
| `POST` | `/auth/telegram-code` | Bearer | Generate a six-digit Telegram account-link code, valid for 10 minutes. |
| `GET` | `/users/me` | Bearer | Return the authenticated user's public profile and Telegram-linked status. |
| `GET` | `/categories` | Bearer | List shared categories and categories owned by the authenticated user. |
| `GET` | `/budgets/today` | Bearer | Get or initialize today's IST budget snapshot. |
| `GET` | `/budgets/analytics?days=7` | Bearer | Return spending aggregates for 1–365 rolling days; defaults to 7. |
| `POST` | `/budgets/trigger-rollover` | Bearer | Manually run rollover for **all users**; restrict operational access. |
| `POST` | `/transactions` | Bearer | Create a transaction from an explicit accessible category ID and update today's budget. |
| `GET` | `/transactions/today` | Bearer | List today's transactions, newest first, with populated category details. |
| `POST` | `/upi/pay` | Bearer | Verify the demo PIN, categorize and record a simulated payment, and deduct the budget. |
| `GET` | `/upi/transactions?limit=10&page=1` | Bearer | List recent transactions, newest first; limit is 1–100, default 10. |
| `POST` | `/webhook/telegram` | Telegram secret header | Accept Telegram bot updates and dispatch supported commands. |

### Common request examples

Register:

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Example User",
  "email": "user@example.com",
  "password": "<account-password>",
  "upiId": "user@upi",
  "defaultDailyCap": 1200
}
```

Login:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "<account-password>"
}
```

Authenticated simulated payment:

```http
POST /api/v1/upi/pay
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "amount": 250,
  "merchant": "Cafe",
  "upiPin": "<four-digit-demo-pin>"
}
```

Analytics:

```http
GET /api/v1/budgets/analytics?days=31
Authorization: Bearer <JWT>
```

Payment PIN failures return HTTP `401` with `error: "INCORRECT_PIN"` and a
generic retry message. Invalid request formats generally return HTTP `400`.
Missing, invalid, or expired bearer tokens return HTTP `401`. The global error
handler returns a generic `500` message for unexpected server errors and
returns `409` for duplicate unique values.

The demo PIN is a bcrypt hash stored on the user record and is not included in
public user responses. The checkout app selector is cosmetic and does not
change server-side payment processing.

## Telegram bot setup and commands

### Linking a Telegram account

1. Configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` on the backend.
2. Deploy the backend to a public HTTPS URL and register the Telegram webhook
   with Telegram's `setWebhook` API. The webhook path is
   `https://<api-host>/api/v1/webhook/telegram`; configure Telegram to send the
   matching secret-token header.
3. Sign in to the dashboard and generate a Telegram linking code.
4. Open the bot chat and send `/link <code>` before the code expires.
5. After linking, simulated payment alerts and scheduled daily recaps can be
   sent to that Telegram chat.

Outbound Telegram Bot API calls do not require a tunnel. Telegram must be able
to reach the backend for inbound bot commands. For local webhook development,
use a temporary HTTPS tunnel and register its public URL; a tunnel is not
needed for dashboard-only work or outbound-only notification testing.

### Commands

| Command | Behavior |
|---|---|
| `/start` | Show welcome text and supported commands. |
| `/link <code>` | Link the current Telegram chat using an unexpired six-digit code. |
| `/balance` | Show today's IST allowance, spent amount, remaining balance, and status. |
| `/stats` | Show analytics for the last 7 days. |
| `/stats <days>` | Show analytics for a supported integer period from 1 to 90 days. |

Bot commands may include a bot username suffix, such as `/stats@YourBot`.
Currently, the Telegram `/stats` command accepts up to 90 days, even though the
REST analytics endpoint accepts up to 365 days.

## Tests

Run the backend Jest and Supertest suite:

```powershell
cd backend
npm test
```

The script runs Jest serially with open-handle detection. The current suites
cover authentication and Telegram code generation, payment PIN validation and
atomic budget increments, rollover behavior, and analytics/empty periods.
Database models and external Telegram calls are mocked; this suite does not
require a live MongoDB instance or contact Telegram.

Existing focused test scripts can also be run directly:

```powershell
node tests/day05.test.js
node tests/day09.test.js
node tests/day11.test.js
node tests/day13.test.js
```

Build the frontend:

```powershell
cd frontend
npm run build
```

## Project structure

```text
.
├── backend/
│   ├── server.js                  # Loads configuration, connects DB, starts cron and HTTP server
│   ├── src/
│   │   ├── app.js                 # Express middleware and route mounting
│   │   ├── config/db.js           # Mongoose connection
│   │   ├── controllers/           # HTTP handlers for auth, budgets, payments, etc.
│   │   ├── middlewares/           # JWT authentication
│   │   ├── models/                # User, Category, DailyBudget, Transaction schemas
│   │   ├── routes/                # Versioned API route modules
│   │   ├── scripts/               # Database/category setup scripts
│   │   ├── services/              # Payment, analytics, Telegram, cron, rollover logic
│   │   └── utils/                 # Date and budget snapshot helpers
│   └── tests/                     # Jest integration-style tests and focused scripts
├── frontend/
│   ├── index.html
│   └── src/
│       ├── App.jsx                # Browser routes and toast provider
│       ├── components/            # Dashboard cards, checkout, keypad, toast UI
│       ├── lib/api.js             # Axios instance and bearer-token interceptor
│       └── pages/                 # Login and dashboard views
├── docs/                          # Architecture and learning guides
├── specs/                         # Day-by-day project specifications
├── CLAUDE.md                      # Project invariants and directory conventions
└── README.md
```

## Security and operational notes

- Use HTTPS in production and protect JWT, MongoDB, and Telegram credentials.
- Keep secrets on the backend; never put them in Vite environment variables or
  commit them to source control.
- The demo UPI PIN is not a real bank credential. Do not reuse a banking PIN.
  The payment endpoint is a simulator, not a financial authorization system.
- The manual rollover endpoint is protected by user authentication but has no
  role-based administrator check. It runs rollover for every user; do not make
  it available as a normal end-user action in a production deployment.
- Multi-document payment and rollover changes are not wrapped in MongoDB
  transactions. The current atomic operators protect the individual counter
  and savings updates, but do not provide all-or-nothing behavior across
  transaction creation, budget update, status changes, and rollover.
- Telegram webhook requests are authenticated with Telegram's secret-token
  header. Use a strong private value and configure the same value with
  Telegram.
- Review CORS (`CLIENT_URL`), rate limits, monitoring, backups, audit logging,
  and role-based operations controls before exposing the service publicly.
