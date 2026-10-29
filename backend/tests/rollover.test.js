jest.mock("../src/models/User", () => ({
  find: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));
jest.mock("../src/models/DailyBudget", () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

const { User, DailyBudget } = require("../src/models");
const telegramService = require("../src/services/telegramService");
const {
  executeDailyRollover,
  recoverUserDailyBudget,
} = require("../src/services/rolloverService");

describe("daily rollover service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-29T04:30:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("closes yesterday, credits unspent money, creates today's cap, and notifies", async () => {
    const user = {
      _id: "507f1f77bcf86cd799439011",
      defaultDailyCap: 1250,
      telegramChatId: 12345,
    };
    const yesterdayBudget = {
      _id: "607f1f77bcf86cd799439012",
      remainingBalance: 350,
      totalSpent: 900,
      dailyCap: 1250,
    };
    const closedBudget = { ...yesterdayBudget, status: "CLOSED" };
    const todayBudget = { date: "2026-10-29", dailyCap: 1250 };
    User.find.mockResolvedValue([user]);
    DailyBudget.findOne.mockResolvedValue(yesterdayBudget);
    DailyBudget.findOneAndUpdate.mockImplementation(async (_filter, update) => {
      if (update.$set?.status === "CLOSED") return closedBudget;
      if (update.$setOnInsert) return todayBudget;
      return null;
    });
    User.findOneAndUpdate.mockResolvedValue({ _id: user._id });

    const result = await executeDailyRollover();

    expect(result).toEqual({
      totalUsersProcessed: 1,
      successCount: 1,
      failedCount: 0,
    });
    expect(DailyBudget.findOne).toHaveBeenCalledWith({
      userId: user._id,
      date: "2026-10-28",
    });
    expect(DailyBudget.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: yesterdayBudget._id, status: { $ne: "CLOSED" } },
      { $set: { status: "CLOSED" } },
      expect.objectContaining({ returnDocument: "after" }),
    );
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: user._id },
      { $inc: { savingsPotBalance: 350 } },
      expect.objectContaining({ returnDocument: "after" }),
    );
    expect(DailyBudget.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: user._id, date: "2026-10-29" },
      {
        $setOnInsert: expect.objectContaining({
          dailyCap: 1250,
          totalSpent: 0,
          remainingBalance: 1250,
          status: "GREEN",
        }),
      },
      expect.objectContaining({ upsert: true }),
    );
    expect(telegramService.sendMessage).toHaveBeenCalledWith(
      user.telegramChatId,
      expect.stringContaining("Allowance for Today: ₹1,250"),
      "Markdown",
    );
  });

  test("recovers a missing daily budget and finalizes yesterday on demand", async () => {
    const user = {
      _id: "507f1f77bcf86cd799439011",
      defaultDailyCap: 1250,
    };
    const yesterdayBudget = {
      _id: "607f1f77bcf86cd799439012",
      remainingBalance: 350,
    };
    const todayBudget = { date: "2026-10-29", dailyCap: 1250 };
    DailyBudget.findOne.mockResolvedValue(yesterdayBudget);
    DailyBudget.findOneAndUpdate.mockImplementation(async (filter, update) => {
      if (filter._id && update.$set?.status === "CLOSED") {
        return { ...yesterdayBudget, status: "CLOSED" };
      }
      if (filter.date === "2026-10-29" && update.$setOnInsert) {
        return todayBudget;
      }
      return null;
    });
    User.findOneAndUpdate.mockResolvedValue({ _id: user._id });

    await expect(recoverUserDailyBudget(user, "2026-10-29")).resolves.toBe(
      todayBudget,
    );
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: user._id },
      { $inc: { savingsPotBalance: 350 } },
      expect.objectContaining({ returnDocument: "after" }),
    );
    expect(telegramService.sendMessage).not.toHaveBeenCalled();
  });
});
