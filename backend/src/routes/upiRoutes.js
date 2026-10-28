const express = require("express");
const { simulatePayment } = require("../controllers/upiController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/pay", protect, simulatePayment);

module.exports = router;
