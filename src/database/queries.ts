import { supabase } from './supabase';
import type { AccountType, Account, ExpenseType, IncomeType } from './types';

export async function fetchAccountTypes(context: 'expense' | 'income' | 'transfer'): Promise<AccountType[]> {
  const column = `for_${context}` as const;
  const { data, error } = await supabase
    .from('account_types')
    .select('id, name, display_name, emoji, sort_order')
    .eq('is_active', true)
    .eq(column, true)
    .order('sort_order');
  if (error) { console.error('fetchAccountTypes error:', error.message); return []; }
  return data ?? [];
}

export async function fetchAccountsByType(accountTypeId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id, name, display_name, emoji, account_type_id, sort_order')
    .eq('account_type_id', accountTypeId)
    .eq('is_active', true)
    .order('sort_order');
  if (error) { console.error('fetchAccountsByType error:', error.message); return []; }
  return data ?? [];
}

export async function fetchExpenseTypes(): Promise<ExpenseType[]> {
  const { data, error } = await supabase
    .from('expense_types')
    .select('id, name, display_name, emoji, sort_order')
    .eq('is_active', true)
    .order('sort_order');
  if (error) { console.error('fetchExpenseTypes error:', error.message); return []; }
  return data ?? [];
}

export async function fetchIncomeTypes(): Promise<IncomeType[]> {
  const { data, error } = await supabase
    .from('income_types')
    .select('id, name, display_name, emoji, sort_order')
    .eq('is_active', true)
    .order('sort_order');
  if (error) { console.error('fetchIncomeTypes error:', error.message); return []; }
  return data ?? [];
}

export async function saveExpense(
  expenseTypeId: string,
  accountId: string,
  title: string,
  amount: number,
  transactionDate: string,
  notes: string | null
): Promise<boolean> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('expenses').insert({
    expense_type_id: expenseTypeId,
    account_id: accountId,
    title,
    amount,
    transaction_date: transactionDate,
    notes,
    created_at: now,
    updated_at: now,
  });
  if (error) { console.error('saveExpense error:', error.message); return false; }
  return true;
}

export async function saveIncome(
  incomeTypeId: string,
  accountId: string,
  title: string,
  amount: number,
  transactionDate: string,
  notes: string | null
): Promise<boolean> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('income').insert({
    income_type_id: incomeTypeId,
    account_id: accountId,
    title,
    amount,
    transaction_date: transactionDate,
    notes,
    created_at: now,
    updated_at: now,
  });
  if (error) { console.error('saveIncome error:', error.message); return false; }
  return true;
}

export async function saveTransfer(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  transactionDate: string,
  notes: string | null
): Promise<boolean> {
  const { error } = await supabase.from('transfers').insert({
    from_account_id: fromAccountId,
    to_account_id: toAccountId,
    amount,
    transaction_date: transactionDate,
    notes,
    created_at: new Date().toISOString(),
  });
  if (error) { console.error('saveTransfer error:', error.message); return false; }
  return true;
}
