import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { incomeKeyboard } from '../keyboards/incomeKeyboard';
import { accountKeyboard } from '../keyboards/accountKeyboard';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
import { incomeLabels, accountLabels } from '../constants/labels';

export async function addIncome(conversation: Conversation<MyContext>, ctx: MyContext) {
  // Step 1: Income type
  await ctx.reply('What type of income?', { reply_markup: incomeKeyboard });
  const incCtx = await conversation.waitForCallbackQuery(/^inc_|^cancel$/);
  await incCtx.answerCallbackQuery();
  if (incCtx.callbackQuery.data === 'cancel') {
    await incCtx.editMessageText('Cancelled.');
    return;
  }
  const incomeType = incomeLabels[incCtx.callbackQuery.data];

  // Step 2: Account
  await incCtx.editMessageText(`Income type: ${incomeType}\n\nWhich account is this going into?`, { reply_markup: accountKeyboard });
  const accountCtx = await conversation.waitForCallbackQuery(/^account_|^cancel$/);
  await accountCtx.answerCallbackQuery();
  if (accountCtx.callbackQuery.data === 'cancel') {
    await accountCtx.editMessageText('Cancelled.');
    return;
  }
  const account = accountLabels[accountCtx.callbackQuery.data];

  // Step 3: Amount
  await accountCtx.editMessageText(`Income type: ${incomeType}\nAccount: ${account}\n\nEnter the amount:`);
  const amountCtx = await conversation.waitFor('message:text');
  const amount = parseFloat(amountCtx.message.text);

  if (isNaN(amount) || amount <= 0) {
    await amountCtx.reply('Invalid amount. Please try again.');
    return;
  }

  // Step 4: Confirmation
  await amountCtx.reply(
    `Confirm income?\n\n━━━━━━━━━━━━━━━\nIncome\nType: ${incomeType}\nAccount: ${account}\nAmount: $${amount.toFixed(2)}\n━━━━━━━━━━━━━━━`,
    { reply_markup: confirmKeyboard }
  );
  const confirmCtx = await conversation.waitForCallbackQuery(['confirm', 'cancel']);
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.callbackQuery.data === 'confirm') {
    // TODO: Save to DB
    await confirmCtx.editMessageText(`Income saved!\n\nType: ${incomeType}\nAccount: ${account}\nAmount: $${amount.toFixed(2)}`);
  } else {
    await confirmCtx.editMessageText('Cancelled.');
  }
}
