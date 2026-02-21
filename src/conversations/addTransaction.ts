import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { categoryKeyboard } from '../keyboards/categoryKeyboard';
import { paymentKeyboard } from '../keyboards/paymentKeyboard';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
import { categoryLabels, paymentLabels } from '../constants/labels';

export async function addTransaction(conversation: Conversation<MyContext>, ctx: MyContext) {
  // Step 1: Category
  await ctx.reply('What category is this expense?', { reply_markup: categoryKeyboard });
  const catCtx = await conversation.waitForCallbackQuery(/^cat_|^cancel$/);
  await catCtx.answerCallbackQuery();
  if (catCtx.callbackQuery.data === 'cancel') {
    await catCtx.editMessageText('Cancelled.');
    return;
  }
  const category = categoryLabels[catCtx.callbackQuery.data];

  // Step 2: Payment method
  await catCtx.editMessageText(`Category: ${category}\n\nWhich payment method?`, { reply_markup: paymentKeyboard });
  const payCtx = await conversation.waitForCallbackQuery(/^pay_|^cancel$/);
  await payCtx.answerCallbackQuery();
  if (payCtx.callbackQuery.data === 'cancel') {
    await payCtx.editMessageText('Cancelled.');
    return;
  }
  const payment = paymentLabels[payCtx.callbackQuery.data];

  // Step 3: Amount
  await payCtx.editMessageText(`Category: ${category}\nPayment: ${payment}\n\nEnter the amount:`);
  const amountCtx = await conversation.waitFor('message:text');
  const amount = parseFloat(amountCtx.message.text);

  if (isNaN(amount) || amount <= 0) {
    await amountCtx.reply('Invalid amount. Please try again.');
    return;
  }

  // Step 4: Confirmation
  await amountCtx.reply(
    `Confirm transaction?\n\n━━━━━━━━━━━━━━━\nExpense\nCategory: ${category}\nPayment: ${payment}\nAmount: $${amount.toFixed(2)}\n━━━━━━━━━━━━━━━`,
    { reply_markup: confirmKeyboard }
  );
  const confirmCtx = await conversation.waitForCallbackQuery(['confirm', 'cancel']);
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.callbackQuery.data === 'confirm') {
    // TODO: Save to DB
    await confirmCtx.editMessageText(`Transaction saved!\n\nCategory: ${category} — $${amount.toFixed(2)}\nPayment: ${payment}`);
  } else {
    await confirmCtx.editMessageText('Cancelled.');
  }
}
