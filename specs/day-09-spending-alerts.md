# Specification: Day 09 — Telegram Spending Alerts & Real-Time Roast Delivery

## 1. Objective

Whenever a user completes a transaction through the UPI simulator, automatically deliver an immediate Telegram notification to their linked account with transaction details, updated daily balance, and a humorous roast matching their budget health.

---

## 2. Roast Tone & Health Mapping (`roastService.js`)

The service should select or generate a witty roast depending on the user's `healthStatus`:

- **GREEN (Spent <= 70% of Daily Allowance)**:
  - Playful encouragement or mild teasing.
  - _Example_: "Look at you, staying responsible. Your wallet might actually survive the week."
- **YELLOW (Spent 71% - 99% of Daily Allowance)**:
  - Cautionary, sarcastic warning.
  - _Example_: "Danger zone entered! One more iced latte and your dinner is instant noodles."

- **RED (Spent >= 100% of Daily Allowance / Overspent)**:
  - Ruthless roast regarding their financial discipline.
  - _Example_: "Congratulations! You have successfully obliterated today's budget. Delete your food delivery apps immediately."

---

## 3. Integration Flow (`upiController.js`)

1. A payment is submitted to `POST /api/v1/upi/pay`.
2. Existing logic:
   - Verifies UPI PIN.
   - Categorizes merchant.
   - Atomically updates `DailyBudget` using `$inc`.
   - Records the `Transaction`.
3. **Day 9 Addition**:
   - Check if `user.telegramChatId` exists.
   - If linked:
     - Generate contextual roast based on the updated `healthStatus`.
     - Construct a Markdown/HTML Telegram alert:

       ```text
       💸 Payment Alert: ₹{amount} to {merchantName} ({category})

       📊 Today's Budget Status:
       • Spent Today: ₹{totalSpent} / ₹{dailyCap}
       • Remaining: ₹{remainingBalance} [{STATUS_EMOJI}]

       🔥 Roast:
       "{roastText}"
       ```

     - Fire `telegramService.sendMessage(user.telegramChatId, alertMessage)` in a non-blocking asynchronous call (`.catch()` handles any network failure so the UPI API response itself never fails).

---

## 4. Done When

- A payment processed via `POST /api/v1/upi/pay` returns `{ success: true }`.
- Within 1–2 seconds, the linked Telegram chat receives the alert message with live figures and the roast.
- If the account is unlinked, the payment succeeds normally without errors.
