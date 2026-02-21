import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { accountKeyboard, buildToAccountKeyboard } from '../keyboards/accountKeyboard';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
import { accountLabels } from '../constants/labels';

export async function addTransfer(conversation: Conversation<MyContext>, ctx: MyContext) {
  // Step 1: From account
  await ctx.reply('Where are you transferring from?', { reply_markup: accountKeyboard });
  const fromCtx = await conversation.waitForCallbackQuery(/^account_|^cancel$/);
  await fromCtx.answerCallbackQuery();
  if (fromCtx.callbackQuery.data === 'cancel') {
    await fromCtx.editMessageText('Cancelled.');
    return;
  }
  const fromKey = fromCtx.callbackQuery.data;
  const fromAccount = accountLabels[fromKey];

  // Step 2: To account
  await fromCtx.editMessageText(`From: ${fromAccount}\n\nWhere are you transferring to?`, {
    reply_markup: buildToAccountKeyboard(fromKey),
  });
  const toCtx = await conversation.waitForCallbackQuery(/^account_|^cancel$/);
  await toCtx.answerCallbackQuery();
  if (toCtx.callbackQuery.data === 'cancel') {
    await toCtx.editMessageText('Cancelled.');
    return;
  }
  const toAccount = accountLabels[toCtx.callbackQuery.data];

  // Step 3: Amount
  await toCtx.editMessageText(`From: ${fromAccount}\nTo: ${toAccount}\n\nEnter the amount:`);
  const amountCtx = await conversation.waitFor('message:text');
  const amount = parseFloat(amountCtx.message.text);

  if (isNaN(amount) || amount <= 0) {
    await amountCtx.reply('Invalid amount. Please try again.');
    return;
  }

  // Step 4: Confirmation
  await amountCtx.reply(
    `Confirm transfer?\n\n━━━━━━━━━━━━━━━\nTransfer\nFrom: ${fromAccount}\nTo: ${toAccount}\nAmount: $${amount.toFixed(2)}\n━━━━━━━━━━━━━━━`,
    { reply_markup: confirmKeyboard }
  );
  const confirmCtx = await conversation.waitForCallbackQuery(['confirm', 'cancel']);
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.callbackQuery.data === 'confirm') {
    // TODO: Save to DB
    await confirmCtx.editMessageText(`Transfer saved!\n\n${fromAccount} -> ${toAccount} — $${amount.toFixed(2)}`);
  } else {
    await confirmCtx.editMessageText('Cancelled.');
  }
}
