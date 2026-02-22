import { Bot } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import * as dotenv from 'dotenv';
import type { MyContext } from '../types/context';
import { addExpense } from '../conversations/addExpense';
import { addIncome } from '../conversations/addIncome';
import { addTransfer } from '../conversations/addTransfer';

dotenv.config();

export const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN!);

bot.use(async (ctx, next) => {
  if (ctx.from?.id !== Number(process.env.TELEGRAM_USER_ID)) {
    await ctx.reply('Unauthorized.');
    return;
  }
  await next();
});

bot.use(conversations());
bot.use(createConversation(addExpense));
bot.use(createConversation(addIncome));
bot.use(createConversation(addTransfer));

const HELP_TEXT = [
  '*ledgr* — personal finance tracker',
  '',
  '*Commands*',
  '`/expense`  — Log an expense',
  '  Select a payment method, category, amount, date, and optional notes\\.',
  '',
  '`/income`   — Log income',
  '  Select a destination account, income type, amount, date, and optional notes\\.',
  '',
  '`/transfer` — Log a transfer between accounts',
  '  Select a source account, destination account, amount, date, and optional notes\\.',
  '',
  '`/help`     — Show this message',
  '',
  '*Tips*',
  '• At any step, tap *❌ Cancel* to exit the flow without saving\\.',
  '• For the date, you can pick *Today*, *Yesterday*, or enter a custom date in MM/DD/YYYY format\\.',
  '• Notes are optional — tap *No* to skip\\.',
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

bot.api.setMyCommands([
  { command: 'expense', description: 'Log an expense' },
  { command: 'income', description: 'Log income' },
  { command: 'transfer', description: 'Log a transfer' },
  { command: 'help', description: 'Show available commands' },
]);

if (process.env.NODE_ENV !== 'production') {
  bot.start();
}
