# ledgr-bot

A personal Telegram bot for logging financial activity on the go. Expenses, income, and transfers are entered through short guided flows in Telegram and written straight to the Supabase database that powers **Ledgr** 📱💸📊

Built with [grammY](https://grammy.dev), [@grammyjs/conversations](https://grammy.dev/plugins/conversations), and [supabase-js](https://supabase.com/docs/reference/javascript), and deployed as a serverless function on Vercel.

---

## Features

- **Guided logging.** `/expense`, `/income`, and `/transfer` walk you through each field with inline keyboards. You pick the account type, account, and category, type a title and amount, choose a date, and add optional notes. A receipt appears for you to confirm before anything is saved.
- **Data-driven menus.** Accounts, account types, expense categories, and income types come from Supabase, so you change the menus by editing rows rather than code.
- **History views.** You can see the last transaction, the 10 most recent, today, yesterday, this week, the last N days, or any month. Each view shows income, expense, and net totals.
- **Single-user lockdown.** Every update from a Telegram user other than `TELEGRAM_USER_ID` gets `Unauthorized.`
- **Webhook secret.** The Vercel endpoint rejects any request whose `X-Telegram-Bot-Api-Secret-Token` header doesn't match `SECRET_TOKEN`.

## Commands

### Transaction logging

| Command | Description |
| --- | --- |
| `/expense` | Log an expense. Steps: payment type → account → category → title → amount → date → notes → confirm. |
| `/income` | Log income. Steps: account type → account → income type → title → amount → date → notes → confirm. |
| `/transfer` | Log a transfer between two accounts. Steps: from type → from account → to type → to account → amount → date → notes → confirm. |

Every step has a **Cancel** button, and starting a new logging command abandons any flow in progress. Dates can be **Today**, **Yesterday**, or a custom `MM/DD/YYYY` (also `MM/DD` or `MM/DD/YY`).

### Viewing and history

| Command | Description |
| --- | --- |
| `/last` | Full receipt of the most recent transaction |
| `/recent` | The 10 most recent transactions across all types |
| `/today` | Today's transactions with totals |
| `/yesterday` | Yesterday's transactions with totals |
| `/week` | This week (Sunday–Saturday), grouped by day |
| `/past N` | The last N days, e.g. `/past 30` |
| `/month [MM/YYYY]` | The current month, or a given one (e.g. `/month 1/2025`), grouped by day |

### Utilities

| Command | Description |
| --- | --- |
| `/status` | Supabase connectivity, total transaction count, and last transaction date |
| `/accounts` | All active accounts, grouped by account type |
| `/categories` | All active expense categories and income types |
| `/help` | Command reference |

The command list is registered with Telegram on startup, so it shows up in the client's `/` menu.

---

## Architecture

```
Telegram ──webhook──▶ Vercel  /api/bot  (api/bot.ts)
                         │  checks X-Telegram-Bot-Api-Secret-Token
                         ▼
                      grammY bot  (src/bot/index.ts)
                         │  user-ID gate → conversations → commands
                         ▼
                      Supabase  (src/database/queries.ts)
```

In **production** (on Vercel, `NODE_ENV=production`), Telegram pushes updates to `/api/bot`, and `api/bot.ts` passes them to grammY's `webhookCallback`. In **development**, `src/bot/index.ts` calls `bot.start()` and long-polls Telegram, so no public URL is needed.

### Project layout

```
api/
  bot.ts                  Vercel serverless entry point (webhook + secret check)
src/
  bot/index.ts            Bot setup, auth middleware, all commands
  conversations/          Multi-step flows: addExpense, addIncome, addTransfer
  database/
    supabase.ts           Supabase client (reads SUPABASE_URL / SUPABASE_KEY)
    queries.ts            All reads and inserts
    types.ts              Row and view-model types
  keyboards/              Inline keyboards (static + built from DB rows)
  types/context.ts        grammY context type with conversation flavor
  utils/                  Date parsing/formatting, message building, cancel helper
scripts/
  setWebhook.ts           Point Telegram at the Vercel deployment
  deleteWebhook.ts        Remove the webhook (switch back to polling)
vercel.json               Routes /api/bot → api/bot.ts
```

---

## Database

The bot shares a Supabase (Postgres) database with Ledgr. These are the tables and columns it reads and writes. The schema itself lives on the Supabase side and isn't in this repo.

**Reference tables.** The bot only shows rows where `is_active = true`, ordered by `sort_order`.

| Table | Columns used |
| --- | --- |
| `account_types` | `id`, `name`, `display_name`, `emoji`, `sort_order`, `is_active`, `for_expense`, `for_income`, `for_transfer` |
| `accounts` | `id`, `name`, `display_name`, `emoji`, `account_type_id` → `account_types`, `sort_order`, `is_active` |
| `expense_types` | `id`, `name`, `display_name`, `emoji`, `sort_order`, `is_active` |
| `income_types` | `id`, `name`, `display_name`, `emoji`, `sort_order`, `is_active` |

The `for_expense`, `for_income`, and `for_transfer` flags on `account_types` control which account types appear in each logging flow.

**Transaction tables**

| Table | Columns used |
| --- | --- |
| `expenses` | `expense_type_id` → `expense_types`, `account_id` → `accounts`, `title`, `amount`, `transaction_date`, `notes`, `created_at`, `updated_at` |
| `income` | `income_type_id` → `income_types`, `account_id` → `accounts`, `title`, `amount`, `transaction_date`, `notes`, `created_at`, `updated_at` |
| `transfers` | `from_account_id` → `accounts`, `to_account_id` → `accounts`, `amount`, `transaction_date`, `notes`, `created_at` |

All IDs are UUIDs, and the inline keyboards use them as callback data. `transaction_date` is stored as `YYYY-MM-DD`.

---

## Setup

### Prerequisites

- Node.js 18+ (built-in `fetch` is used by the scripts)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- A Supabase project with the tables above
- A Vercel account (for deployment)

### Environment variables

Create a `.env` in the project root. It is git-ignored.

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<supabase secret / service-role key>
TELEGRAM_BOT_TOKEN=<token from BotFather>
TELEGRAM_USER_ID=<your numeric Telegram user ID>
SECRET_TOKEN=<random string used to verify webhook calls>
VERCEL_URL=https://<your-deployment>.vercel.app
```

| Variable | Used by | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | bot | Project URL |
| `SUPABASE_KEY` | bot | A server-side key (`sb_secret_…` or the legacy `service_role` JWT). The bot runs only on the server, so it never reaches a client. |
| `TELEGRAM_BOT_TOKEN` | bot, scripts | |
| `TELEGRAM_USER_ID` | bot | The only Telegram user allowed to talk to the bot. Get yours from [@userinfobot](https://t.me/userinfobot). |
| `SECRET_TOKEN` | webhook, `setWebhook` | Telegram may only use `A–Z a–z 0–9 _ -`, up to 256 characters |
| `VERCEL_URL` | `setWebhook` | Base URL of the deployment, no trailing `/api/bot` |

### Install

```sh
npm install
```

---

## Running locally

Telegram delivers updates **either** by webhook **or** through polling, never both. To develop locally, remove the webhook first:

```sh
npm run webhook:delete   # stop Telegram pushing to Vercel
npm run dev              # long-poll with ts-node
```

When you're done, point Telegram back at production:

```sh
npm run webhook:set
```

> While the webhook is deleted, the deployed bot gets no messages. Remember to set it again.

Type-check and compile with `npm run build`, which writes to `dist/`.

---

## Deploying to Vercel

1. Import the repo into Vercel. `vercel.json` builds `api/bot.ts` with `@vercel/node` and routes `/api/bot` to it.
2. In **Project → Settings → Environment Variables**, add `SUPABASE_URL`, `SUPABASE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_USER_ID`, and `SECRET_TOKEN`. Vercel sets `NODE_ENV=production`, which keeps the bot from starting polling.
3. Deploy, then register the webhook from your machine:
   ```sh
   npm run webhook:set
   ```
4. Send `/status` to the bot. You should see `✅ Supabase connected`.

> Vercel's environment variables are separate from your local `.env`. If you rotate a Supabase key, update it in both places and redeploy.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Bot doesn't respond at all | The webhook isn't set, or points at the wrong URL. Run `npm run webhook:set`, or check `https://api.telegram.org/bot<TOKEN>/getWebhookInfo` for `last_error_message`. |
| `/status` shows `❌ Supabase unreachable` or 0 transactions | The Supabase project is paused (free-tier projects pause after a period of inactivity; restore it from the dashboard), or Vercel has an outdated `SUPABASE_KEY` / `SUPABASE_URL`. |
| Bot replies `Unauthorized.` | `TELEGRAM_USER_ID` doesn't match your account. |
| Webhook requests get `401` | `SECRET_TOKEN` in Vercel doesn't match the one the webhook was registered with. Re-run `npm run webhook:set`. |
| `npm run dev` gets no updates | A webhook is still set. Run `npm run webhook:delete`. |
| A flow stops responding mid-way on Vercel | Conversation state is kept in memory, and serverless instances don't share it. Start the command again. |
| Dates are off by a day | Dates use the server's local time, and Vercel runs in UTC. |

---

## Tech stack

- **Runtime:** Node.js, TypeScript (CommonJS, ES2020)
- **Bot framework:** grammY + @grammyjs/conversations
- **Database:** Supabase (Postgres) via @supabase/supabase-js
- **Hosting:** Vercel serverless functions

## License

[MIT](LICENSE) © 2026 Jeffery
