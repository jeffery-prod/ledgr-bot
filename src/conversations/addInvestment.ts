import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { investmentKeyboard } from '../keyboards/investmentKeyboard';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
import { investmentLabels } from '../constants/labels';

export async function addInvestment(conversation: Conversation<MyContext>, ctx: MyContext) {
  // Step 1: Investment account
  await ctx.reply('Which investment account?', { reply_markup: investmentKeyboard });
  const invCtx = await conversation.waitForCallbackQuery(/^inv_|^cancel$/);
  await invCtx.answerCallbackQuery();
  if (invCtx.callbackQuery.data === 'cancel') {
    await invCtx.editMessageText('❌ Cancelled.');
    return;
  }
  const account = investmentLabels[invCtx.callbackQuery.data];

  // Step 2: Current balance
  await invCtx.editMessageText(`📈 ${account}\n\nEnter the current balance:`);
  const balanceCtx = await conversation.waitFor('message:text');
  const balance = parseFloat(balanceCtx.message.text);

  if (isNaN(balance) || balance < 0) {
    await balanceCtx.reply('❌ Invalid balance. Please try again.');
    return;
  }

  // Step 3: Confirmation
  await balanceCtx.reply(
    `Confirm balance snapshot?\n\n━━━━━━━━━━━━━━━\n📈 Investment\n${account}\n💰 $${balance.toFixed(2)}\n━━━━━━━━━━━━━━━`,
    { reply_markup: confirmKeyboard }
  );
  const confirmCtx = await conversation.waitForCallbackQuery(['confirm', 'cancel']);
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.callbackQuery.data === 'confirm') {
    // TODO: Save to DB
    await confirmCtx.editMessageText(`✅ Balance recorded!\n\n${account} — $${balance.toFixed(2)}`);
  } else {
    await confirmCtx.editMessageText('❌ Cancelled.');
  }
}
