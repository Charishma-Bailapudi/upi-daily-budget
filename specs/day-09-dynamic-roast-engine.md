# Specification: Dynamic Contextual Roast Engine & Spending Alerts

## 1. Overview & Objective

Transform static bot spending notifications into an adaptive, context-aware roasting mechanism. When a simulated UPI transaction succeeds, the bot dynamically interpolates real-time financial metrics (amount, merchant, category, percentage of daily budget spent, remaining balance, and deficit) into varying comedic templates and punchlines.

---

## 2. Service Architecture: `backend/src/services/roastService.js`

### 2.1 Interface Signature

```javascript
/**
 * @param {Object} ctx
 * @param {'GREEN' | 'YELLOW' | 'RED'} ctx.healthStatus - Budget health state
 * @param {number} ctx.amount - Current transaction amount (INR)
 * @param {string} ctx.merchant - Merchant or payee name
 * @param {string} ctx.category - Auto-classified transaction category
 * @param {number} ctx.totalSpent - Cumulative daily spending after this payment
 * @param {number} ctx.dailyCap - Daily budget cap for the active cycle
 * @param {number} ctx.remaining - Remaining daily allowance (can be negative if overspent)
 * @returns {string} Fully interpolated dynamic roast message
 */
function getRoast(ctx): string
```

### 2.2 Calculated Variables

Before template selection, the service must derive:

- `percentSpent`: $\lfloor (\text{totalSpent} / \text{dailyCap}) \times 100 \rfloor$ (default to `100` if `dailyCap <= 0`).
- `deficit`: $\lvert \text{remaining} \rvert$ when $\text{remaining} < 0$.

---

## 3. Tiered Roast Matrices

### 3.1 Tier GREEN ($\le 70\%$ of Daily Allowance)

- **Tone**: Playful skepticism, mock encouragement, cautionary optimism.
- **Dynamic Elements**: References the transaction amount, remaining allowance, and reminds the user not to get overconfident.
- **Template Pool**:
  - `"Spent ₹{amount} at {merchant}? Look at you staying under budget. Don't let this tiny win get to your head."`
  - `"Only ₹{amount} at {merchant}? Your wallet is actually smiling for once. You still have ₹{remaining} left today."`
  - `"Responsible adulting detected: ₹{amount} spent on {category}. Still in the safe zone with ₹{remaining} remaining. Don't blow it now!"`
  - `"A rare sight! ₹{remaining} surplus remaining. Is this self-control or did your card decline on something bigger?"`

### 3.2 Tier YELLOW ($71\% - 99\%$ of Daily Allowance)

- **Tone**: Sarcastic warning, high alert, urgent spending brake.
- **Dynamic Elements**: Highlights `percentSpent` and small `remaining` buffer.
- **Template Pool**:
  - `"₹{amount} at {merchant}? You've burned through {percentSpent}% of today's cap. One more impulse buy and dinner is water and sleep."`
  - `"Careful! You only have ₹{remaining} left for the day. {merchant} was nice, but your bank account is sweating right now."`
  - `"Warning lights flashing 🟡: Spent ₹{totalSpent} out of ₹{dailyCap}. Stop treating {merchant} like an emergency necessity."`
  - `"You are now operating at {percentSpent}% of your daily allowance. Proceed with caution unless you enjoy instant noodles."`

### 3.3 Tier RED ($\ge 100\%$ of Daily Allowance / Overspent)

- **Tone**: Ruthless, comedic financial roast, crisis intervention.
- **Dynamic Elements**: Emphasizes the exact deficit amount ($\lvert \text{remaining} \rvert$) and catastrophic percentages.
- **Template Pool**:
  - `"🚨 Budget completely annihilated! ₹{amount} at {merchant} shoved you into a ₹{deficit} deficit. Delete your UPI app right now."`
  - `"Congratulations! You've officially spent {percentSpent}% of your daily limit today. Your future self is actively filing a grievance against you."`
  - `"₹{totalSpent} spent today against a ₹{dailyCap} cap. Was {merchant} really worth your financial peace of mind?"`
  - `"Budget breached by ₹{deficit}. If reckless spending was an Olympic sport, you'd take home the gold medal today."`
  - `"You just gave {merchant} ₹{amount} that you literally did not have. May your remaining balance rest in peace."`

### 3.4 Category Punchline Modifiers

For high-severity transactions (`YELLOW` or `RED`), the engine may probabilistically append category-specific quips:

- **Food**: `"Your stomach is happy, but your bank statement is in mourning."`
- **Shopping**: `"Retail therapy won't fix this, but a budget check might."`
- **Entertainment**: `"Hope that dopamine hit lasts until your next paycheck."`
- **Travel**: `"Traveling in style while your savings balance travels downhill."`
- **Utilities**: `"Paying the bills hurts, but overshooting the daily cap hurts more."`

---

## 4. Controller Integration (`upiController.js`)

1. Retrieve the updated `DailyBudget` and newly persisted `Transaction`.
2. Construct the alert payload only if `user.telegramChatId` is truthy:
   ```javascript
   const roastText = roastService.getRoast({
     healthStatus: updatedBudget.healthStatus,
     amount: transaction.amount,
     merchant: transaction.merchant,
     category: transaction.category,
     totalSpent: updatedBudget.totalSpent,
     dailyCap: updatedBudget.dailyCap,
     remaining: updatedBudget.remainingBalance,
   });
   ```
3. Format the Telegram message using Markdown:

   ```text
   💸 *Payment Alert:* ₹{amount} at *{merchant}*
   🏷️ *Category:* {category}

   📊 *Today's Budget Status:*
   • Spent Today: ₹{totalSpent} / ₹{dailyCap}
   • Remaining: ₹{remaining} ({STATUS_EMOJI})

   🔥 *Roast:*
   "{roastText}"
   ```

4. Dispatch via `telegramService.sendMessage(user.telegramChatId, text, 'Markdown')` inside an unawaited or `.catch()`-guarded block to preserve fast payment API response times.

---

## 5. Acceptance Criteria

- [ ] Calling `getRoast()` with identical inputs across multiple runs produces varied outputs from the template pool.
- [ ] Output strings properly interpolate `amount`, `merchant`, `percentSpent`, and `remaining` without `NaN` or `undefined`.
- [ ] Payments breaching the daily cap display absolute values for deficits (e.g., `₹200 deficit` rather than `₹-200`).
- [ ] If the Telegram dispatch fails (e.g., network drop, bot blocked), the HTTP payment response still returns `200 OK` with `{ success: true }`.
