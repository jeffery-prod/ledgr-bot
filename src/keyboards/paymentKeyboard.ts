import { InlineKeyboard } from 'grammy';

export const paymentKeyboard = new InlineKeyboard()
  .text('Amex Delta Skymiles', 'pay_amex_delta').row()
  .text('Amazon Prime Visa', 'pay_amazon_visa').row()
  .text('Wells Fargo Debit', 'pay_wf_debit').row()
  .text('Capital One Quicksilver', 'pay_cap1_quicksilver').row()
  .text('Citi DoubleCash', 'pay_citi_doublecash').row()
  .text('Wells Fargo Active Cash', 'pay_wf_active_cash').row()
  .text('Amex Hilton Honors', 'pay_amex_hilton').row()
  .text('Cash', 'pay_cash').row()
  .text('Cancel', 'cancel');
