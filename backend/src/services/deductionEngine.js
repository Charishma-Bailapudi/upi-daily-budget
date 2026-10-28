const crypto = require("node:crypto");
const Category = require("../models/Category");
const DailyBudget = require("../models/DailyBudget");
const Transaction = require("../models/Transaction");
const { classifyMerchant } = require("./categoryClassifier");
const { getOrCreateDailyBudget } = require("../utils/budgetUtils");
const { getTodayDateString } = require("../utils/dateUtils");

const categoryNames = {
  food_dining: "FOOD",
  groceries: "GROCERIES",
  travel: "TRAVEL",
  bills: "BILLS",
  shopping: "SHOPPING",
  other: "OTHER",
};

async function processUpiPayment({
  user,
  amount,
  merchant,
  categoryId,
  note,
}) {
  let category;

  if (categoryId) {
    category = await Category.findOne({
      _id: categoryId,
      $or: [{ userId: null }, { userId: user._id }],
    });
  } else {
    const categoryName = categoryNames[classifyMerchant(merchant)];
    category = await Category.findOne({
      name: categoryName,
      $or: [{ userId: null }, { userId: user._id }],
    });
  }

  if (!category) {
    const error = new Error(
      categoryId
        ? "Category does not exist or is not available to this user"
        : "No available category matches this merchant",
    );
    error.name = "ValidationError";
    throw error;
  }

  const date = getTodayDateString("Asia/Kolkata");
  await getOrCreateDailyBudget(user._id, date, user.defaultDailyCap);

  const referenceId = `UPI-${Date.now()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
  const transaction = await Transaction.create({
    userId: user._id,
    categoryId: category._id,
    date,
    amount,
    merchant: merchant.trim(),
    note: note?.trim() || "",
    simulatedUpiRef: referenceId,
  });

  let budget = await DailyBudget.findOneAndUpdate(
    { userId: user._id, date },
    { $inc: { totalSpent: amount, remainingBalance: -amount } },
    { returnDocument: "after", runValidators: true },
  );

  const nextStatus =
    budget.remainingBalance <= 0
      ? "RED"
      : budget.remainingBalance < budget.dailyCap * 0.2
        ? "YELLOW"
        : "GREEN";

  if (budget.status !== nextStatus) {
    budget.status = nextStatus;
    budget = await budget.save();
  }

  return {
    upiStatus: "SUCCESS",
    referenceId,
    categoryName: category.name,
    transaction,
    budget,
  };
}

module.exports = { processUpiPayment };
