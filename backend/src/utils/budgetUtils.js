const DailyBudget = require("../models/DailyBudget");

async function getOrCreateDailyBudget(userId, date, dailyCap) {
  const filter = { userId, date };
  const initialBudget = {
    userId,
    date,
    dailyCap,
    totalSpent: 0,
    remainingBalance: dailyCap,
    status: "GREEN",
  };

  try {
    return await DailyBudget.findOneAndUpdate(
      filter,
      { $setOnInsert: initialBudget },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    );
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    const budget = await DailyBudget.findOne(filter);

    if (!budget) {
      throw error;
    }

    return budget;
  }
}

module.exports = { getOrCreateDailyBudget };
