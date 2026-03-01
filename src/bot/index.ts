import { Bot } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import * as dotenv from 'dotenv';
import type { MyContext } from '../types/context';
import { addExpense } from '../conversations/addExpense';
import { addIncome } from '../conversations/addIncome';
import { addTransfer } from '../conversations/addTransfer';
import { fetchRecentTransactions, fetchLastTransaction } from '../database/queries';
import { formatDisplayDate, escapeMarkdown } from '../utils/formatDate';
import { buildMessage } from '../utils/formatMessage';

dotenv.config();

export const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN!);

bot.use(async (ctx, next) => {
  if (ctx.from?.id !== Number(process.env.TELEGRAM_USER_ID)) {
    await ctx.reply('Unauthorized.');
    return;
  }
  await next();
});

bot.catch((err) => {
  console.error('Bot error:', err.message, err.error);
  err.ctx.reply('Something went wrong. Please try again.').catch(() => {});
});

bot.use(conversations());
bot.use(createConversation(addExpense));
bot.use(createConversation(addIncome));
bot.use(createConversation(addTransfer));

const HELP_TEXT = [
  '*LedgrB0t* — Personal telegram bot to manage transactions, track budgets, view networth and more\\.',
  '',
  '*Transaction Logging*',
  '`/expense`  — Log an expense',
  '`/income`   — Log income',
  '`/transfer` — Log a transfer between accounts',
  '',
  '*Viewing & History*',
  '`/last`     — Show the full receipt of the most recent transaction',
  '`/recent`   — Show your 10 most recent transactions',
  '',
  '*Utilities*',
  '`/help`     — Show this message',
].join('\n');

bot.command('help', async (ctx) => {
  await ctx.reply(HELP_TEXT, { parse_mode: 'MarkdownV2' });
});

bot.command('expense', async (ctx) => {
  await ctx.conversation.exitAll();
  await ctx.conversation.enter('addExpense');
});

bot.command('income', async (ctx) => {
  await ctx.conversation.exitAll();
  await ctx.conversation.enter('addIncome');
});

bot.command('transfer', async (ctx) => {
  await ctx.conversation.exitAll();
  await ctx.conversation.enter('addTransfer');
});

bot.command('last', async (ctx) => {
  const t = await fetchLastTransaction();

  if (!t) {
    await ctx.reply('No transactions found.');
    return;
  }

  const displayDate = formatDisplayDate(t.transaction_date);
  if (t.type === 'expense') {
    const receipt = buildMessage({
      header: 'EXPENSE', headerEmoji: '🧾', title: t.title ?? 'Untitled',
      rows: [escapeMarkdown(t.account_label), escapeMarkdown(t.category_label), `💰 \`$${t.amount.toFixed(2)}\``, `📅 ${displayDate}`],
      notes: t.notes,
    });
    await ctx.reply(receipt, { parse_mode: 'Markdown' });
  } else if (t.type === 'income') {
    const receipt = buildMessage({
      header: 'INCOME', headerEmoji: '💵', title: t.title ?? 'Untitled',
      rows: [escapeMarkdown(t.account_label), escapeMarkdown(t.income_type_label), `💰 \`$${t.amount.toFixed(2)}\``, `📅 ${displayDate}`],
      notes: t.notes,
    });
    await ctx.reply(receipt, { parse_mode: 'Markdown' });
  } else {
    const receipt = buildMessage({
      header: 'TRANSFER', headerEmoji: '🔄',
      rows: [`📤 ${escapeMarkdown(t.from_label)}`, `📥 ${escapeMarkdown(t.to_label)}`, `💰 \`$${t.amount.toFixed(2)}\``, `📅 ${displayDate}`],
      notes: t.notes,
    });
    await ctx.reply(receipt, { parse_mode: 'Markdown' });
  }
});

bot.command('recent', async (ctx) => {
  const transactions = await fetchRecentTransactions();

  if (transactions.length === 0) {
    await ctx.reply('No transactions found.');
    return;
  }

  const lines = transactions.map((t, i) => {
    const date = formatDisplayDate(t.transaction_date);
    const amount = `\`$${t.amount.toFixed(2)}\``;
    if (t.type === 'expense') {
      return `${i + 1}. 🧾 ${escapeMarkdown(t.title ?? 'Untitled')} — ${amount} — ${date}`;
    }
    if (t.type === 'income') {
      return `${i + 1}. 💵 ${escapeMarkdown(t.title ?? 'Untitled')} — ${amount} — ${date}`;
    }
    return `${i + 1}. 🔄 ${escapeMarkdown(t.from_label)} → ${escapeMarkdown(t.to_label)} — ${amount} — ${date}`;
  });

  await ctx.reply(`🕐 *Recent Transactions*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
});

bot.api.setMyCommands([
  { command: 'expense', description: 'Log an expense' },
  { command: 'income', description: 'Log income' },
  { command: 'transfer', description: 'Log a transfer' },
  { command: 'last', description: 'Show the full receipt of the most recent transaction' },
  { command: 'recent', description: 'Show 10 most recent transactions' },
  { command: 'help', description: 'Show available commands' },
]);

if (process.env.NODE_ENV !== 'production') {
  bot.start();
}
