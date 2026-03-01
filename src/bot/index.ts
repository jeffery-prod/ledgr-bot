import { Bot } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import * as dotenv from 'dotenv';
import type { MyContext } from '../types/context';
import { addExpense } from '../conversations/addExpense';
import { addIncome } from '../conversations/addIncome';
import { addTransfer } from '../conversations/addTransfer';
import { fetchRecentTransactions, fetchTodayTransactions, fetchTransactionsByDateRange, fetchLastTransaction } from '../database/queries';
import { formatDisplayDate, toLocalDateString, formatDayHeader, escapeMarkdown } from '../utils/formatDate';
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
  '`/today`    — Show all transactions logged for today',
  '`/yesterday` — Show all transactions logged for yesterday',
  '`/week`     — Show this week\'s transactions grouped by day',
  '`/past7`    — Show all transactions from the last 7 days',
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

bot.command('today', async (ctx) => {
  const transactions = await fetchTodayTransactions();

  if (transactions.length === 0) {
    await ctx.reply('No transactions logged today.');
    return;
  }

  const lines = transactions.map((t, i) => {
    const amount = `\`$${t.amount.toFixed(2)}\``;
    if (t.type === 'expense') {
      return `${i + 1}. 🧾 ${escapeMarkdown(t.title ?? 'Untitled')} — ${amount}`;
    }
    if (t.type === 'income') {
      return `${i + 1}. 💵 ${escapeMarkdown(t.title ?? 'Untitled')} — ${amount}`;
    }
    return `${i + 1}. 🔄 ${escapeMarkdown(t.from_label)} → ${escapeMarkdown(t.to_label)} — ${amount}`;
  });

  const totalIn = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const net = totalIn - totalOut;
  const netSign = net >= 0 ? '+' : '-';

  const summary = [
    '',
    '─────────────────',
    `💵 Income:   \`$${totalIn.toFixed(2)}\``,
    `🧾 Expenses: \`$${totalOut.toFixed(2)}\``,
    `📊 Net:      \`${netSign}$${Math.abs(net).toFixed(2)}\``,
  ].join('\n');

  await ctx.reply(`📅 *Today's Transactions*\n\n${lines.join('\n')}${summary}`, { parse_mode: 'Markdown' });
});

bot.command('yesterday', async (ctx) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  const transactions = await fetchTransactionsByDateRange(yesterdayStr, yesterdayStr);

  if (transactions.length === 0) {
    await ctx.reply('No transactions logged yesterday.');
    return;
  }

  const lines = transactions.map((t, i) => {
    const amount = `\`$${t.amount.toFixed(2)}\``;
    if (t.type === 'expense') return `${i + 1}. 🧾 ${escapeMarkdown(t.title ?? 'Untitled')} — ${amount}`;
    if (t.type === 'income') return `${i + 1}. 💵 ${escapeMarkdown(t.title ?? 'Untitled')} — ${amount}`;
    return `${i + 1}. 🔄 ${escapeMarkdown(t.from_label)} → ${escapeMarkdown(t.to_label)} — ${amount}`;
  });

  const totalIn = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const net = totalIn - totalOut;
  const netSign = net >= 0 ? '+' : '-';

  const summary = [
    '',
    '─────────────────',
    `💵 Income:   \`$${totalIn.toFixed(2)}\``,
    `🧾 Expenses: \`$${totalOut.toFixed(2)}\``,
    `📊 Net:      \`${netSign}$${Math.abs(net).toFixed(2)}\``,
  ].join('\n');

  const header = `📅 *Yesterday (${formatDayHeader(yesterdayStr)})*`;
  await ctx.reply(`${header}\n\n${lines.join('\n')}${summary}`, { parse_mode: 'Markdown' });
});

