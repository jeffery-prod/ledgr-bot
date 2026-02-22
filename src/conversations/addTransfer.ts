import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { accountKeyboard, buildToAccountKeyboard } from '../keyboards/accountKeyboard';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
import { dateKeyboard } from '../keyboards/dateKeyboard';
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
  let amount = 0;
  while (true) {
    const amountCtx = await conversation.waitFor('message:text');
    amount = parseFloat(amountCtx.message.text);
    if (!isNaN(amount) && amount > 0) {
      await amountCtx.reply('Select a date:', { reply_markup: dateKeyboard });
      break;
    }
    await amountCtx.reply('Invalid amount. Please enter a valid number:');
  }
  const dateSelCtx = await conversation.waitForCallbackQuery(/^date_|^cancel$/);
  await dateSelCtx.answerCallbackQuery();
  if (dateSelCtx.callbackQuery.data === 'cancel') {
    await dateSelCtx.editMessageText('Cancelled.');
    return;
  }

  let transactionDate: string | null = null;
  if (dateSelCtx.callbackQuery.data === 'date_today') {
    transactionDate = parseDate('today');
    await dateSelCtx.editMessageText(`Date: today`);
  } else if (dateSelCtx.callbackQuery.data === 'date_yesterday') {
    transactionDate = parseDate('yesterday');
    await dateSelCtx.editMessageText(`Date: yesterday`);
  } else {
    await dateSelCtx.editMessageText('Enter the date: (MM/DD/YYYY)');
    const dateTextCtx = await conversation.waitFor('message:text');
    transactionDate = parseDate(dateTextCtx.message.text);
    if (!transactionDate) {
      await dateTextCtx.reply('Invalid date. Please try again.');
      return;
    }
  }

  await ctx.reply('Any notes? (type a note or "skip")');
  const notesCtx = await conversation.waitFor('message:text');
  const notes = notesCtx.message.text.toLowerCase() === 'skip' ? null : notesCtx.message.text;

  const confirmText = [
    `━━━━━━━━━━━━━━━━━━━━`,
    `        TRANSFER`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `From      : ${fromAccount}`,
    `To        : ${toAccount}`,
    `Amount    : $${amount.toFixed(2)}`,
    `Date      : ${transactionDate}`,
    ...(notes ? [`Notes     : ${notes}`] : []),
    `━━━━━━━━━━━━━━━━━━━━`,
  ].join('\n');

  await notesCtx.reply(confirmText, { reply_markup: confirmKeyboard });
  const confirmCtx = await conversation.waitForCallbackQuery(['confirm', 'cancel']);
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.callbackQuery.data === 'confirm') {
    const fromAccountId = await getAccountId(fromAccount);
    const toAccountId = await getAccountId(toAccount);

    if (!fromAccountId || !toAccountId) {
      await confirmCtx.editMessageText('Something went wrong. Please try again.');
      return;
    }

    const saved = await saveTransfer(fromAccountId, toAccountId, amount, transactionDate!, notes);
    if (saved) {
      await confirmCtx.editMessageText('Transfer saved.');
    } else {
      await confirmCtx.editMessageText('Failed to save. Please try again.');
    }
  } else {
    await confirmCtx.editMessageText('Cancelled.');
  }
}
