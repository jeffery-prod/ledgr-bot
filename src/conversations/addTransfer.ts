import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { accountKeyboard, buildToAccountKeyboard, investmentAccountKeyboard, savingsKeyboard } from '../keyboards/accountKeyboard';
import { checkingKeyboard } from '../keyboards/paymentKeyboard';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
import { notesKeyboard } from '../keyboards/notesKeyboard';
import { dateKeyboard } from '../keyboards/dateKeyboard';
import { ACCOUNTS, CHECKING_CALLBACK_MAP, INVESTMENT_CALLBACK_MAP, SAVINGS_CALLBACK_MAP } from '../constants/accounts';
import { CHECKING_LABELS, INVESTMENT_LABELS, SAVINGS_LABELS, TRANSFER_ACCOUNT_LABELS } from '../constants/labels';
import { parseDate } from '../utils/parseDate';
import { formatDisplayDate, formatLoggedAt, escapeMarkdown } from '../utils/formatDate';
import { getAccountId, saveTransfer } from '../database/queries';

export async function addTransfer(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
  await ctx.reply('Where are you transferring from?', { reply_markup: accountKeyboard });
  const fromTypeCtx = await conversation.waitForCallbackQuery(/^account_|^cancel$/);
  await fromTypeCtx.answerCallbackQuery();
  if (fromTypeCtx.callbackQuery.data === 'cancel') {
    await fromTypeCtx.editMessageText('Cancelled.');
    return;
  }

  const fromTypeKey = fromTypeCtx.callbackQuery.data;
  let fromAccountName: string;
  let fromAccountLabel: string;
  let fromAccountType: string;

  await fromTypeCtx.editMessageText(`Where are you transferring from? → ${TRANSFER_ACCOUNT_LABELS[fromTypeKey]}`);

  if (fromTypeKey === 'account_checking') {
    await ctx.reply('Which checking account?', { reply_markup: checkingKeyboard });
    const checkCtx = await conversation.waitForCallbackQuery(/^debit_|^cancel$/);
    await checkCtx.answerCallbackQuery();
    if (checkCtx.callbackQuery.data === 'cancel') {
      await checkCtx.editMessageText('Cancelled.');
      return;
    }
    fromAccountName = CHECKING_CALLBACK_MAP[checkCtx.callbackQuery.data];
    fromAccountLabel = CHECKING_LABELS[checkCtx.callbackQuery.data];
    fromAccountType = 'CHECKING';
    await checkCtx.editMessageText(`Which checking account? → ${fromAccountLabel}`);
  } else if (fromTypeKey === 'account_savings') {
    await ctx.reply('Which savings account?', { reply_markup: savingsKeyboard });
    const savCtx = await conversation.waitForCallbackQuery(/^savings_|^cancel$/);
    await savCtx.answerCallbackQuery();
    if (savCtx.callbackQuery.data === 'cancel') {
      await savCtx.editMessageText('Cancelled.');
      return;
    }
    fromAccountName = SAVINGS_CALLBACK_MAP[savCtx.callbackQuery.data];
    fromAccountLabel = SAVINGS_LABELS[savCtx.callbackQuery.data];
    fromAccountType = 'SAVINGS';
    await savCtx.editMessageText(`Which savings account? → ${fromAccountLabel}`);
  } else if (fromTypeKey === 'account_investing') {
    await ctx.reply('Which investment account?', { reply_markup: investmentAccountKeyboard });
    const invCtx = await conversation.waitForCallbackQuery(/^inv_|^cancel$/);
    await invCtx.answerCallbackQuery();
    if (invCtx.callbackQuery.data === 'cancel') {
      await invCtx.editMessageText('Cancelled.');
      return;
    }
    fromAccountName = INVESTMENT_CALLBACK_MAP[invCtx.callbackQuery.data];
    fromAccountLabel = INVESTMENT_LABELS[invCtx.callbackQuery.data];
    fromAccountType = 'INVESTMENT';
    await invCtx.editMessageText(`Which investment account? → ${fromAccountLabel}`);
  } else {
    fromAccountName = ACCOUNTS.CASH;
    fromAccountLabel = 'Cash';
    fromAccountType = 'CASH';
  }

  await ctx.reply('Where are you transferring to?', { reply_markup: buildToAccountKeyboard(fromTypeKey) });
  const toTypeCtx = await conversation.waitForCallbackQuery(/^account_|^cancel$/);
  await toTypeCtx.answerCallbackQuery();
  if (toTypeCtx.callbackQuery.data === 'cancel') {
    await toTypeCtx.editMessageText('Cancelled.');
    return;
  }

  const toTypeKey = toTypeCtx.callbackQuery.data;
  let toAccountName: string;
  let toAccountLabel: string;
  let toAccountType: string;

  await toTypeCtx.editMessageText(`Where are you transferring to? → ${TRANSFER_ACCOUNT_LABELS[toTypeKey]}`);

  if (toTypeKey === 'account_checking') {
    await ctx.reply('Which checking account?', { reply_markup: checkingKeyboard });
    const checkCtx = await conversation.waitForCallbackQuery(/^debit_|^cancel$/);
    await checkCtx.answerCallbackQuery();
    if (checkCtx.callbackQuery.data === 'cancel') {
      await checkCtx.editMessageText('Cancelled.');
      return;
    }
    toAccountName = CHECKING_CALLBACK_MAP[checkCtx.callbackQuery.data];
    toAccountLabel = CHECKING_LABELS[checkCtx.callbackQuery.data];
    toAccountType = 'CHECKING';
    await checkCtx.editMessageText(`Which checking account? → ${toAccountLabel}`);
  } else if (toTypeKey === 'account_savings') {
    await ctx.reply('Which savings account?', { reply_markup: savingsKeyboard });
    const savCtx = await conversation.waitForCallbackQuery(/^savings_|^cancel$/);
    await savCtx.answerCallbackQuery();
    if (savCtx.callbackQuery.data === 'cancel') {
      await savCtx.editMessageText('Cancelled.');
      return;
    }
    toAccountName = SAVINGS_CALLBACK_MAP[savCtx.callbackQuery.data];
    toAccountLabel = SAVINGS_LABELS[savCtx.callbackQuery.data];
    toAccountType = 'SAVINGS';
    await savCtx.editMessageText(`Which savings account? → ${toAccountLabel}`);
  } else if (toTypeKey === 'account_investing') {
    await ctx.reply('Which investment account?', { reply_markup: investmentAccountKeyboard });
    const invCtx = await conversation.waitForCallbackQuery(/^inv_|^cancel$/);
    await invCtx.answerCallbackQuery();
    if (invCtx.callbackQuery.data === 'cancel') {
      await invCtx.editMessageText('Cancelled.');
      return;
    }
    toAccountName = INVESTMENT_CALLBACK_MAP[invCtx.callbackQuery.data];
    toAccountLabel = INVESTMENT_LABELS[invCtx.callbackQuery.data];
    toAccountType = 'INVESTMENT';
    await invCtx.editMessageText(`Which investment account? → ${toAccountLabel}`);
  } else {
    toAccountName = ACCOUNTS.CASH;
    toAccountLabel = 'Cash';
    toAccountType = 'CASH';
  }

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
    `*TRANSFER*`,
    ``,
    `*From*     : ${escapeMarkdown(fromAccountLabel)} (${fromAccountType})`,
    `*To*       : ${escapeMarkdown(toAccountLabel)} (${toAccountType})`,
    `*Amount*   : \`$${amount.toFixed(2)}\``,
    `*Date*     : ${displayDate}`,
    ...(notes ? [`*Notes*    : ${escapeMarkdown(notes)}`] : []),
  ].join('\n');

  await ctx.reply(confirmText, { reply_markup: confirmKeyboard, parse_mode: 'Markdown' });
  const confirmCtx = await conversation.waitForCallbackQuery(['confirm', 'cancel']);
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.callbackQuery.data === 'confirm') {
    const fromAccountId = await getAccountId(fromAccountName);
    const toAccountId = await getAccountId(toAccountName);

    if (!fromAccountId || !toAccountId) {
      await ctx.reply('Something went wrong. Please try again.');
      return;
    }

    const saved = await saveTransfer(fromAccountId, toAccountId, amount, transactionDate!, notes);
    if (saved) {
      const loggedAt = formatLoggedAt();
      const savedText = [
        `*TRANSFER*`,
        ``,
        `*From*     : ${escapeMarkdown(fromAccountLabel)}`,
        `*To*       : ${escapeMarkdown(toAccountLabel)}`,
        `*Amount*   : \`$${amount.toFixed(2)}\``,
        `*Date*     : ${displayDate}`,
        ...(notes ? [`*Notes*    : ${escapeMarkdown(notes)}`] : []),
        `*Logged*   : ${loggedAt}`,
      ].join('\n');
      await ctx.reply(`✅ *Transfer saved.*\n\n${savedText}`, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply('Failed to save. Please try again.');
    }
  } else {
    await confirmCtx.editMessageText('Cancelled.');
  }
}
