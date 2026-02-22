import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { categoryKeyboard } from '../keyboards/categoryKeyboard';
import { paymentTypeKeyboard, checkingKeyboard, creditKeyboard } from '../keyboards/paymentKeyboard';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
import { notesKeyboard } from '../keyboards/notesKeyboard';
import { dateKeyboard } from '../keyboards/dateKeyboard';
import { CATEGORY_CALLBACK_MAP } from '../constants/categories';
import { ACCOUNTS, CHECKING_CALLBACK_MAP, CREDIT_CALLBACK_MAP } from '../constants/accounts';
import { CATEGORY_LABELS, CHECKING_LABELS, CREDIT_LABELS } from '../constants/labels';
import { parseDate } from '../utils/parseDate';
import { formatDisplayDate, formatLoggedAt, escapeMarkdown } from '../utils/formatDate';
import { getExpenseTypeId, getAccountId, saveExpense } from '../database/queries';

export async function addExpense(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
  await ctx.reply('How did you pay?', { reply_markup: paymentTypeKeyboard });
  const payTypeCtx = await conversation.waitForCallbackQuery(/^pay_type_|^cancel$/);
  await payTypeCtx.answerCallbackQuery();
  if (payTypeCtx.callbackQuery.data === 'cancel') {
    await payTypeCtx.editMessageText('Cancelled.');
    return;
  }

  let accountName: string;
  let accountLabel: string;
  let accountType: string;

  const payType = payTypeCtx.callbackQuery.data;
  const payTypeLabel = payType === 'pay_type_credit' ? '💳 Credit'
    : payType === 'pay_type_debit' ? '🏦 Debit'
    : '💵 Cash';
  await payTypeCtx.editMessageText(`How did you pay? → ${payTypeLabel}`);

  if (payType === 'pay_type_credit') {
    await ctx.reply('Which credit card?', { reply_markup: creditKeyboard });
    const cardCtx = await conversation.waitForCallbackQuery(/^credit_|^cancel$/);
    await cardCtx.answerCallbackQuery();
    if (cardCtx.callbackQuery.data === 'cancel') {
      await cardCtx.editMessageText('Cancelled.');
      return;
    }
    accountName = CREDIT_CALLBACK_MAP[cardCtx.callbackQuery.data];
    accountLabel = CREDIT_LABELS[cardCtx.callbackQuery.data];
    accountType = 'CREDIT';
    await cardCtx.editMessageText(`Which credit card? → ${accountLabel}`);
  } else if (payType === 'pay_type_debit') {
    await ctx.reply('Which account?', { reply_markup: checkingKeyboard });
    const debitCtx = await conversation.waitForCallbackQuery(/^debit_|^cancel$/);
    await debitCtx.answerCallbackQuery();
    if (debitCtx.callbackQuery.data === 'cancel') {
      await debitCtx.editMessageText('Cancelled.');
      return;
    }
    accountName = CHECKING_CALLBACK_MAP[debitCtx.callbackQuery.data];
    accountLabel = CHECKING_LABELS[debitCtx.callbackQuery.data];
    accountType = 'CHECKING';
    await debitCtx.editMessageText(`Which account? → ${accountLabel}`);
  } else {
    accountName = ACCOUNTS.CASH;
    accountLabel = 'Cash';
    accountType = 'CASH';
  }

  await ctx.reply('What category is this expense?', { reply_markup: categoryKeyboard });
  const catCtx = await conversation.waitForCallbackQuery(/^cat_|^cancel$/);
  await catCtx.answerCallbackQuery();
  if (catCtx.callbackQuery.data === 'cancel') {
    await catCtx.editMessageText('Cancelled.');
    return;
  }
  const categoryName = CATEGORY_CALLBACK_MAP[catCtx.callbackQuery.data];
  const categoryLabel = CATEGORY_LABELS[catCtx.callbackQuery.data];
  await catCtx.editMessageText(`What category? → ${categoryLabel}`);

  await ctx.reply('Enter the amount:');
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
    await dateSelCtx.editMessageText(`Select a date: → Today`);
  } else if (dateSelCtx.callbackQuery.data === 'date_yesterday') {
    transactionDate = parseDate('yesterday');
    await dateSelCtx.editMessageText(`Select a date: → Yesterday`);
  } else {
    await dateSelCtx.editMessageText('Select a date: → Custom');
    await ctx.reply('Enter the date (MM/DD/YYYY):');
    while (true) {
      const dateTextCtx = await conversation.waitFor('message:text');
      transactionDate = parseDate(dateTextCtx.message.text);
      if (transactionDate) break;
      await dateTextCtx.reply('Invalid date. Please enter a valid date (MM/DD/YYYY):');
    }
  }

  await ctx.reply('Any notes?', { reply_markup: notesKeyboard });
  const notesSelCtx = await conversation.waitForCallbackQuery(/^notes_|^cancel$/);
  await notesSelCtx.answerCallbackQuery();
  if (notesSelCtx.callbackQuery.data === 'cancel') {
    await notesSelCtx.editMessageText('Cancelled.');
    return;
  }
  let notes: string | null = null;
  if (notesSelCtx.callbackQuery.data === 'notes_yes') {
    await notesSelCtx.editMessageText('Any notes? → Yes');
    await ctx.reply('Enter your note:');
    const noteTextCtx = await conversation.waitFor('message:text');
    notes = noteTextCtx.message.text;
  } else {
    await notesSelCtx.editMessageText('Any notes? → No');
  }

  const displayDate = formatDisplayDate(transactionDate!);
  const confirmText = [
    `*EXPENSE*`,
    ``,
    `*Payment*  : ${escapeMarkdown(accountLabel)} (${accountType})`,
    `*Category* : ${escapeMarkdown(categoryLabel)}`,
    `*Amount*   : \`$${amount.toFixed(2)}\``,
    `*Date*     : ${displayDate}`,
    ...(notes ? [`*Notes*    : ${escapeMarkdown(notes)}`] : []),
  ].join('\n');

  await ctx.reply(confirmText, { reply_markup: confirmKeyboard, parse_mode: 'Markdown' });
  const confirmCtx = await conversation.waitForCallbackQuery(['confirm', 'cancel']);
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.callbackQuery.data === 'confirm') {
    const expenseTypeId = await getExpenseTypeId(categoryName);
    const accountId = await getAccountId(accountName);

    if (!expenseTypeId || !accountId) {
      await ctx.reply('Something went wrong. Please try again.');
      return;
    }

    const saved = await saveExpense(expenseTypeId, accountId, amount, transactionDate!, notes);
    if (saved) {
      const loggedAt = formatLoggedAt();
      const savedText = [
        `*EXPENSE*`,
        ``,
        `*Payment*  : ${escapeMarkdown(accountLabel)} (${accountType})`,
        `*Category* : ${escapeMarkdown(categoryLabel)}`,
        `*Amount*   : \`$${amount.toFixed(2)}\``,
        `*Date*     : ${displayDate}`,
        ...(notes ? [`*Notes*    : ${escapeMarkdown(notes)}`] : []),
        `*Logged*   : ${loggedAt}`,
      ].join('\n');
      await ctx.reply(`✅ *Expense saved.*\n\n${savedText}`, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply('Failed to save. Please try again.');
    }
  } else {
    await confirmCtx.editMessageText('Cancelled.');
  }
}
