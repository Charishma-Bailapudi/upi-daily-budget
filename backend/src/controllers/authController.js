const jwt = require("jsonwebtoken");
const { randomInt } = require("node:crypto");
const User = require("../models/User");

function createToken(userId) {
  const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

  if (!JWT_SECRET || !JWT_EXPIRES_IN) {
    throw new Error("JWT_SECRET and JWT_EXPIRES_IN must be set");
  }

  return jwt.sign({ userId: userId.toString() }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    upiId: user.upiId,
    defaultDailyCap: user.defaultDailyCap,
    timezone: user.timezone,
    telegramLinked: Boolean(user.telegramChatId),
    createdAt: user.createdAt,
  };
}

async function register(req, res) {
  const { name, email, password, upiId, defaultDailyCap } = req.body || {};

  if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN) {
    throw new Error("JWT_SECRET and JWT_EXPIRES_IN must be set");
  }

  const user = await User.create({
    name,
    email,
    password,
    upiId,
    defaultDailyCap,
  });

  return res.status(201).json({
    success: true,
    token: createToken(user._id),
    user: toPublicUser(user),
  });
}

async function login(req, res) {
  const { email, password } = req.body || {};

  if (typeof email !== "string" || !email || typeof password !== "string" || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN) {
    throw new Error("JWT_SECRET and JWT_EXPIRES_IN must be set");
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
  const passwordMatches = user && (await user.comparePassword(password));

  if (!passwordMatches) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  return res.status(200).json({
    success: true,
    token: createToken(user._id),
    user: toPublicUser(user),
  });
}

function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: toPublicUser(req.user),
  });
}

async function generateTelegramLinkCode(req, res) {
  const code = randomInt(100000, 1000000).toString();
  const expiresInMinutes = 10;

  req.user.telegramLinkCode = code;
  req.user.telegramLinkExpires = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  await req.user.save();

  return res.status(200).json({ success: true, code, expiresInMinutes });
}

module.exports = { register, login, getMe, generateTelegramLinkCode };
