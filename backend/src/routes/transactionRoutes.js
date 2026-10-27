const express = require("express");
const {
  createTransaction,
  getTodayTransactions,
} = require("../controllers/transactionController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, createTransaction);
router.get("/today", protect, getTodayTransactions);

module.exports = router;
