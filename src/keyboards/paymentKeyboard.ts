import { InlineKeyboard } from 'grammy';
import { CREDIT_LABELS as CL, CHECKING_LABELS as DL } from '../constants/labels';

export const paymentTypeKeyboard = new InlineKeyboard()
  .text('💳 Credit', 'pay_type_credit').row()
  .text('🏦 Debit', 'pay_type_debit').row()
  .text('💵 Cash', 'pay_type_cash').row()
  .text('Cancel', 'cancel');

export const checkingKeyboard = new InlineKeyboard()
  .text(DL.debit_wf_checking, 'debit_wf_checking').row()
  .text('Cancel', 'cancel');

export const creditKeyboard = new InlineKeyboard()
  .text(CL.credit_amex_delta, 'credit_amex_delta').row()
  .text(CL.credit_amazon_prime, 'credit_amazon_prime').row()
  .text(CL.credit_cap1_quicksilver, 'credit_cap1_quicksilver').row()
  .text(CL.credit_citi_doublecash, 'credit_citi_doublecash').row()
  .text(CL.credit_wf_active_cash, 'credit_wf_active_cash').row()
  .text(CL.credit_amex_hilton, 'credit_amex_hilton').row()
  .text('Cancel', 'cancel');
