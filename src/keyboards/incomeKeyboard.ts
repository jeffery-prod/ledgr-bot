import { InlineKeyboard } from 'grammy';

export const incomeKeyboard = new InlineKeyboard()
  .text('Salary', 'inc_salary').text('Freelance', 'inc_freelance').row()
  .text('Side Income', 'inc_side_income').text('Refund', 'inc_refund').row()
  .text('Gift', 'inc_gift').text('Dividends', 'inc_dividends').row()
  .text('Cancel', 'cancel');
