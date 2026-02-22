import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { incomeKeyboard } from '../keyboards/incomeKeyboard';
import { accountKeyboard } from '../keyboards/accountKeyboard';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
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

  await incCtx.editMessageText(`Income type: ${incomeType}\n\nWhich account is this going into?`, { reply_markup: accountKeyboard });
  const accountCtx = await conversation.waitForCallbackQuery(/^account_|^cancel$/);
  await accountCtx.answerCallbackQuery();
  if (accountCtx.callbackQuery.data === 'cancel') {
    await accountCtx.editMessageText('Cancelled.');
    return;
  }
  const account = accountLabels[accountCtx.callbackQuery.data];

  await accountCtx.editMessageText(`Income type: ${incomeType}\nAccount: ${account}\n\nEnter the amount:`);
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
    `Confirm income?\n\n━━━━━━━━━━━━━━━\nIncome\nType: ${incomeType}\nAccount: ${account}\nAmount: $${amount.toFixed(2)}\nDate: ${transactionDate}${notes ? `\nNotes: ${notes}` : ''}\n━━━━━━━━━━━━━━━`,
    { reply_markup: confirmKeyboard }
  );
  const confirmCtx = await conversation.waitForCallbackQuery(['confirm', 'cancel']);
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.callbackQuery.data === 'confirm') {
    const incomeTypeId = await getIncomeTypeId(incomeType);
    const accountId = await getAccountId(account);

    if (!incomeTypeId || !accountId) {
      await confirmCtx.editMessageText('Something went wrong. Please try again.');
      return;
    }

    const saved = await saveIncome(incomeTypeId, accountId, amount, transactionDate, notes);
    if (saved) {
      await confirmCtx.editMessageText(`Income saved!\n\nType: ${incomeType}\nAccount: ${account}\nAmount: $${amount.toFixed(2)}\nDate: ${transactionDate}`);
    } else {
      await confirmCtx.editMessageText('Failed to save. Please try again.');
    }
  } else {
    await confirmCtx.editMessageText('Cancelled.');
  }
}
