const mongoose = require("mongoose");
const DailyBudget = require("../models/DailyBudget");
const { processUpiPayment } = require("../services/deductionEngine");
const { getRoast } = require("../services/roastService");
const telegramService = require("../services/telegramService");
const { getTodayDateString } = require("../utils/dateUtils");

const statusPresentation = {
  GREEN: "🟢",
  YELLOW: "🟡",
  RED: "🔴",
};

const formatAmount = (amount) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(amount);

const escapeMarkdown = (value) =>
  String(value).replace(/([_*`[\]])/g, "\\$1");

function createSpendingAlert({ transaction, budget, categoryName }) {
  const healthStatus = budget.healthStatus || budget.status || "GREEN";
  const statusEmoji = statusPresentation[healthStatus] || statusPresentation.GREEN;
  const amount = transaction.amount;
  const merchant = transaction.merchant || transaction.merchantName || "Unknown";
  const category =
    transaction.category?.name ||
    transaction.category ||
    categoryName ||
    "Other";
  const roast = getRoast({
    healthStatus,
    amount,
    merchant,
    category,
    totalSpent: budget.totalSpent,
    dailyCap: budget.dailyCap,
    remaining: budget.remainingBalance,
  });

  return [
    `💸 *Payment Alert:* ₹${formatAmount(amount)} at *${escapeMarkdown(merchant)}*`,
    `🏷️ *Category:* ${escapeMarkdown(category)}`,
    "",
    "📊 *Today's Budget Status:*",
    `• Spent Today: ₹${formatAmount(budget.totalSpent)} / ₹${formatAmount(budget.dailyCap)}`,
    `• Remaining: ₹${formatAmount(budget.remainingBalance)} (${statusEmoji})`,
    "",
    "🔥 *Roast:*",
    `"${escapeMarkdown(roast)}"`,
  ].join("\n");
}

async function simulatePayment(req, res) {
  const { amount, merchant, upiPin, categoryId, note } = req.body || {};

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Amount must be a number greater than zero",
    });
  }

  if (typeof merchant !== "string" || !merchant.trim()) {
    return res.status(400).json({
      success: false,
      message: "Merchant is required",
    });
  }

  if (typeof upiPin !== "string" || !/^\d{4}(\d{2})?$/.test(upiPin)) {
    return res.status(400).json({
      success: false,
      message: "Invalid UPI PIN format. Must be 4 or 6 numeric digits.",
    });
  }

  if (
    categoryId !== undefined &&
    (typeof categoryId !== "string" ||
      !mongoose.isObjectIdOrHexString(categoryId))
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid categoryId is required",
    });
  }

  if (note !== undefined && typeof note !== "string") {
    return res.status(400).json({
      success: false,
      message: "Note must be a string",
    });
  }

  const result = await processUpiPayment({
    user: req.user,
    amount,
    merchant,
    categoryId,
    note,
  });

  if (req.user.telegramChatId) {
    Promise.resolve()
      .then(async () => {
        const transaction = result.transaction;
        const budget = await DailyBudget.findOne({
          userId: req.user._id,
          date:
            result.budget?.date ||
            getTodayDateString("Asia/Kolkata"),
        });

        if (!budget) {
          throw new Error("Updated daily budget was not found for spending alert");
        }

        const message = createSpendingAlert({
          transaction,
          budget,
          categoryName: result.categoryName,
        });

        await telegramService.sendMessage(
          req.user.telegramChatId,
          message,
          "Markdown",
        );
      })
      .catch((error) => {
        console.error("Failed to send UPI spending alert:", error);
      });
  }

  return res.status(200).json(result);
}

module.exports = { simulatePayment };
