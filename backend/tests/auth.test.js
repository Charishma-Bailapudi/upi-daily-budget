jest.mock("../src/models/User", () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const request = require("supertest");
const User = require("../src/models/User");
const app = require("../src/app");

const userId = "507f1f77bcf86cd799439011";

function createUser() {
  return {
    _id: userId,
    name: "Test User",
    email: "test@example.com",
    upiId: "test@upi",
    defaultDailyCap: 3300,
    timezone: "Asia/Kolkata",
    telegramChatId: null,
    telegramLinkCode: null,
    telegramLinkExpires: null,
    createdAt: new Date("2026-10-29T00:00:00.000Z"),
    comparePassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(undefined),
  };
}

describe("authentication API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("registers a user and returns the default daily cap and a JWT", async () => {
    const user = createUser();
    User.create.mockResolvedValue(user);

    const response = await request(app).post("/api/v1/auth/register").send({
      name: user.name,
      email: user.email,
      password: "secure-password",
      upiId: user.upiId,
    });

    expect(response.status).toBe(201);
    expect(response.body.user.defaultDailyCap).toBe(3300);
    expect(response.body.token).toEqual(expect.any(String));
    expect(jwt.verify(response.body.token, process.env.JWT_SECRET).userId).toBe(
      userId,
    );
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: user.email }),
    );
  });

  test("logs in and rejects incorrect credentials", async () => {
    const user = createUser();
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      email: " TEST@example.com ",
      password: "secure-password",
    });

    expect(response.status).toBe(200);
    expect(jwt.verify(response.body.token, process.env.JWT_SECRET).userId).toBe(
      userId,
    );
    expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });

    user.comparePassword.mockResolvedValue(false);
    const rejected = await request(app).post("/api/v1/auth/login").send({
      email: user.email,
      password: "wrong-password",
    });
    expect(rejected.status).toBe(401);
  });

  test("generates a protected six-digit Telegram code with an expiry", async () => {
    const user = createUser();
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });
    const login = await request(app).post("/api/v1/auth/login").send({
      email: user.email,
      password: "secure-password",
    });
    User.findById.mockResolvedValue(user);

    const response = await request(app)
      .post("/api/v1/auth/telegram-code")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.code).toMatch(/^\d{6}$/);
    expect(response.body.expiresInMinutes).toBe(10);
    expect(user.telegramLinkCode).toBe(response.body.code);
    expect(user.telegramLinkExpires.getTime()).toBeGreaterThan(Date.now());
    expect(user.save).toHaveBeenCalledTimes(1);
  });
});
