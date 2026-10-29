# Specification: Day 10 — Midnight Rollover Cron & Daily Summary Report

## 1. Objective

Automate the daily financial boundary at midnight IST:

1. Finalize yesterday's `DailyBudget`.
2. Compute rollover: Record unspent amounts as savings or carry forward deficits.
3. Initialize today's fresh `DailyBudget`.
4. Deliver an automated Telegram "Day in Review" + "Today's Allowance Kickoff" report to all linked users.

---

## 2. Scheduling & Timezone

- **Cron Pattern**: `0 0 * * *` (Runs every day at 00:00:00).
- **Timezone**: `Asia/Kolkata`.
- **Manual Trigger Endpoint**: `POST /api/v1/budgets/trigger-rollover` (protected by auth, for development and verification).

---

## 3. Rollover Algorithm (`rolloverService.js`)

For each active user:

1. Identify **yesterday's date string** (`YYYY-MM-DD` in `Asia/Kolkata`).
2. Retrieve yesterday's `DailyBudget`:
   - If `remainingBalance > 0`: Mark `status = 'CLOSED'`, surplus is saved.
   - If `remainingBalance < 0`: Record deficit.
3. Calculate/generate **today's `DailyBudget`**:
   - Compute base daily allowance: $\lfloor (\text{monthlyIncome} - \text{monthlySavingsGoal}) / \text{daysInMonth} \rfloor$.
   - Save the record with `date = todayStr`, `totalSpent = 0`, `remainingBalance = dailyCap`, `healthStatus = 'GREEN'`.
4. If user has `telegramChatId`:
   - Construct summary message:

     ```text
     🌅 *Good Morning! Here is your Daily Budget Kickoff*

     📊 *Yesterday's Recap:*
     • Spent: ₹{yesterdaySpent} / ₹{yesterdayCap}
     • Outcome: {Saved ₹{surplus} 🟢 | Overspent by ₹{deficit} 🔴}

     🎯 *Today's Budget:*
     • Allowance for Today: ₹{todayCap}
     • Status: 🟢 Fresh Start

     💡 Remember: Log your payments using the UPI simulator or check /balance anytime!
     ```

   - Dispatch via `telegramService.sendMessage(user.telegramChatId, text, 'Markdown')`.

---

## 4. Done When

- Running manual trigger `POST /api/v1/budgets/trigger-rollover` processes all users without errors.
- Today's new `DailyBudget` record is created in MongoDB.
- Linked Telegram account receives the formatted morning recap and daily kickoff message.
- Cron job initializes automatically when the Node.js backend starts.
