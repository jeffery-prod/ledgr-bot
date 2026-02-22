import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { categoryKeyboard } from '../keyboards/categoryKeyboard';
import { paymentTypeKeyboard, buildCreditKeyboard } from '../keyboards/paymentKeyboard';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
import { dateKeyboard } from '../keyboards/dateKeyboard';
import { categoryLabels } from '../constants/labels';
import { parseDate } from '../utils/parseDate';
import { getExpenseTypeId, saveExpense, getAccountsByType } from '../database/queries';

export async function addExpense(conversation: Conversation<MyContext>, ctx: MyContext) {
  await ctx.reply('How did you pay?', { reply_markup: paymentTypeKeyboard });
  const payTypeCtx = await conversation.waitForCallbackQuery(/^pay_type_|^cancel$/);
  await payTypeCtx.answerCallbackQuery();
  if (payTypeCtx.callbackQuery.data === 'cancel') {
    await payTypeCtx.editMessageText('Cancelled.');
    return;
  }

  let accountId: string | null = null;
  let accountName: string | null = null;
  const payType = payTypeCtx.callbackQuery.data;

  if (payType === 'pay_type_credit') {
    const creditKeyboard = await conversation.external(() => buildCreditKeyboard());
    await payTypeCtx.editMessageText('Which credit card?', { reply_markup: creditKeyboard });
    const cardCtx = await conversation.waitForCallbackQuery(/^credit_|^cancel$/);
    await cardCtx.answerCallbackQuery();
    if (cardCtx.callbackQuery.data === 'cancel') {
      await cardCtx.editMessageText('Cancelled.');
      return;
    }
    accountId = cardCtx.callbackQuery.data.replace('credit_', '');
    const creditAccounts = await conversation.external(() => getAccountsByType('CREDIT'));
    accountName = creditAccounts.find(a => a.id === accountId)?.name ?? 'Credit Card';
    await cardCtx.editMessageText(`Payment: ${accountName}`);
  } else if (payType === 'pay_type_debit') {
    const accounts = await conversation.external(() => getAccountsByType('CHECKING'));
    if (!accounts.length) {
      await payTypeCtx.editMessageText('No checking account found. Please set one up first.');
      return;
    }
    accountId = accounts[0].id;
    accountName = accounts[0].name;
    await payTypeCtx.editMessageText(`Payment: ${accountName}`);
  } else if (payType === 'pay_type_cash') {
    const accounts = await conversation.external(() => getAccountsByType('CASH'));
    if (!accounts.length) {
      await payTypeCtx.editMessageText('No cash account found. Please set one up first.');
      return;
    }
    accountId = accounts[0].id;
    accountName = accounts[0].name;
    await payTypeCtx.editMessageText(`Payment: ${accountName}`);
  }

  await ctx.reply(`Payment: ${accountName}\n\nWhat category is this expense?`, { reply_markup: categoryKeyboard });
  const catCtx = await conversation.waitForCallbackQuery(/^cat_|^cancel$/);
  await catCtx.answerCallbackQuery();
  if (catCtx.callbackQuery.data === 'cancel') {
    await catCtx.editMessageText('Cancelled.');
    return;
  }
  const category = categoryLabels[catCtx.callbackQuery.data];

  await catCtx.editMessageText(`Payment: ${accountName}\nCategory: ${category}\n\nEnter the amount:`);
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
    await dateSelCtx.editMessageText('Date: today');
  } else if (dateSelCtx.callbackQuery.data === 'date_yesterday') {
    transactionDate = parseDate('yesterday');
    await dateSelCtx.editMessageText('Date: yesterday');
  } else {
    await dateSelCtx.editMessageText('Enter the date (MM/DD/YYYY):');
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
    `Payment   : ${accountName}`,
    `Category  : ${category}`,
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
