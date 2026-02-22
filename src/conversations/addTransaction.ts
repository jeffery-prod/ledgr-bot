import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { categoryKeyboard } from '../keyboards/categoryKeyboard';
import { paymentKeyboard } from '../keyboards/paymentKeyboard';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
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
    `Confirm transaction?\n\n━━━━━━━━━━━━━━━\nExpense\nCategory: ${category}\nPayment: ${payment}\nAmount: $${amount.toFixed(2)}\nDate: ${transactionDate}${notes ? `\nNotes: ${notes}` : ''}\n━━━━━━━━━━━━━━━`,
    { reply_markup: confirmKeyboard }
  );
  const confirmCtx = await conversation.waitForCallbackQuery(['confirm', 'cancel']);
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.callbackQuery.data === 'confirm') {
    const expenseTypeId = await getExpenseTypeId(category);
    const accountId = await getAccountId(payment);

    if (!expenseTypeId || !accountId) {
      await confirmCtx.editMessageText('Something went wrong. Please try again.');
      return;
    }

    const saved = await saveExpense(expenseTypeId, accountId, amount, transactionDate, notes);
    if (saved) {
      await confirmCtx.editMessageText(`Transaction saved!\n\nCategory: ${category} — $${amount.toFixed(2)}\nPayment: ${payment}\nDate: ${transactionDate}`);
    } else {
      await confirmCtx.editMessageText('Failed to save. Please try again.');
    }
  } else {
    await confirmCtx.editMessageText('Cancelled.');
  }
}
