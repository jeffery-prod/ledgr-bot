import { InlineKeyboard } from 'grammy';
import { getAccountsByType } from '../database/queries';

export const paymentTypeKeyboard = new InlineKeyboard()
  .text('Credit', 'pay_type_credit').row()
  .text('Debit', 'pay_type_debit').row()
  .text('Cash', 'pay_type_cash').row()
  .text('Cancel', 'cancel');

export async function buildCreditKeyboard(): Promise<InlineKeyboard> {
  const accounts = await getAccountsByType('CREDIT');
  const keyboard = new InlineKeyboard();
  for (const account of accounts) {
    keyboard.text(account.name, `credit_${account.id}`).row();
  }
  keyboard.text('Cancel', 'cancel');
  return keyboard;
}
