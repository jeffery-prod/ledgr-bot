import { InlineKeyboard } from 'grammy';

export const dateKeyboard = new InlineKeyboard()
  .text('Today', 'date_today')
  .text('Yesterday', 'date_yesterday').row()
  .text('Specify date', 'date_specify').row()
  .text('Cancel', 'cancel');
