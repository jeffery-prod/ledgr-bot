import { supabase } from './supabase';

export async function getExpenseTypeId(name: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('expense_types')
    .select('id')
    .eq('name', name)
    .single();
  if (error) { console.error('getExpenseTypeId error:', error.message); return null; }
  return data.id;
}

export async function getAccountId(name: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id')
    .eq('name', name)
    .single();
  if (error) { console.error('getAccountId error:', error.message); return null; }
  return data.id;
}

export async function getIncomeTypeId(name: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('income_types')
    .select('id')
    .eq('name', name)
    .single();
  if (error) { console.error('getIncomeTypeId error:', error.message); return null; }
  return data.id;
}

export async function saveExpense(
  expenseTypeId: string,
  accountId: string,
  amount: number,
  transactionDate: string,
  notes: string | null
): Promise<boolean> {
  const { error } = await supabase.from('expenses').insert({
    expense_type_id: expenseTypeId,
    account_id: accountId,
    amount,
    transaction_date: transactionDate,
    notes,
  });
  if (error) { console.error('saveExpense error:', error.message); return false; }
  return true;
}

export async function saveIncome(
  incomeTypeId: string,
  accountId: string,
  amount: number,
  transactionDate: string,
  notes: string | null
): Promise<boolean> {
  const { error } = await supabase.from('income').insert({
    income_type_id: incomeTypeId,
    account_id: accountId,
    amount,
    transaction_date: transactionDate,
    notes,
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
  });
  if (error) { console.error('saveTransfer error:', error.message); return false; }
  return true;
}
