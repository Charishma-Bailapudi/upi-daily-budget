const express = require("express");
const {
  simulatePayment,
  getTransactions,
} = require("../controllers/upiController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/pay", protect, simulatePayment);
router.get("/transactions", protect, getTransactions);

module.exports = router;
