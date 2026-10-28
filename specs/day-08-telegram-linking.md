# Specification: Day 08 — Telegram Account Linking & Commands

## 1. Objective

Enable users to link their web application account to their Telegram chat via a one-time 6-digit expiring code, and provide a `/balance` command to query today's budget status on demand.

---

## 2. Data Model Changes (`User.js`)

Add the following fields to the `User` schema:

- `telegramChatId`: `{ type: Number, unique: true, sparse: true, default: null }`
- `telegramLinkCode`: `{ type: String, default: null }`
- `telegramLinkExpires`: `{ type: Date, default: null }`

---

## 3. Endpoints & Flow

### A. Generate Link Code (`POST /api/v1/auth/telegram-code`)

- **Auth**: Protected route (`authMiddleware` required).
- **Logic**:
  - Generate a secure random 6-digit numeric string (e.g., `Math.floor(100000 + Math.random() * 900000).toString()`).
  - Set expiration to 10 minutes from now (`Date.now() + 10 * 60 * 1000`).
  - Save `telegramLinkCode` and `telegramLinkExpires` to the authenticated user.
  - Return `{ success: true, code: "123456", expiresInMinutes: 10 }`.

### B. Telegram Inbound Commands (`webhookController.js`)

1. **`/link <code>`**:
   - Extract code argument from text.
   - If argument missing: Reply with usage instructions (`"Please provide your 6-digit code: /link 123456"`).
   - Find user where `telegramLinkCode === code` and `telegramLinkExpires > Date.now()`.
   - If no valid match: Reply `"Invalid or expired linking code. Please generate a new one from your dashboard."`.
   - If matched:
     - Set `user.telegramChatId = chatId`.
     - Clear `user.telegramLinkCode = null` and `user.telegramLinkExpires = null`.
     - Save user.
     - Send success reply: `"Account linked successfully! You can now use /balance to check your daily allowance."`

2. **`/balance`**:
   - Look up user by `telegramChatId === chatId`.
   - If not found: Reply `"Your Telegram account is not linked. Use /link <code> with a code from your dashboard."`
   - If found:
     - Find or calculate today's `DailyBudget` for this user (using Asia/Kolkata date).
     - Format a markdown report:
       - Today's Allowance / Cap
       - Total Spent
       - Remaining Allowance
       - Health Status badge (`GREEN` 🟢, `YELLOW` 🟡, `RED` 🔴)
     - Dispatch via `telegramService.sendMessage(chatId, message)`.

---

## 4. Done When

- Calling `POST /api/v1/auth/telegram-code` returns a 6-digit code.
- Sending `/link <code_here>` to the bot replies confirming successful linkage.
- Sending `/balance` in Telegram returns accurate budget figures and health status.