bot.command('week', async (ctx) => {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + (6 - now.getDay()));

  const sundayStr = toLocalDateString(sunday);
  const saturdayStr = toLocalDateString(saturday);

  const transactions = await fetchTransactionsByDateRange(sundayStr, saturdayStr);

  if (transactions.length === 0) {
    await ctx.reply('No transactions logged this week.');
    return;
  }

  const byDate = new Map<string, typeof transactions>();
  for (const t of transactions) {
    if (!byDate.has(t.transaction_date)) byDate.set(t.transaction_date, []);
    byDate.get(t.transaction_date)!.push(t);
  }

  const sortedDates = [...byDate.keys()].sort();
  const sections = sortedDates.map(date => {
    const dayTxns = byDate.get(date)!;
    const lines = dayTxns.map((t, i) => {
      const amount = `\`$${t.amount.toFixed(2)}\``;
      if (t.type === 'expense') return `${i + 1}. 🧾 ${escapeMarkdown(t.title ?? 'Untitled')} — ${amount}`;
      if (t.type === 'income') return `${i + 1}. 💵 ${escapeMarkdown(t.title ?? 'Untitled')} — ${amount}`;
      return `${i + 1}. 🔄 ${escapeMarkdown(t.from_label)} → ${escapeMarkdown(t.to_label)} — ${amount}`;
    });

    const dayIn = dayTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const dayOut = dayTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const subtotalParts = [];
    if (dayIn > 0) subtotalParts.push(`💵 \`$${dayIn.toFixed(2)}\``);
    if (dayOut > 0) subtotalParts.push(`🧾 \`$${dayOut.toFixed(2)}\``);

    return [`*${formatDayHeader(date)}*`, ...lines, subtotalParts.join('  ')].join('\n');
  });

  const totalIn = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const net = totalIn - totalOut;
  const netSign = net >= 0 ? '+' : '-';

  const summary = [
    '─────────────────',
    `💵 Income:   \`$${totalIn.toFixed(2)}\``,
    `🧾 Expenses: \`$${totalOut.toFixed(2)}\``,
    `📊 Net:      \`${netSign}$${Math.abs(net).toFixed(2)}\``,
  ].join('\n');

  const rangeLabel = `${formatDayHeader(sundayStr)} – ${formatDayHeader(saturdayStr)}`;
  await ctx.reply(`📅 *This Week (${rangeLabel})*\n\n${sections.join('\n\n')}\n\n${summary}`, { parse_mode: 'Markdown' });
});

bot.command('past7', async (ctx) => {
  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - 6);
  const todayStr = toLocalDateString(now);
  const pastStr = toLocalDateString(past);

  const transactions = await fetchTransactionsByDateRange(pastStr, todayStr);

  if (transactions.length === 0) {
    await ctx.reply('No transactions in the last 7 days.');
    return;
  }

  const lines = transactions.map((t, i) => {
    const amount = `\`$${t.amount.toFixed(2)}\``;
    const date = formatDisplayDate(t.transaction_date);
    if (t.type === 'expense') return `${i + 1}. 🧾 ${escapeMarkdown(t.title ?? 'Untitled')} — ${amount} — ${date}`;
    if (t.type === 'income') return `${i + 1}. 💵 ${escapeMarkdown(t.title ?? 'Untitled')} — ${amount} — ${date}`;
    return `${i + 1}. 🔄 ${escapeMarkdown(t.from_label)} → ${escapeMarkdown(t.to_label)} — ${amount} — ${date}`;
  });

  const totalIn = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const net = totalIn - totalOut;
  const netSign = net >= 0 ? '+' : '-';

  const summary = [
    '',
    '─────────────────',
    `💵 Income:   \`$${totalIn.toFixed(2)}\``,
    `🧾 Expenses: \`$${totalOut.toFixed(2)}\``,
    `📊 Net:      \`${netSign}$${Math.abs(net).toFixed(2)}\``,
  ].join('\n');

  await ctx.reply(`🕐 *Past 7 Days*\n\n${lines.join('\n')}${summary}`, { parse_mode: 'Markdown' });
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
  { command: 'today', description: 'Show all transactions logged for today' },
  { command: 'yesterday', description: 'Show all transactions logged for yesterday' },
  { command: 'week', description: "Show this week's transactions grouped by day" },
  { command: 'past7', description: 'Show all transactions from the last 7 days' },
  { command: 'recent', description: 'Show 10 most recent transactions' },
  { command: 'help', description: 'Show available commands' },
]);

if (process.env.NODE_ENV !== 'production') {
  bot.start();
}
