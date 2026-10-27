const mongoose = require("mongoose");

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
};

const dailyBudgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      validate: {
        validator: isValidDate,
        message: "Date must be a valid YYYY-MM-DD date",
      },
    },
    dailyCap: {
      type: Number,
      required: true,
      min: 0,
    },
    totalSpent: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    remainingBalance: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["GREEN", "YELLOW", "RED"],
      default: "GREEN",
    },
    nightlyRoast: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

dailyBudgetSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports =
  mongoose.models.DailyBudget || mongoose.model("DailyBudget", dailyBudgetSchema);