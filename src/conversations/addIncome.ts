import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { incomeKeyboard } from '../keyboards/incomeKeyboard';
import { incomeAccountKeyboard, investmentAccountKeyboard, savingsKeyboard } from '../keyboards/accountKeyboard';
import { checkingKeyboard } from '../keyboards/paymentKeyboard';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
import { notesKeyboard } from '../keyboards/notesKeyboard';
import { dateKeyboard } from '../keyboards/dateKeyboard';
import { INCOME_TYPE_CALLBACK_MAP } from '../constants/categories';
import { ACCOUNTS, CHECKING_CALLBACK_MAP, INVESTMENT_CALLBACK_MAP, SAVINGS_CALLBACK_MAP } from '../constants/accounts';
import { CHECKING_LABELS, INCOME_ACCOUNT_LABELS, INCOME_TYPE_LABELS, INVESTMENT_LABELS, SAVINGS_LABELS } from '../constants/labels';
import { parseDate } from '../utils/parseDate';
import { formatDisplayDate, formatLoggedAt, escapeMarkdown } from '../utils/formatDate';
import { getIncomeTypeId, getAccountId, saveIncome } from '../database/queries';

export async function addIncome(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
  await ctx.reply('Which account is this going into?', { reply_markup: incomeAccountKeyboard });
  const acctTypeCtx = await conversation.waitForCallbackQuery(/^inc_acct_|^cancel$/);
  await acctTypeCtx.answerCallbackQuery();
  if (acctTypeCtx.callbackQuery.data === 'cancel') {
    await acctTypeCtx.editMessageText('Cancelled.');
    return;
  }

  let accountName: string;
  let accountLabel: string;
  let accountType: string;

  const acctTypeLabel = INCOME_ACCOUNT_LABELS[acctTypeCtx.callbackQuery.data];
  await acctTypeCtx.editMessageText(`Which account? → ${acctTypeLabel}`);

  if (acctTypeCtx.callbackQuery.data === 'inc_acct_checking') {
    await ctx.reply('Which checking account?', { reply_markup: checkingKeyboard });
    const checkCtx = await conversation.waitForCallbackQuery(/^debit_|^cancel$/);
    await checkCtx.answerCallbackQuery();
    if (checkCtx.callbackQuery.data === 'cancel') {
      await checkCtx.editMessageText('Cancelled.');
      return;
    }
    accountName = CHECKING_CALLBACK_MAP[checkCtx.callbackQuery.data];
    accountLabel = CHECKING_LABELS[checkCtx.callbackQuery.data];
    accountType = 'CHECKING';
    await checkCtx.editMessageText(`Which checking account? → ${accountLabel}`);
  } else if (acctTypeCtx.callbackQuery.data === 'inc_acct_savings') {
    await ctx.reply('Which savings account?', { reply_markup: savingsKeyboard });
    const savCtx = await conversation.waitForCallbackQuery(/^savings_|^cancel$/);
    await savCtx.answerCallbackQuery();
    if (savCtx.callbackQuery.data === 'cancel') {
      await savCtx.editMessageText('Cancelled.');
      return;
    }
    accountName = SAVINGS_CALLBACK_MAP[savCtx.callbackQuery.data];
    accountLabel = SAVINGS_LABELS[savCtx.callbackQuery.data];
    accountType = 'SAVINGS';
    await savCtx.editMessageText(`Which savings account? → ${accountLabel}`);
  } else if (acctTypeCtx.callbackQuery.data === 'inc_acct_investing') {
    await ctx.reply('Which investment account?', { reply_markup: investmentAccountKeyboard });
    const invCtx = await conversation.waitForCallbackQuery(/^inv_|^cancel$/);
    await invCtx.answerCallbackQuery();
    if (invCtx.callbackQuery.data === 'cancel') {
      await invCtx.editMessageText('Cancelled.');
      return;
    }
    accountName = INVESTMENT_CALLBACK_MAP[invCtx.callbackQuery.data];
    accountLabel = INVESTMENT_LABELS[invCtx.callbackQuery.data];
    accountType = 'INVESTMENT';
    await invCtx.editMessageText(`Which investment account? → ${accountLabel}`);
  } else {
    accountName = ACCOUNTS.CASH;
    accountLabel = 'Cash';
    accountType = 'CASH';
  }

  await ctx.reply('What type of income?', { reply_markup: incomeKeyboard });
  const incCtx = await conversation.waitForCallbackQuery(/^inc_|^cancel$/);
  await incCtx.answerCallbackQuery();
  if (incCtx.callbackQuery.data === 'cancel') {
    await incCtx.editMessageText('Cancelled.');
    return;
  }
  const incomeTypeName = INCOME_TYPE_CALLBACK_MAP[incCtx.callbackQuery.data];
  const incomeTypeLabel = INCOME_TYPE_LABELS[incCtx.callbackQuery.data];
  await incCtx.editMessageText(`What type of income? → ${incomeTypeLabel}`);

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
    await dateSelCtx.editMessageText('Select a date: → Today');
  } else if (dateSelCtx.callbackQuery.data === 'date_yesterday') {
    transactionDate = parseDate('yesterday');
    await dateSelCtx.editMessageText('Select a date: → Yesterday');
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
    `*INCOME*`,
    ``,
    `*Account*  : ${escapeMarkdown(accountLabel)} (${accountType})`,
    `*Type*     : ${escapeMarkdown(incomeTypeLabel)}`,
    `*Amount*   : \`$${amount.toFixed(2)}\``,
    `*Date*     : ${displayDate}`,
    ...(notes ? [`*Notes*    : ${escapeMarkdown(notes)}`] : []),
  ].join('\n');

  await ctx.reply(confirmText, { reply_markup: confirmKeyboard, parse_mode: 'Markdown' });
  const confirmCtx = await conversation.waitForCallbackQuery(['confirm', 'cancel']);
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.callbackQuery.data === 'confirm') {
    const incomeTypeId = await getIncomeTypeId(incomeTypeName);
    const accountId = await getAccountId(accountName);

    if (!incomeTypeId || !accountId) {
      await ctx.reply('Something went wrong. Please try again.');
      return;
    }

    const saved = await saveIncome(incomeTypeId, accountId, amount, transactionDate!, notes);
    if (saved) {
      const loggedAt = formatLoggedAt();
      const savedText = [
        `*INCOME*`,
        ``,
        `*Account*  : ${escapeMarkdown(accountLabel)} (${accountType})`,
        `*Type*     : ${escapeMarkdown(incomeTypeLabel)}`,
        `*Amount*   : \`$${amount.toFixed(2)}\``,
        `*Date*     : ${displayDate}`,
        ...(notes ? [`*Notes*    : ${escapeMarkdown(notes)}`] : []),
        `*Logged*   : ${loggedAt}`,
      ].join('\n');
      await ctx.reply(`✅ *Income saved.*\n\n${savedText}`, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply('Failed to save. Please try again.');
    }
  } else {
    await confirmCtx.editMessageText('Cancelled.');
  }
}
