const express = require("express");
const { getTodayBudget } = require("../controllers/budgetController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/today", protect, getTodayBudget);

module.exports = router;
