jest.mock("../src/models/Transaction", () => ({
  aggregate: jest.fn(),
}));
jest.mock("../src/models/DailyBudget", () => ({
  find: jest.fn(),
}));

const Transaction = require("../src/models/Transaction");
const DailyBudget = require("../src/models/DailyBudget");
const { getSpendingAnalytics } = require("../src/services/analyticsService");

const userId = "507f1f77bcf86cd799439011";

describe("spending analytics service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    DailyBudget.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { status: "GREEN" },
        { status: "RED" },
      ]),
    });
  });

  test.each([7, 30, 31])("aggregates populated transactions for %i days", async (days) => {
    Transaction.aggregate.mockResolvedValue([
      {
        totals: [{ totalSpent: 465, transactionCount: 3 }],
        categories: [
          { _id: "FOOD", amount: 300 },
          { _id: "TRAVEL", amount: 165 },
        ],
        merchants: [{ _id: "Cafe", amount: 300 }],
      },
    ]);

    const result = await getSpendingAnalytics(userId, days);

    expect(result).toMatchObject({
      periodDays: days,
      totalSpent: 465,
      dailyAverage: Math.round((465 / days) * 100) / 100,
      transactionCount: 3,
      topCategory: "FOOD",
      topMerchant: "Cafe",
      budgetComplianceRate: 50,
    });
    expect(result.categoryBreakdown).toEqual([
      { category: "FOOD", amount: 300, percentage: 64.5 },
      { category: "TRAVEL", amount: 165, percentage: 35.5 },
    ]);
    expect(Transaction.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          $match: expect.objectContaining({
            userId: expect.anything(),
            createdAt: { $gte: expect.any(Date) },
          }),
        }),
      ]),
    );
  });

  test.each([7, 30, 31])("returns finite zero metrics with no transactions for %i days", async (days) => {
    Transaction.aggregate.mockResolvedValue([
      { totals: [], categories: [], merchants: [] },
    ]);
    DailyBudget.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    const result = await getSpendingAnalytics(userId, days);

    expect(result).toEqual({
      periodDays: days,
      totalSpent: 0,
      dailyAverage: 0,
      transactionCount: 0,
      topCategory: null,
      topMerchant: null,
      categoryBreakdown: [],
      budgetComplianceRate: 0,
    });
    expect(Object.values(result).filter((value) => typeof value === "number").every(Number.isFinite)).toBe(true);
  });
});
