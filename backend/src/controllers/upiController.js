const mongoose = require("mongoose");
const { processUpiPayment } = require("../services/deductionEngine");

async function simulatePayment(req, res) {
  const { amount, merchant, upiPin, categoryId, note } = req.body || {};

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Amount must be a number greater than zero",
    });
  }

  if (typeof merchant !== "string" || !merchant.trim()) {
    return res.status(400).json({
      success: false,
      message: "Merchant is required",
    });
  }

  if (typeof upiPin !== "string" || !/^\d{4}(\d{2})?$/.test(upiPin)) {
    return res.status(400).json({
      success: false,
      message: "Invalid UPI PIN format. Must be 4 or 6 numeric digits.",
    });
  }

  if (
    categoryId !== undefined &&
    (typeof categoryId !== "string" ||
      !mongoose.isObjectIdOrHexString(categoryId))
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid categoryId is required",
    });
  }

  if (note !== undefined && typeof note !== "string") {
    return res.status(400).json({
      success: false,
      message: "Note must be a string",
    });
  }

  const result = await processUpiPayment({
    user: req.user,
    amount,
    merchant,
    categoryId,
    note,
  });

  return res.status(200).json(result);
}

module.exports = { simulatePayment };
