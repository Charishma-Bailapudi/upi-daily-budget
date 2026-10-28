const telegramService = require("../services/telegramService");

const welcomeMessage =
  "Welcome to UPI Daily Budget! Link your account to get started. Available commands:\n/start - Show this welcome message";

function handleTelegramWebhook(req, res) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = req.get("x-telegram-bot-api-secret-token");

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return res.status(403).json({ error: "Unauthorized webhook source" });
  }

  res.status(200).json({ ok: true });

  const message = req.body?.message;

  if (message?.text === "/start" && message.chat?.id !== undefined) {
    telegramService
      .sendMessage(message.chat.id, welcomeMessage)
      .catch((error) => {
        console.error("Failed to send Telegram welcome message:", error);
      });
  }
}

module.exports = { handleTelegramWebhook };
