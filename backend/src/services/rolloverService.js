const { User, DailyBudget } = require("../models");
const telegramService = require("./telegramService");
const { getOrCreateDailyBudget } = require("../utils/budgetUtils");
const { getTodayDateString } = require("../utils/dateUtils");

function getYesterdayDateString(todayDate) {
  const [year, month, day] = todayDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1))
    .toISOString()
    .slice(0, 10);
}

const formatAmount = (amount) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(amount);

function createMorningRecap(yesterdayBudget, todayBudget) {
  if (!yesterdayBudget) {
    return [
      "🌅 *Good Morning! Here is your Daily Budget Kickoff*",
      "",
      "*Yesterday's Recap:*",
      "• No budget was recorded yesterday.",
      "",
      "*Today's Budget:*",
      `• Allowance for Today: ₹${formatAmount(todayBudget.dailyCap)}`,
      "• Status: 🟢 Fresh Start",
      "",
      "💡 Remember: Log your payments using the UPI simulator or check /balance anytime!",
    ].join("\n");
  }

  const remaining = yesterdayBudget.remainingBalance;
  const outcome =
    remaining > 0
      ? `Saved ₹${formatAmount(remaining)} 🟢`
      : remaining < 0
        ? `Overspent by ₹${formatAmount(Math.abs(remaining))} 🔴`
        : "Used the full allowance ⚪";

  return [
    "🌅 *Good Morning! Here is your Daily Budget Kickoff*",
    "",
    "*Yesterday's Recap:*",
    `• Spent: ₹${formatAmount(yesterdayBudget.totalSpent)} / ₹${formatAmount(yesterdayBudget.dailyCap)}`,
    `• Outcome: ${outcome}`,
    "",
    "*Today's Budget:*",
    `• Allowance for Today: ₹${formatAmount(todayBudget.dailyCap)}`,
    "• Status: 🟢 Fresh Start",
    "",
    "💡 Remember: Log your payments using the UPI simulator or check /balance anytime!",
  ].join("\n");
}

async function finalizeYesterdayBudget(user, yesterdayDate) {
  const yesterdayBudget = await DailyBudget.findOne({
    userId: user._id,
    date: yesterdayDate,
  });

  if (!yesterdayBudget) {
    return null;
  }

  const finalizedBudget = await DailyBudget.findOneAndUpdate(
    { _id: yesterdayBudget._id, status: { $ne: "CLOSED" } },
    { $set: { status: "CLOSED" } },
    { returnDocument: "after", runValidators: true },
  );

  if (finalizedBudget && yesterdayBudget.remainingBalance > 0) {
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $inc: { savingsPotBalance: yesterdayBudget.remainingBalance } },
      { returnDocument: "after", runValidators: true },
    );

    if (!updatedUser) {
      throw new Error(`User ${user._id} was not found while crediting savings`);
    }
  }

  return yesterdayBudget;
}

async function initializeUserDailyBudget(user, todayDate) {
  const yesterdayDate = getYesterdayDateString(todayDate);
  const yesterdayBudget = await finalizeYesterdayBudget(user, yesterdayDate);
  const todayBudget = await getOrCreateDailyBudget(
    user._id,
    todayDate,
    user.defaultDailyCap,
  );

  return { yesterdayBudget, todayBudget };
}

async function recoverUserDailyBudget(user, todayDate) {
  const { todayBudget } = await initializeUserDailyBudget(user, todayDate);
  return todayBudget;
}

async function processUserRollover(user, todayDate) {
  const { yesterdayBudget, todayBudget } = await initializeUserDailyBudget(
    user,
    todayDate,
  );

  if (user.telegramChatId) {
    const message = createMorningRecap(yesterdayBudget, todayBudget);
    await telegramService.sendMessage(user.telegramChatId, message, "Markdown");
  }
}

async function executeDailyRollover() {
  const todayDate = getTodayDateString("Asia/Kolkata");
  const users = await User.find({});
  const stats = {
    totalUsersProcessed: users.length,
    successCount: 0,
    failedCount: 0,
  };

  for (const user of users) {
    try {
      await processUserRollover(user, todayDate);
      stats.successCount += 1;
    } catch (error) {
      stats.failedCount += 1;
      console.error(`Failed daily rollover for user ${user._id}:`, error);
    }
  }

  return stats;
}

module.exports = { executeDailyRollover, recoverUserDailyBudget };
