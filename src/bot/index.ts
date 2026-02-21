  import { Bot, webhookCallback } from 'grammy';
  import * as dotenv from 'dotenv';

  dotenv.config();

  export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

  bot.use(async (ctx, next) => {
    if (ctx.from?.id !== Number(process.env.TELEGRAM_USER_ID)) {
        await ctx.reply('You are not my daddy.')
        return;
    }
    await next();
  });

  bot.command('start', (ctx) => ctx.reply('start: testing the command'));

  const isProduction = process.env.NODE_ENV === 'prod';

  if (!isProduction) {
    bot.start();
  }

  export default isProduction ? webhookCallback(bot, 'http') : null;