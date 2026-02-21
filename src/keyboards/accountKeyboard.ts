import { InlineKeyboard } from 'grammy';

export const accountKeyboard = new InlineKeyboard()
  .text('Checking', 'account_checking')
  .text('Savings', 'account_savings')
  .text('Investment', 'account_investment').row()
  .text('Cancel', 'cancel');

export function buildToAccountKeyboard(excludeKey: string): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  if (excludeKey !== 'account_checking') keyboard.text('Checking', 'account_checking');
  if (excludeKey !== 'account_savings') keyboard.text('Savings', 'account_savings');
  if (excludeKey !== 'account_investment') keyboard.text('Investment', 'account_investment');
  keyboard.row().text('Cancel', 'cancel');
  return keyboard;
}
