const path = require("node:path");
const assert = require("node:assert/strict");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mongoose = require("mongoose");
const { DailyBudget } = require("./src/models");

async function testDailyBudgetDuplicatePrevention() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  const userId = new mongoose.Types.ObjectId();
  const date = new Date(Date.now() + 330 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await DailyBudget.init();

    const snapshot = {
      userId,
      date,
      dailyCap: 3300,
      totalSpent: 0,
      remainingBalance: 3300,
    };

    await DailyBudget.create(snapshot);

    await assert.rejects(DailyBudget.create(snapshot), (error) => {
      assert.equal(
        error.code,
        11000,
        "Expected MongoDB duplicate key error code 11000",
      );
      return true;
    });

    console.log(
      "Day 04 passed: duplicate daily budget snapshot rejected with code 11000.",
    );
  } finally {
    if (mongoose.connection.readyState === 1) {
      try {
        await DailyBudget.deleteMany({ userId, date });
      } finally {
        await mongoose.disconnect();
      }
    }
  }
}

testDailyBudgetDuplicatePrevention().catch((error) => {
  console.error("Day 04 test failed:", error);
  process.exitCode = 1;
});
