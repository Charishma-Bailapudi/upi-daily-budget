# UPI Daily Budget: Day 07 Engineering Guide

## Telegram Bot Setup, Webhook Architecture & Local Tunneling

---

**Sprint 2 (Day 7)** begins the conversational automation phase: integrating a **Telegram Bot** so users can manage their daily budget, receive balance alerts, and log payments directly from chat without opening a browser.

---

## 2. Core Architectural Decision: Webhooks vs. Long-Polling

When designing a bot backend to handle user interactions from messaging platforms, two communication paradigms exist:

### A. Long-Polling (Inefficient)

The backend repeatedly sends HTTP `GET` requests to Telegram's servers asking _"Are there any updates?"_.

- **Drawbacks**:
  - Burns continuous CPU cycles and outbound network bandwidth while idle.
  - Introduces latency between user action and response.
  - Scales poorly across multi-instance or serverless server architectures.

### B. Webhooks (Our Implementation)

Instead of polling, our Express application registers a specific HTTPS callback route (`/api/v1/webhook/telegram`). Telegram dispatches an HTTP `POST` event **only when an actual message arrives**.

- **Advantages**:
  - Consumes zero idle CPU.
  - Executes with near-zero latency ($< 50\text{ ms}$).
  - Follows production event-driven architecture standards.

---

## 3. The Localhost Dilemma & Why We Need `localtunnel` / `ngrok`

During local development, your Node.js/Express server is hosted at `http://localhost:5000`.

- **Localhost Scope**: `localhost` is a loopback network interface (`127.0.0.1`) that exists strictly inside your physical laptop. Devices and servers on the public internet cannot reach it.
- **Telegram Security Rules**: Telegram's servers mandate that webhooks must be routed to a publicly accessible domain secured with valid HTTPS/SSL certificates. Plain HTTP and private IP addresses are rejected.
- **The Solution (Reverse Proxy / Tunnel)**: Tools like `localtunnel` or `ngrok` create an encrypted outbound reverse tunnel from your machine to a public cloud relay. The relay assigns a public HTTPS URL (e.g., `https://sweet-socks-sneeze.loca.lt`) and securely forwards incoming webhook requests directly to your local port 5000.

```
┌─────────────────────────────────┐
│     User Smartphone (Telegram)   │
└────────────────┬────────────────┘
                 │ (1) Sends "/start"
                 ▼
┌─────────────────────────────────┐
│     Telegram Cloud Servers      │
└────────────────┬────────────────┘
                 │ (2) HTTPS POST /api/v1/webhook/telegram
                 ▼
┌──────────────────────────────────────────────┐
│  Public Reverse Proxy (localtunnel / ngrok)  │
└────────────────┬─────────────────────────────┘
                 │ (3) Forwards traffic over persistent tunnel
                 ▼
┌──────────────────────────────────────────────┐
│  Localhost Machine: Port 5000 (Express)      │
│  ├── Verifies X-Telegram-Bot-Api-Secret-Token│
│  ├── Immediately responds HTTP 200 OK        │
│  └── Dispatches welcome reply asynchronously │
└──────────────────────────────────────────────┘
```

---

## 4. Key Architectural Deliverables Built in Day 7

### A. Bot Credentials via `@BotFather`

The bot was registered via Telegram's `@BotFather`, generating `TELEGRAM_BOT_TOKEN`. This token authorizes our server to call Telegram REST methods (such as `sendMessage`) and follows the standard format:

```text
[Bot_ID]:[35_Character_AlphaNumeric_Token]
```

### B. Secret Token Validation (Defense-in-Depth)

Because the tunnel URL is public, an attacker could attempt to send spoofed updates directly to our webhook endpoint. To prevent this, a shared secret (`TELEGRAM_WEBHOOK_SECRET`) is verified on every request using the `X-Telegram-Bot-Api-Secret-Token` header. Requests failing or missing this check are dropped with `HTTP 403 Forbidden`.

### C. Non-Blocking Async Dispatch Pattern

Telegram imposes strict timeout windows (~5 seconds) on webhook endpoints. If a server performs heavy database operations before responding, Telegram assumes delivery failure and initiates retry storms. We structured `webhookController.js` to validate headers and immediately return `HTTP 200 OK`, delegating message handling and dispatch to background asynchronous promises.

---

## 5. Issues Encountered & Resolution Reference

| Symptom / Error                                  | Root Cause                                                                                                           | Technical Solution                                                                            |
| :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| **`403 Forbidden: Unauthorized webhook source`** | Secret token header in the request mismatched the `TELEGRAM_WEBHOOK_SECRET` in `.env`.                               | Synchronized the request header with the exact environment variable and restarted Node.js.    |
| **`Bad Request: chat not found`**                | Test payload contained a placeholder mock chat ID (`123456789`) that does not exist on Telegram.                     | Tested the route using an authentic Telegram client update containing a valid user `chat.id`. |
| **`POST / 404 Not Found`**                       | Webhook was registered with Telegram pointing to the root URL (`https://...loca.lt/`) rather than the endpoint path. | Re-registered `setWebhook` with the complete path: `/api/v1/webhook/telegram`.                |
| **`503 Tunnel Unavailable`**                     | Free `localtunnel` session dropped or timed out on remote relay servers.                                             | Re-established the tunnel and updated Telegram's webhook registration with the fresh URL.     |

---

## 6. Next Steps: Day 08 Roadmap

With Telegram communication fully established, Day 8 connects individual Telegram users with their database accounts:

1. **User Schema Extension**: Add `telegramChatId` and `telegramLinkCode` fields to link the accounts.
2. **Account Linking Flow**: Create `POST /api/v1/auth/telegram-code` to generate a temporary 6-digit OTP from the dashboard.
3. **Link Command Handler**: Intercept `/link <code>` updates in Telegram to bind `chat.id` to the authenticated MongoDB user.
4. **Real-Time Balance Query**: Implement the `/balance` command to fetch and format today's active `DailyBudget` (daily cap, total spent, remaining balance, and health status).
