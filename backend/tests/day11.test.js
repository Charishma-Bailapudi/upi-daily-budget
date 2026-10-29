const assert = require("node:assert/strict");
const Transaction = require("../src/models/Transaction");
const DailyBudget = require("../src/models/DailyBudget");
const { getSpendingAnalytics } = require("../src/services/analyticsService");
const { getAnalytics } = require("../src/controllers/budgetController");

async function runTests() {
  const originalAggregate = Transaction.aggregate;
  const originalFind = DailyBudget.find;

  try {
    const userId = "507f1f77bcf86cd799439011";
    let capturedPipeline;
    Transaction.aggregate = async (pipeline) => {
      capturedPipeline = pipeline;
      return [{ totals: [], categories: [], merchants: [] }];
    };
    DailyBudget.find = () => ({
      select() {
        return this;
      },
      lean: async () => [],
    });

    const emptyResult = await getSpendingAnalytics(userId);
    assert.deepEqual(emptyResult, {
      periodDays: 7,
      totalSpent: 0,
      dailyAverage: 0,
      transactionCount: 0,
      topCategory: null,
      topMerchant: null,
      categoryBreakdown: [],
      budgetComplianceRate: 0,
    });
    assert.equal(capturedPipeline[0].$match.userId.toString(), userId);
    assert.ok(capturedPipeline[0].$match.createdAt.$gte instanceof Date);

    Transaction.aggregate = async () => [
      {
        totals: [{ totalSpent: 500, transactionCount: 2 }],
        categories: [
          { _id: "FOOD", amount: 300 },
          { _id: "TRAVEL", amount: 200 },
        ],
        merchants: [{ _id: "Cafe", amount: 300 }],
      },
    ];
    DailyBudget.find = () => ({
      select() {
        return this;
      },
      lean: async () => [{ status: "GREEN" }, { status: "RED" }],
    });

    const populatedResult = await getSpendingAnalytics(userId, 30);
    assert.equal(populatedResult.dailyAverage, 16.67);
    assert.equal(populatedResult.transactionCount, 2);
    assert.equal(populatedResult.topCategory, "FOOD");
    assert.equal(populatedResult.topMerchant, "Cafe");
    assert.equal(populatedResult.categoryBreakdown[0].percentage, 60);
    assert.equal(populatedResult.budgetComplianceRate, 50);

    for (const days of [1, 14, 31, 90, 365]) {
      const result = await getSpendingAnalytics(userId, days);
      assert.equal(result.periodDays, days);
    }

    for (const days of [0, -1, 366, 1.5, "14"]) {
      await assert.rejects(
        getSpendingAnalytics(userId, days),
        /integer between 1 and 365/i,
      );
    }

    const makeResponse = () => ({
      statusCode: null,
      body: null,
      status(statusCode) {
        this.statusCode = statusCode;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    });

    for (const days of ["1", "14", "31", "90", "365"]) {
      const response = makeResponse();
      await getAnalytics(
        { query: { days }, user: { _id: userId } },
        response,
      );
      assert.equal(response.statusCode, 200);
      assert.equal(response.body.data.periodDays, Number(days));
    }

    const defaultResponse = makeResponse();
    await getAnalytics({ query: {}, user: { _id: userId } }, defaultResponse);
    assert.equal(defaultResponse.statusCode, 200);
    assert.equal(defaultResponse.body.data.periodDays, 7);

    for (const days of ["0", "366", "1.5", "abc", ["14"]]) {
      const response = makeResponse();
      await getAnalytics(
        { query: { days }, user: { _id: userId } },
        response,
      );
      assert.equal(response.statusCode, 400);
      assert.match(response.body.message, /integer between 1 and 365/i);
    }

    await assert.rejects(
      getSpendingAnalytics("not-a-user-id"),
      /valid userId/i,
    );
  } finally {
    Transaction.aggregate = originalAggregate;
    DailyBudget.find = originalFind;
  }
}

runTests()
  .then(() => {
    console.log("Day 11 spending analytics tests passed.");
  })
  .catch((error) => {
    console.error("Day 11 spending analytics tests failed:", error);
    process.exitCode = 1;
  });
