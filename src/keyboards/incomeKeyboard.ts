import { InlineKeyboard } from 'grammy';
import { INCOME_TYPE_LABELS as L } from '../constants/labels';

export const incomeKeyboard = new InlineKeyboard()
  .text(L.inc_salary, 'inc_salary').text(L.inc_freelance, 'inc_freelance').row()
  .text(L.inc_side_income, 'inc_side_income').text(L.inc_refund, 'inc_refund').row()
  .text(L.inc_gift, 'inc_gift').text(L.inc_dividends, 'inc_dividends').row()
  .text('Cancel', 'cancel');
