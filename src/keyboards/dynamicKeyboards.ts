import { InlineKeyboard } from 'grammy';
import type { AccountType, Account, ExpenseType, IncomeType } from '../database/types';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^cancel$/;

export function buildAccountTypeKeyboard(types: AccountType[]): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const t of types) {
    const label = t.emoji ? `${t.emoji} ${t.display_name}` : t.display_name;
    keyboard.text(label, t.id).row();
  }
  keyboard.text('Cancel', 'cancel');
  return keyboard;
}

export function buildAccountKeyboard(accounts: Account[]): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const a of accounts) {
    const label = a.emoji ? `${a.emoji} ${a.display_name ?? a.name}` : (a.display_name ?? a.name);
    keyboard.text(label, a.id).row();
  }
  keyboard.text('Cancel', 'cancel');
  return keyboard;
}

export function buildExpenseTypeKeyboard(types: ExpenseType[]): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (let i = 0; i < types.length; i++) {
    const t = types[i];
    const label = t.emoji ? `${t.emoji} ${t.display_name}` : t.display_name;
    keyboard.text(label, t.id);
    if (i % 2 === 1) keyboard.row();
  }
  if (types.length % 2 !== 0) keyboard.row();
  keyboard.text('Cancel', 'cancel');
  return keyboard;
}

export function buildIncomeTypeKeyboard(types: IncomeType[]): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const t of types) {
    const label = t.emoji ? `${t.emoji} ${t.display_name}` : t.display_name;
    keyboard.text(label, t.id).row();
  }
  keyboard.text('Cancel', 'cancel');
  return keyboard;
}
