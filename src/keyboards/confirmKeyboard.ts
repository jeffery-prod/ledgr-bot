import { InlineKeyboard } from 'grammy';

export const confirmKeyboard = new InlineKeyboard()
  .text('✅ Confirm', 'confirm')
  .text('❌ Cancel', 'cancel');
