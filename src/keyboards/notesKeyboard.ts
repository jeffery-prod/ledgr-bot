import { InlineKeyboard } from 'grammy';

export const notesKeyboard = new InlineKeyboard()
  .text('Yes', 'notes_yes').text('No', 'notes_no').row()
  .text('Cancel', 'cancel');
