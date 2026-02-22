import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { categoryKeyboard } from '../keyboards/categoryKeyboard';
import { paymentKeyboard } from '../keyboards/paymentKeyboard';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
import { dateKeyboard } from '../keyboards/dateKeyboard';
import { categoryLabels, paymentLabels } from '../constants/labels';
import { parseDate } from '../utils/parseDate';
import { getExpenseTypeId, getAccountId, saveExpense } from '../database/queries';

export async function addTransaction(conversation: Conversation<MyContext>, ctx: MyContext) {
  await ctx.reply('What category is this expense?', { reply_markup: categoryKeyboard });
  const catCtx = await conversation.waitForCallbackQuery(/^cat_|^cancel$/);
  await catCtx.answerCallbackQuery();
  if (catCtx.callbackQuery.data === 'cancel') {
    await catCtx.editMessageText('Cancelled.');
    return;
  }
  const category = categoryLabels[catCtx.callbackQuery.data];

  await catCtx.editMessageText(`Category: ${category}\n\nWhich payment method?`, { reply_markup: paymentKeyboard });
  const payCtx = await conversation.waitForCallbackQuery(/^pay_|^cancel$/);
  await payCtx.answerCallbackQuery();
  if (payCtx.callbackQuery.data === 'cancel') {
    await payCtx.editMessageText('Cancelled.');
    return;
  }
  const payment = paymentLabels[payCtx.callbackQuery.data];

  await payCtx.editMessageText(`Category: ${category}\nPayment: ${payment}\n\nEnter the amount:`);
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
    `         EXPENSE`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Category  : ${category}`,
    `Payment   : ${payment}`,
    `Amount    : $${amount.toFixed(2)}`,
    `Date      : ${transactionDate}`,
    ...(notes ? [`Notes     : ${notes}`] : []),
    `━━━━━━━━━━━━━━━━━━━━`,
  ].join('\n');

  await notesCtx.reply(confirmText, { reply_markup: confirmKeyboard });
  const confirmCtx = await conversation.waitForCallbackQuery(['confirm', 'cancel']);
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.callbackQuery.data === 'confirm') {
    const expenseTypeId = await getExpenseTypeId(category);
    const accountId = await getAccountId(payment);

    if (!expenseTypeId || !accountId) {
      await confirmCtx.editMessageText('Something went wrong. Please try again.');
      return;
    }

    const saved = await saveExpense(expenseTypeId, accountId, amount, transactionDate!, notes);
    if (saved) {
      await confirmCtx.editMessageText('Expense saved.');
    } else {
      await confirmCtx.editMessageText('Failed to save. Please try again.');
    }
  } else {
    await confirmCtx.editMessageText('Cancelled.');
  }
}
