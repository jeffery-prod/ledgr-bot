import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { incomeKeyboard } from '../keyboards/incomeKeyboard';
import { incomeAccountKeyboard } from '../keyboards/accountKeyboard';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
import { dateKeyboard } from '../keyboards/dateKeyboard';
import { incomeLabels, accountLabels } from '../constants/labels';
import { parseDate } from '../utils/parseDate';
import { getIncomeTypeId, getAccountId, saveIncome } from '../database/queries';

export async function addIncome(conversation: Conversation<MyContext>, ctx: MyContext) {
  await ctx.reply('What type of income?', { reply_markup: incomeKeyboard });
  const incCtx = await conversation.waitForCallbackQuery(/^inc_|^cancel$/);
  await incCtx.answerCallbackQuery();
  if (incCtx.callbackQuery.data === 'cancel') {
    await incCtx.editMessageText('Cancelled.');
    return;
  }
  const incomeType = incomeLabels[incCtx.callbackQuery.data];

  await incCtx.editMessageText(`Income type: ${incomeType}\n\nWhich account is this going into?`, { reply_markup: incomeAccountKeyboard });
  const accountCtx = await conversation.waitForCallbackQuery(/^account_|^cancel$/);
  await accountCtx.answerCallbackQuery();
  if (accountCtx.callbackQuery.data === 'cancel') {
    await accountCtx.editMessageText('Cancelled.');
    return;
  }
  const account = accountLabels[accountCtx.callbackQuery.data];

  await accountCtx.editMessageText(`Income type: ${incomeType}\nAccount: ${account}\n\nEnter the amount:`);
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
    `         INCOME`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Type      : ${incomeType}`,
    `Account   : ${account}`,
    `Amount    : $${amount.toFixed(2)}`,
    `Date      : ${transactionDate}`,
    ...(notes ? [`Notes     : ${notes}`] : []),
    `━━━━━━━━━━━━━━━━━━━━`,
  ].join('\n');

  await notesCtx.reply(confirmText, { reply_markup: confirmKeyboard });
  const confirmCtx = await conversation.waitForCallbackQuery(['confirm', 'cancel']);
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.callbackQuery.data === 'confirm') {
    const incomeTypeId = await getIncomeTypeId(incomeType);
    const accountId = await getAccountId(account);

    if (!incomeTypeId || !accountId) {
      await confirmCtx.editMessageText('Something went wrong. Please try again.');
      return;
    }

    const saved = await saveIncome(incomeTypeId, accountId, amount, transactionDate!, notes);
    if (saved) {
      await confirmCtx.editMessageText('Income saved.');
    } else {
      await confirmCtx.editMessageText('Failed to save. Please try again.');
    }
  } else {
    await confirmCtx.editMessageText('Cancelled.');
  }
}
