const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const upiRoutes = require("./routes/upiRoutes");

const app = express();

app.use(helmet());

// Dynamic CORS configuration allowing localhost, FRONTEND_URL, and all Vercel deployments
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, Telegram webhooks, mobile scripts)
    if (!origin) return callback(null, true);

    // Allow configured origins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow all Vercel preview and production subdomains
    if (origin.endsWith(".vercel.app")) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Idempotency-Key",
    "x-sms-secret",
    "X-Telegram-Bot-Api-Secret-Token",
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/budgets", budgetRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/upi", upiRoutes);
app.use("/api/v1/webhook", webhookRoutes);
app.use(healthRoutes);

app.get("/", (req, res) => {
  res
    .status(200)
    .json({ status: "UPI Budget API running", time: new Date().toISOString() });
});

app.use((error, req, res, next) => {
  console.error("API request failed:", error);

  if (res.headersSent) {
    return next(error);
  }

  const status =
    error.name === "ValidationError" ? 400 : error.code === 11000 ? 409 : 500;

  return res.status(status).json({
    success: false,
    message:
      status === 400
        ? error.message
        : status === 409
          ? "A user with that value already exists"
          : error.message || "Internal server error",
  });
});

module.exports = app;
