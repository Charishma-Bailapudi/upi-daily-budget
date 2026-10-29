const assert = require("node:assert/strict");
const Transaction = require("../src/models/Transaction");
const { getTransactions } = require("../src/controllers/upiController");
const upiRoutes = require("../src/routes/upiRoutes");
const { protect } = require("../src/middlewares/authMiddleware");

function makeResponse() {
  return {
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
  };
}

async function runTests() {
  const originalFind = Transaction.find;

  try {
    const transactionsRoute = upiRoutes.stack.find(
      (layer) => layer.route?.path === "/transactions",
    );
    assert.ok(transactionsRoute?.route.methods.get);
    assert.ok(
      transactionsRoute.route.stack.some((handler) => handler.handle === protect),
    );

    let capturedFilter;
    const calls = [];
    Transaction.find = (filter) => {
      capturedFilter = filter;
      const query = {
        select(value) {
          calls.push(["select", value]);
          return this;
        },
        populate(path, fields) {
          calls.push(["populate", path, fields]);
          return this;
        },
        sort(value) {
          calls.push(["sort", value]);
          return this;
        },
        skip(value) {
          calls.push(["skip", value]);
          return this;
        },
        limit(value) {
          calls.push(["limit", value]);
          return this;
        },
        lean: async () => [
          {
            _id: "transaction-id",
            amount: 125,
            merchant: "Chai Point",
            categoryId: { name: "Food" },
            createdAt: new Date("2026-10-29T05:00:00.000Z"),
            userId: "should-not-be-returned",
          },
        ],
      };
      return query;
    };

    const response = makeResponse();
    await getTransactions(
      { query: { limit: "10", page: "2" }, user: { _id: "user-id" } },
      response,
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(capturedFilter, { userId: "user-id" });
    assert.deepEqual(calls, [
      ["select", "_id amount merchant categoryId createdAt"],
      ["populate", "categoryId", "name"],
      ["sort", { createdAt: -1 }],
      ["skip", 10],
      ["limit", 10],
    ]);
    assert.deepEqual(response.body, {
      success: true,
      count: 1,
      transactions: [
        {
          _id: "transaction-id",
          amount: 125,
          merchant: "Chai Point",
          category: "Food",
          createdAt: new Date("2026-10-29T05:00:00.000Z"),
        },
      ],
    });

    const defaultResponse = makeResponse();
    await getTransactions(
      { query: {}, user: { _id: "user-id" } },
      defaultResponse,
    );
    assert.equal(defaultResponse.statusCode, 200);
    assert.equal(calls.at(-1)[1], 10);
    assert.equal(calls.at(-2)[1], 0);

    for (const query of [
      { limit: "0" },
      { limit: "101" },
      { page: "0" },
      { limit: "1.5" },
      { page: "nope" },
    ]) {
      const invalidResponse = makeResponse();
      await getTransactions(
        { query, user: { _id: "user-id" } },
        invalidResponse,
      );
      assert.equal(invalidResponse.statusCode, 400);
      assert.equal(invalidResponse.body.success, false);
    }
  } finally {
    Transaction.find = originalFind;
  }
}

runTests()
  .then(() => {
    console.log("Day 13 transaction history tests passed.");
  })
  .catch((error) => {
    console.error("Day 13 transaction history tests failed:", error);
    process.exitCode = 1;
  });
