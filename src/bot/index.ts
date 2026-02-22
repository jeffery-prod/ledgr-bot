import { Bot } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import * as dotenv from 'dotenv';
import type { MyContext } from '../types/context';
import { mainKeyboard } from '../keyboards/mainKeyboard';
import { addTransaction } from '../conversations/addTransaction';
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
bot.use(createConversation(addTransaction));
bot.use(createConversation(addIncome));
bot.use(createConversation(addTransfer));

bot.command('start', async (ctx) => {
  await ctx.conversation.exit();
  await ctx.reply('What would you like to do?', {
    reply_markup: mainKeyboard,
  });
});

bot.callbackQuery('menu_add', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter('addTransaction');
});

bot.callbackQuery('menu_income', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter('addIncome');
});

bot.callbackQuery('menu_transfer', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter('addTransfer');
});

bot.callbackQuery('menu_cancel', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText('Cancelled.');
});

if (process.env.NODE_ENV !== 'production') {
  bot.start();
}
