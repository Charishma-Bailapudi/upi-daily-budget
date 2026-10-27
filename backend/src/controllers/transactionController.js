const mongoose = require("mongoose");
const Category = require("../models/Category");
const DailyBudget = require("../models/DailyBudget");
const Transaction = require("../models/Transaction");
const { getOrCreateDailyBudget } = require("../utils/budgetUtils");
const { getTodayDateString } = require("../utils/dateUtils");

async function createTransaction(req, res) {
  const { amount, merchant, categoryId, note, simulatedUpiRef } = req.body || {};

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

  if (
    typeof categoryId !== "string" ||
    !mongoose.isObjectIdOrHexString(categoryId)
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

  if (
    simulatedUpiRef !== undefined &&
    (typeof simulatedUpiRef !== "string" || !simulatedUpiRef.trim())
  ) {
    return res.status(400).json({
      success: false,
      message: "simulatedUpiRef must be a non-empty string",
    });
  }

  const category = await Category.findOne({
    _id: categoryId,
    $or: [{ userId: null }, { userId: req.user._id }],
  });

  if (!category) {
    return res.status(400).json({
      success: false,
      message: "Category does not exist or is not available to this user",
    });
  }

  const date = getTodayDateString();
  await getOrCreateDailyBudget(
    req.user._id,
    date,
    req.user.defaultDailyCap,
  );

  const transaction = await Transaction.create({
    userId: req.user._id,
    categoryId: category._id,
    date,
    amount,
    merchant: merchant.trim(),
    note: note?.trim() || "",
    simulatedUpiRef: simulatedUpiRef?.trim(),
  });

  await DailyBudget.findOneAndUpdate(
    { userId: req.user._id, date },
    { $inc: { totalSpent: amount, remainingBalance: -amount } },
    { returnDocument: "after", runValidators: true },
  );

  const budget = await DailyBudget.findOneAndUpdate(
    { userId: req.user._id, date },
    [
      {
        $set: {
          status: {
            $switch: {
              branches: [
                {
                  case: { $lte: ["$remainingBalance", 0] },
                  then: "RED",
                },
                {
                  case: {
                    $lt: [
                      "$remainingBalance",
                      { $multiply: ["$dailyCap", 0.2] },
                    ],
                  },
                  then: "YELLOW",
                },
              ],
              default: "GREEN",
            },
          },
        },
      },
    ],
    { returnDocument: "after", updatePipeline: true },
  );

  return res.status(201).json({ success: true, transaction, budget });
}

async function getTodayTransactions(req, res) {
  const transactions = await Transaction.find({
    userId: req.user._id,
    date: getTodayDateString(),
  })
    .populate("categoryId", "name icon color")
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, transactions });
}

module.exports = { createTransaction, getTodayTransactions };
