const express = require("express");
const { handleTelegramWebhook } = require("../controllers/webhookController");

const router = express.Router();

router.post("/telegram", handleTelegramWebhook);

module.exports = router;
