const { getOrCreateDailyBudget } = require("../utils/budgetUtils");
const { getTodayDateString } = require("../utils/dateUtils");

async function getTodayBudget(req, res) {
  const date = getTodayDateString();
  const budget = await getOrCreateDailyBudget(
    req.user._id,
    date,
    req.user.defaultDailyCap,
  );

  return res.status(200).json({ success: true, budget });
}

module.exports = { getTodayBudget };
