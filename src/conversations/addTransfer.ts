import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';
import { confirmKeyboard } from '../keyboards/confirmKeyboard';
import { notesKeyboard } from '../keyboards/notesKeyboard';
import { dateKeyboard } from '../keyboards/dateKeyboard';
import { UUID_REGEX, buildAccountTypeKeyboard, buildAccountKeyboard } from '../keyboards/dynamicKeyboards';
import type { AccountType } from '../database/types';
import { parseDate } from '../utils/parseDate';
import { formatDisplayDate, formatLoggedAt, escapeMarkdown } from '../utils/formatDate';
import { buildMessage } from '../utils/formatMessage';
import { fetchAccountTypes, fetchAccountsByType, saveTransfer } from '../database/queries';
import { waitOrCancel } from '../utils/conversation';

type Conv = Conversation<MyContext, MyContext>;

export async function addTransfer(conversation: Conv, ctx: MyContext) {
  const fromAccountType = await pickFromAccountType(conversation, ctx);
  if (!fromAccountType) return;

  const fromAccount = await pickAccount(conversation, ctx, fromAccountType.id, 'Which account?');
  if (!fromAccount) return;

  const toAccountType = await pickToAccountType(conversation, ctx, fromAccountType.allTypes, fromAccountType.id);
  if (!toAccountType) return;

  const toAccount = await pickAccount(conversation, ctx, toAccountType.id, 'Which account?');
  if (!toAccount) return;

  const amount = await enterAmount(conversation, ctx);

  const transactionDate = await pickDate(conversation, ctx);
  if (!transactionDate) return;

  const notesResult = await enterNotes(conversation, ctx);
  if (!notesResult) return;
  const { notes } = notesResult;

  const displayDate = formatDisplayDate(transactionDate);
  const receiptRows = [
    `📤 ${escapeMarkdown(fromAccount.label)}`,
    `📥 ${escapeMarkdown(toAccount.label)}`,
    `💰 \`$${amount.toFixed(2)}\``,
    `📅 ${displayDate}`,
  ];

  const receipt = buildMessage({ header: 'TRANSFER', headerEmoji: '🔄', rows: receiptRows, notes });
  await ctx.reply(receipt, { reply_markup: confirmKeyboard, parse_mode: 'Markdown' });
  const confirmCtx = await waitOrCancel(conversation, ['confirm', 'cancel']);
  if (!confirmCtx) return;

  const saved = await saveTransfer(fromAccount.id, toAccount.id, amount, transactionDate, notes);
  if (saved) {
    const savedReceipt = buildMessage({ header: 'TRANSFER', headerEmoji: '🔄', rows: receiptRows, notes, loggedAt: formatLoggedAt() });
    await ctx.reply(`✅ *Transfer saved.*\n\n${savedReceipt}`, { parse_mode: 'Markdown' });
  } else {
    await ctx.reply('Failed to save. Please try again.');
  }
}

async function pickFromAccountType(conversation: Conv, ctx: MyContext): Promise<{ id: string; label: string; allTypes: AccountType[] } | null> {
  const allTypes = await conversation.external(() => fetchAccountTypes('transfer'));
  await ctx.reply('Where are you transferring from?', { reply_markup: buildAccountTypeKeyboard(allTypes) });
  const typeCtx = await waitOrCancel(conversation, UUID_REGEX);
  if (!typeCtx) return null;
  const id = typeCtx.callbackQuery.data;
  const label = allTypes.find(t => t.id === id)?.display_name ?? id;
  await typeCtx.editMessageText(`Where are you transferring from? → ${label}`);
  return { id, label, allTypes };
}

async function pickToAccountType(conversation: Conv, ctx: MyContext, allTypes: AccountType[], excludeId: string): Promise<{ id: string; label: string } | null> {
  const filtered = allTypes.filter(t => t.id !== excludeId);
  await ctx.reply('Where are you transferring to?', { reply_markup: buildAccountTypeKeyboard(filtered) });
  const typeCtx = await waitOrCancel(conversation, UUID_REGEX);
  if (!typeCtx) return null;
  const id = typeCtx.callbackQuery.data;
  const label = allTypes.find(t => t.id === id)?.display_name ?? id;
  await typeCtx.editMessageText(`Where are you transferring to? → ${label}`);
  return { id, label };
}

async function pickAccount(conversation: Conv, ctx: MyContext, accountTypeId: string, prompt: string): Promise<{ id: string; label: string } | null> {
  const accounts = await conversation.external(() => fetchAccountsByType(accountTypeId));
  await ctx.reply(prompt, { reply_markup: buildAccountKeyboard(accounts) });
  const acctCtx = await waitOrCancel(conversation, UUID_REGEX);
  if (!acctCtx) return null;
  const id = acctCtx.callbackQuery.data;
  const acct = accounts.find(a => a.id === id);
  const label = acct ? (acct.emoji ? `${acct.emoji} ${acct.display_name ?? acct.name}` : (acct.display_name ?? acct.name)) : id;
  await acctCtx.editMessageText(`${prompt} → ${label}`);
  return { id, label };
}

async function enterAmount(conversation: Conv, ctx: MyContext): Promise<number> {
  await ctx.reply('Enter the amount:');
  while (true) {
    const amountCtx = await conversation.waitFor('message:text');
    const amount = parseFloat(amountCtx.message.text);
    if (!isNaN(amount) && amount > 0) return amount;
    await amountCtx.reply('Invalid amount. Please enter a valid number:');
  }
}

async function pickDate(conversation: Conv, ctx: MyContext): Promise<string | null> {
  await ctx.reply('Select a date:', { reply_markup: dateKeyboard });
  const dateSelCtx = await waitOrCancel(conversation, /^date_|^cancel$/);
  if (!dateSelCtx) return null;

  if (dateSelCtx.callbackQuery.data === 'date_today') {
    await dateSelCtx.editMessageText('Select a date: → Today');
    return parseDate('today');
  }
  if (dateSelCtx.callbackQuery.data === 'date_yesterday') {
    await dateSelCtx.editMessageText('Select a date: → Yesterday');
    return parseDate('yesterday');
  }

  await dateSelCtx.editMessageText('Select a date: → Custom');
  await ctx.reply('Enter the date (MM/DD/YYYY):');
  while (true) {
    const dateTextCtx = await conversation.waitFor('message:text');
    const transactionDate = parseDate(dateTextCtx.message.text);
    if (transactionDate) return transactionDate;
    await dateTextCtx.reply('Invalid date. Please enter a valid date (MM/DD/YYYY):');
  }
}

async function enterNotes(conversation: Conv, ctx: MyContext): Promise<{ notes: string | null } | null> {
  await ctx.reply('Any notes?', { reply_markup: notesKeyboard });
  const notesSelCtx = await waitOrCancel(conversation, /^notes_|^cancel$/);
  if (!notesSelCtx) return null;

  if (notesSelCtx.callbackQuery.data === 'notes_yes') {
    await notesSelCtx.editMessageText('Any notes? → Yes');
    await ctx.reply('Enter your note:');
    const noteTextCtx = await conversation.waitFor('message:text');
    return { notes: noteTextCtx.message.text };
  }

  await notesSelCtx.editMessageText('Any notes? → No');
  return { notes: null };
}
