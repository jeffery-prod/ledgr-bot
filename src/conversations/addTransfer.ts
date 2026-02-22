import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { accountKeyboard, buildToAccountKeyboard } from '../keyboards/accountKeyboard';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
import { accountLabels } from '../constants/labels';
import { parseDate } from '../utils/parseDate';
import { getAccountId, saveTransfer } from '../database/queries';

export async function addTransfer(conversation: Conversation<MyContext>, ctx: MyContext) {
  await ctx.reply('Where are you transferring from?', { reply_markup: accountKeyboard });
  const fromCtx = await conversation.waitForCallbackQuery(/^account_|^cancel$/);
  await fromCtx.answerCallbackQuery();
  if (fromCtx.callbackQuery.data === 'cancel') {
    await fromCtx.editMessageText('Cancelled.');
    return;
  }
  const fromKey = fromCtx.callbackQuery.data;
  const fromAccount = accountLabels[fromKey];

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

  await toCtx.editMessageText(`From: ${fromAccount}\nTo: ${toAccount}\n\nEnter the amount:`);
  const amountCtx = await conversation.waitFor('message:text');
  const amount = parseFloat(amountCtx.message.text);
  if (isNaN(amount) || amount <= 0) {
    await amountCtx.reply('Invalid amount. Please try again.');
    return;
  }

  await amountCtx.reply('Enter the date:\n(today, yesterday, or MM/DD/YYYY)');
  const dateCtx = await conversation.waitFor('message:text');
  const transactionDate = parseDate(dateCtx.message.text);
  if (!transactionDate) {
    await dateCtx.reply('Invalid date. Please try again.');
    return;
  }

  await dateCtx.reply('Any notes? (type a note or "skip")');
  const notesCtx = await conversation.waitFor('message:text');
  const notes = notesCtx.message.text.toLowerCase() === 'skip' ? null : notesCtx.message.text;

  await notesCtx.reply(
    `Confirm transfer?\n\n━━━━━━━━━━━━━━━\nTransfer\nFrom: ${fromAccount}\nTo: ${toAccount}\nAmount: $${amount.toFixed(2)}\nDate: ${transactionDate}${notes ? `\nNotes: ${notes}` : ''}\n━━━━━━━━━━━━━━━`,
    { reply_markup: confirmKeyboard }
  );
  const confirmCtx = await conversation.waitForCallbackQuery(['confirm', 'cancel']);
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.callbackQuery.data === 'confirm') {
    const fromAccountId = await getAccountId(fromAccount);
    const toAccountId = await getAccountId(toAccount);

    if (!fromAccountId || !toAccountId) {
      await confirmCtx.editMessageText('Something went wrong. Please try again.');
      return;
    }

    const saved = await saveTransfer(fromAccountId, toAccountId, amount, transactionDate, notes);
    if (saved) {
      await confirmCtx.editMessageText(`Transfer saved!\n\n${fromAccount} -> ${toAccount} — $${amount.toFixed(2)}\nDate: ${transactionDate}`);
    } else {
      await confirmCtx.editMessageText('Failed to save. Please try again.');
    }
  } else {
    await confirmCtx.editMessageText('Cancelled.');
  }
}
