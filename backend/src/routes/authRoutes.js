const express = require("express");
const {
  register,
  login,
  generateTelegramLinkCode,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/telegram-code", protect, generateTelegramLinkCode);

module.exports = router;
