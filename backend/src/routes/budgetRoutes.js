const express = require("express");
const {
  getTodayBudget,
  triggerManualRollover,
  getAnalytics,
} = require("../controllers/budgetController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/today", protect, getTodayBudget);
router.get("/analytics", protect, getAnalytics);
router.post("/trigger-rollover", protect, triggerManualRollover);

module.exports = router;
