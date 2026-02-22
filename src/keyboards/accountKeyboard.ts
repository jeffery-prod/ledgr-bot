import { InlineKeyboard } from 'grammy';
import { INCOME_ACCOUNT_LABELS as IL, INVESTMENT_LABELS as INV, SAVINGS_LABELS as SL, TRANSFER_ACCOUNT_LABELS as TL } from '../constants/labels';

export const accountKeyboard = new InlineKeyboard()
  .text(TL.account_checking, 'account_checking')
  .text(TL.account_savings, 'account_savings').row()
  .text(TL.account_investing, 'account_investing')
  .text(TL.account_cash, 'account_cash').row()
  .text('Cancel', 'cancel');

export const incomeAccountKeyboard = new InlineKeyboard()
  .text(IL.inc_acct_checking, 'inc_acct_checking')
  .text(IL.inc_acct_savings, 'inc_acct_savings').row()
  .text(IL.inc_acct_investing, 'inc_acct_investing')
  .text(IL.inc_acct_cash, 'inc_acct_cash').row()
  .text('Cancel', 'cancel');

export const savingsKeyboard = new InlineKeyboard()
  .text(SL.savings_main, 'savings_main').row()
  .text('Cancel', 'cancel');

export const investmentAccountKeyboard = new InlineKeyboard()
  .text(INV.inv_roth_ira, 'inv_roth_ira').row()
  .text(INV.inv_dividend_kings, 'inv_dividend_kings').row()
  .text(INV.inv_growth_monster, 'inv_growth_monster').row()
  .text('Cancel', 'cancel');

export function buildToAccountKeyboard(excludeKey: string): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  if (excludeKey !== 'account_checking') keyboard.text(TL.account_checking, 'account_checking');
  if (excludeKey !== 'account_savings') keyboard.text(TL.account_savings, 'account_savings');
  keyboard.row();
  if (excludeKey !== 'account_investing') keyboard.text(TL.account_investing, 'account_investing');
  if (excludeKey !== 'account_cash') keyboard.text(TL.account_cash, 'account_cash');
  keyboard.row().text('Cancel', 'cancel');
  return keyboard;
}
