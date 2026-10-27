const mongoose = require("mongoose");

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
};

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    date: {
      type: String,
      required: true,
      validate: {
        validator: isValidDate,
        message: "Date must be a valid YYYY-MM-DD date",
      },
    },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: (value) => value > 0,
        message: "Amount must be greater than zero",
      },
    },
    merchant: {
      type: String,
      required: true,
      trim: true,
    },
    simulatedUpiRef: {
      type: String,
      unique: true,
      sparse: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, date: -1 });

module.exports =
  mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);