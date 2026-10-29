const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const DailyBudget = require("../models/DailyBudget");

const MAX_ANALYTICS_DAYS = 365;

function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

async function getSpendingAnalytics(userId, days = 7) {
  if (!Number.isInteger(days) || days < 1 || days > MAX_ANALYTICS_DAYS) {
    throw new TypeError(
      `days must be an integer between 1 and ${MAX_ANALYTICS_DAYS}`,
    );
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new TypeError("A valid userId is required");
  }

  const objectUserId = new mongoose.Types.ObjectId(userId);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [aggregatedResults, trackedBudgets] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          userId: objectUserId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryDocument",
        },
      },
      {
        $unwind: {
          path: "$categoryDocument",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalSpent: { $sum: "$amount" },
                transactionCount: { $sum: 1 },
              },
            },
          ],
          categories: [
            {
              $group: {
                _id: { $ifNull: ["$categoryDocument.name", "Other"] },
                amount: { $sum: "$amount" },
              },
            },
            { $sort: { amount: -1, _id: 1 } },
          ],
          merchants: [
            {
              $group: {
                _id: { $ifNull: ["$merchant", "Unknown"] },
                amount: { $sum: "$amount" },
              },
            },
            { $sort: { amount: -1, _id: 1 } },
            { $limit: 1 },
          ],
        },
      },
    ]),
    DailyBudget.find({
      userId: objectUserId,
      createdAt: { $gte: startDate },
    })
      .select("status")
      .lean(),
  ]);

  const aggregation = aggregatedResults[0] || {};
  const totals = aggregation.totals?.[0] || {};
  const totalSpent = Number.isFinite(totals.totalSpent) ? totals.totalSpent : 0;
  const transactionCount = Number.isInteger(totals.transactionCount)
    ? totals.transactionCount
    : 0;
  const categoryBreakdown = (aggregation.categories || []).map((category) => ({
    category: category._id,
    amount: category.amount,
    percentage:
      totalSpent > 0
        ? roundToOneDecimal((category.amount / totalSpent) * 100)
        : 0,
  }));
  const greenDays = trackedBudgets.filter(
    (budget) => (budget.healthStatus || budget.status) === "GREEN",
  ).length;

  return {
    periodDays: days,
    totalSpent: roundToTwoDecimals(totalSpent),
    dailyAverage: roundToTwoDecimals(totalSpent / days),
    transactionCount,
    topCategory: categoryBreakdown[0]?.category || null,
    topMerchant: aggregation.merchants?.[0]?._id || null,
    categoryBreakdown,
    budgetComplianceRate:
      trackedBudgets.length > 0
        ? roundToOneDecimal((greenDays / trackedBudgets.length) * 100)
        : 0,
  };
}

module.exports = { getSpendingAnalytics, MAX_ANALYTICS_DAYS };
