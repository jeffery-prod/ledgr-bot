import { InlineKeyboard } from 'grammy';

export const mainKeyboard = new InlineKeyboard()
  .text('Expense', 'menu_expense').row()
  .text('Income', 'menu_income').row()
  .text('Transfer', 'menu_transfer').row()
  .text('Cancel', 'menu_cancel');
