const telegramApiUrl = "https://api.telegram.org";

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }

  return token;
}

async function telegramRequest(method, payload) {
  const response = await fetch(
    `${telegramApiUrl}/bot${getBotToken()}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      `Telegram ${method} request failed: ${result.description || response.statusText}`,
    );
  }

  return result;
}

async function sendMessage(chatId, text, parseMode = "Markdown") {
  return telegramRequest("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
  });
}

async function setWebhook(url, secretToken) {
  return telegramRequest("setWebhook", {
    url,
    secret_token: secretToken,
  });
}

module.exports = { sendMessage, setWebhook };
