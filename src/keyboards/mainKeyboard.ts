import { InlineKeyboard } from 'grammy';

export const mainKeyboard = new InlineKeyboard()
  .text('Expense', 'menu_add').text('Income', 'menu_income').row()
  .text('Transfer', 'menu_transfer').text('Summary', 'menu_summary').row()
  .text('Cancel', 'menu_cancel');
