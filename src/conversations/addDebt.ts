import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { debtKeyboard } from '../keyboards/debtKeyboard';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
import { debtLabels } from '../constants/labels';

export async function addDebt(conversation: Conversation<MyContext>, ctx: MyContext) {
  // Step 1: Debt type
  await ctx.reply('What type of debt payment?', { reply_markup: debtKeyboard });
  const debtCtx = await conversation.waitForCallbackQuery(/^debt_|^cancel$/);
  await debtCtx.answerCallbackQuery();
  if (debtCtx.callbackQuery.data === 'cancel') {
    await debtCtx.editMessageText('❌ Cancelled.');
    return;
  }
  const debtType = debtLabels[debtCtx.callbackQuery.data];

  // Step 2: Amount
  await debtCtx.editMessageText(`💳 ${debtType}\n\nEnter the amount:`);
  const amountCtx = await conversation.waitFor('message:text');
  const amount = parseFloat(amountCtx.message.text);

  if (isNaN(amount) || amount <= 0) {
    await amountCtx.reply('❌ Invalid amount. Please try again.');
    return;
  }

  // Step 3: Confirmation
  await amountCtx.reply(
    `Confirm debt payment?\n\n━━━━━━━━━━━━━━━\n💳 Debt Payment\n${debtType}\n💵 $${amount.toFixed(2)}\n━━━━━━━━━━━━━━━`,
    { reply_markup: confirmKeyboard }
  );
  const confirmCtx = await conversation.waitForCallbackQuery(['confirm', 'cancel']);
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.callbackQuery.data === 'confirm') {
    // TODO: Save to DB
    await confirmCtx.editMessageText(`✅ Debt payment saved!\n\n${debtType} — $${amount.toFixed(2)}`);
  } else {
    await confirmCtx.editMessageText('❌ Cancelled.');
  }
}
