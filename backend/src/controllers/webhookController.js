const telegramService = require("../services/telegramService");
const User = require("../models/User");
const { getOrCreateDailyBudget } = require("../utils/budgetUtils");
const { getTodayDateString } = require("../utils/dateUtils");
const analyticsService = require("../services/analyticsService");

const welcomeMessage =
  "Welcome to UPI Daily Budget!\n\nTo link your account, generate a code from your dashboard and send `/link <code>` here.\n\nAvailable commands:\n/start - Show this message\n/link <code> - Link your account\n/balance - Check today's budget\n/stats [days] - View spending analytics (e.g. /stats, /stats 30, /stats 31)";

function handleTelegramWebhook(req, res) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = req.get("x-telegram-bot-api-secret-token");

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return res.status(403).json({ error: "Unauthorized webhook source" });
  }

  res.status(200).json({ ok: true });

  processTelegramUpdate(req.body?.message).catch((error) => {
    console.error("Failed to process Telegram webhook update:", error);
  });
}

async function processTelegramUpdate(message) {
  if (!message?.chat?.id || typeof message.text !== "string") {
    return;
  }

  const chatId = message.chat.id;
  const [command, ...args] = message.text.trim().split(/\s+/);

  // Normalize command (strip @bot_name if present)
  const baseCommand = command.split("@")[0].toLowerCase();

  if (baseCommand === "/start") {
    await telegramService.sendMessage(chatId, welcomeMessage);
    return;
  }

  if (baseCommand === "/link") {
    await linkTelegramAccount(chatId, args[0]);
    return;
  }

  if (baseCommand === "/balance") {
    await sendBalance(chatId);
    return;
  }

  if (baseCommand === "/stats") {
    await sendStats(chatId, args[0]);
    return;
  }
}

async function linkTelegramAccount(chatId, code) {
  if (!code || !/^\d{6}$/.test(code)) {
    await telegramService.sendMessage(
      chatId,
      "Please provide your 6-digit code: /link 123456",
    );
    return;
  }

  const user = await User.findOne({
    telegramLinkCode: code,
    telegramLinkExpires: { $gt: new Date() },
  });

  if (!user) {
    await telegramService.sendMessage(
      chatId,
      "Invalid or expired linking code. Please generate a new one from your dashboard.",
    );
    return;
  }

  user.telegramChatId = chatId;
  user.telegramLinkCode = null;
  user.telegramLinkExpires = null;

  try {
    await user.save();
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    await telegramService.sendMessage(
      chatId,
      "This Telegram chat is already linked to another account.",
    );
    return;
  }

  await telegramService.sendMessage(
    chatId,
    "Account linked successfully! You can now use /balance to check your daily allowance.",
  );
}

async function sendBalance(chatId) {
  const user = await User.findOne({ telegramChatId: chatId });

  if (!user) {
    await telegramService.sendMessage(
      chatId,
      "Your Telegram account is not linked. Use /link <code> with a code from your dashboard.",
    );
    return;
  }

  const date = getTodayDateString("Asia/Kolkata");
  const budget = await getOrCreateDailyBudget(
    user._id,
    date,
    user.defaultDailyCap,
  );
  const statusEmoji =
    {
      GREEN: "🟢",
      YELLOW: "🟡",
      RED: "🔴",
    }[budget.status] || "🟢";

  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const report = [
    `*Today's Budget (${date})*`,
    `Daily Allowance / Cap: ${formatAmount(budget.dailyCap)}`,
    `Total Spent: ${formatAmount(budget.totalSpent)}`,
    `Remaining Allowance: ${formatAmount(budget.remainingBalance)}`,
    `Health Status: ${statusEmoji} ${budget.status}`,
  ].join("\n");

  await telegramService.sendMessage(chatId, report);
}

async function sendStats(chatId, daysArg) {
  const user = await User.findOne({ telegramChatId: chatId });

  if (!user) {
    await telegramService.sendMessage(
      chatId,
      "Your Telegram account is not linked. Use /link <code> with a code from your dashboard.",
    );
    return;
  }

  // Parse days: default 7, allow any number between 1 and 90 (e.g., 30, 31)
  let days = 7;
  if (daysArg && !isNaN(daysArg)) {
    const parsed = parseInt(daysArg, 10);
    if (parsed >= 1 && parsed <= 90) {
      days = parsed;
    }
  }

  try {
    const analytics = await analyticsService.getSpendingAnalytics(
      user._id,
      days,
    );

    const formatAmount = (amount) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(amount || 0);

    const categoryLines =
      analytics.categoryBreakdown && analytics.categoryBreakdown.length > 0
        ? analytics.categoryBreakdown
            .map(
              (item) =>
                `• *${item.category}*: ${formatAmount(item.amount)} (${item.percentage}%)`,
            )
            .join("\n")
        : "• No transactions recorded in this period.";

    const report = [
      `📊 *Spending Analytics (Last ${days} Days)*`,
      "",
      `💰 *Total Spent:* ${formatAmount(analytics.totalSpent)}`,
      `📉 *Daily Average:* ${formatAmount(analytics.dailyAverage)}/day`,
      `🎯 *Budget Discipline:* ${analytics.budgetComplianceRate ?? 100}% green days`,
      `🧾 *Transactions:* ${analytics.transactionCount || 0}`,
      "",
      `🏷️ *Top Categories:*`,
      categoryLines,
      "",
      `💡 Check today's allowance anytime using /balance.`,
    ].join("\n");

    await telegramService.sendMessage(chatId, report);
  } catch (error) {
    console.error("Error executing /stats command:", error);
    await telegramService.sendMessage(
      chatId,
      "⚠️ Unable to generate analytics report at this moment. Please try again shortly.",
    );
  }
}

module.exports = { handleTelegramWebhook };
