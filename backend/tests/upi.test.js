jest.mock("../src/models/User", () => ({
  findById: jest.fn(),
}));
jest.mock("../src/models/Category", () => ({
  findOne: jest.fn(),
}));
jest.mock("../src/models/DailyBudget", () => ({
  findOneAndUpdate: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock("../src/models/Transaction", () => ({
  create: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const request = require("supertest");
const User = require("../src/models/User");
const Category = require("../src/models/Category");
const DailyBudget = require("../src/models/DailyBudget");
const Transaction = require("../src/models/Transaction");
const app = require("../src/app");

const user = {
  _id: "507f1f77bcf86cd799439011",
  defaultDailyCap: 1000,
  telegramChatId: null,
};
const demoPinHash = "$2b$10$U7Y0.rca5TldBVo0Ti00qOym2ipuOJ2SmHT5ne9LbdKWenCrZ/CBO";

function createUserQuery() {
  const query = Promise.resolve(user);
  query.select = jest.fn().mockResolvedValue({ ...user, upiPin: demoPinHash });
  return query;
}

let budget;

describe("UPI payment API", () => {
  let token;

  beforeEach(() => {
    jest.clearAllMocks();
    budget = {
      _id: "607f1f77bcf86cd799439012",
      dailyCap: 1000,
      totalSpent: 0,
      remainingBalance: 1000,
      status: "GREEN",
      save: jest.fn(async function save() {
        return this;
      }),
    };
    token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    User.findById.mockImplementation(createUserQuery);
    Category.findOne.mockResolvedValue({ _id: "707f1f77bcf86cd799439013", name: "FOOD" });
    Transaction.create.mockImplementation(async (values) => ({
      _id: "807f1f77bcf86cd799439014",
      ...values,
    }));
    DailyBudget.findOneAndUpdate.mockImplementation(async (_filter, update) => {
      if (update.$inc) {
        budget.totalSpent += update.$inc.totalSpent;
        budget.remainingBalance += update.$inc.remainingBalance;
      }
      return budget;
    });
  });

  function payment(body) {
    return request(app)
      .post("/api/v1/upi/pay")
      .set("Authorization", `Bearer ${token}`)
      .send(body);
  }

  test("atomically deducts payments and transitions GREEN to YELLOW to RED", async () => {
    const first = await payment({
      amount: 100,
      merchant: "Cafe",
      upiPin: "1234",
    });
    expect(first.status).toBe(200);
    expect(first.body.budget.remainingBalance).toBe(900);
    expect(first.body.budget.status).toBe("GREEN");

    const yellow = await payment({
      amount: 750,
      merchant: "Cafe",
      upiPin: "1234",
    });
    expect(yellow.status).toBe(200);
    expect(yellow.body.budget.remainingBalance).toBe(150);
    expect(yellow.body.budget.status).toBe("YELLOW");

    const red = await payment({
      amount: 200,
      merchant: "Cafe",
      upiPin: "1234",
    });
    expect(red.status).toBe(200);
    expect(red.body.budget.remainingBalance).toBe(-50);
    expect(red.body.budget.status).toBe("RED");

    const deductions = DailyBudget.findOneAndUpdate.mock.calls
      .map(([, update]) => update.$inc)
      .filter(Boolean);
    expect(deductions).toEqual([
      { totalSpent: 100, remainingBalance: -100 },
      { totalSpent: 750, remainingBalance: -750 },
      { totalSpent: 200, remainingBalance: -200 },
    ]);
  });

  test("rejects malformed PIN, incorrect PIN, and missing fields without deducting", async () => {
    const invalidPin = await payment({
      amount: 100,
      merchant: "Cafe",
      upiPin: "12",
    });
    expect(invalidPin.status).toBe(400);
    expect(invalidPin.body.message).toMatch(/UPI PIN format/i);

    const incorrectPin = await payment({
      amount: 100,
      merchant: "Cafe",
      upiPin: "9999",
    });
    expect(incorrectPin.status).toBe(401);
    expect(incorrectPin.body).toEqual({
      success: false,
      error: "INCORRECT_PIN",
      message: "Incorrect UPI PIN. Please try again.",
    });
    expect(User.findById.mock.results.at(-1).value.select).toHaveBeenCalledWith(
      "+upiPin",
    );

    const missingAmount = await payment({
      merchant: "Cafe",
      upiPin: "1234",
    });
    expect(missingAmount.status).toBe(400);

    const missingMerchant = await payment({
      amount: 100,
      upiPin: "1234",
    });
    expect(missingMerchant.status).toBe(400);
    expect(await bcrypt.compare("1234", demoPinHash)).toBe(true);
    expect(DailyBudget.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Transaction.create).not.toHaveBeenCalled();
  });
});
