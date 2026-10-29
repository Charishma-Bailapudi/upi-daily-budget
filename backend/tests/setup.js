process.env.JWT_SECRET = "jest-test-secret";
process.env.JWT_EXPIRES_IN = "1h";

jest.mock("../src/services/telegramService");
