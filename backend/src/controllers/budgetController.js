const { getOrCreateDailyBudget } = require("../utils/budgetUtils");
const { getTodayDateString } = require("../utils/dateUtils");
const { executeDailyRollover } = require("../services/rolloverService");
const {
  getSpendingAnalytics,
  MAX_ANALYTICS_DAYS,
} = require("../services/analyticsService");

async function getTodayBudget(req, res) {
  const date = getTodayDateString();
  const budget = await getOrCreateDailyBudget(
    req.user._id,
    date,
    req.user.defaultDailyCap,
  );

  return res.status(200).json({ success: true, budget });
}

async function triggerManualRollover(req, res) {
  const results = await executeDailyRollover();
  return res.status(200).json({ success: true, results });
}

async function getAnalytics(req, res) {
  const requestedDays = req.query.days;
  let days = 7;

  if (requestedDays !== undefined) {
    if (typeof requestedDays !== "string" || !/^\d+$/.test(requestedDays)) {
      return res.status(400).json({
        success: false,
        message: `days must be an integer between 1 and ${MAX_ANALYTICS_DAYS}`,
      });
    }

    days = Number(requestedDays);
    if (!Number.isSafeInteger(days) || days < 1 || days > MAX_ANALYTICS_DAYS) {
      return res.status(400).json({
        success: false,
        message: `days must be an integer between 1 and ${MAX_ANALYTICS_DAYS}`,
      });
    }
  }

  const data = await getSpendingAnalytics(req.user._id, days);
  return res.status(200).json({ success: true, data });
}

module.exports = { getTodayBudget, triggerManualRollover, getAnalytics };
