import { InlineKeyboard } from 'grammy';

export const debtKeyboard = new InlineKeyboard()
  .text('Credit Cards', 'debt_credit_cards').text('Student Loans', 'debt_student_loans').row()
  .text('Car Payment', 'debt_car_payment').text('Personal Loans', 'debt_personal_loans').row()
  .text('Mortgage', 'debt_mortgage').row()
  .text('Cancel', 'cancel');
