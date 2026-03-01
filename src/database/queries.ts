import { supabase } from './supabase';
import type { AccountType, Account, ExpenseType, IncomeType, RecentTransaction } from './types';

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

export async function fetchRecentTransactions(): Promise<RecentTransaction[]> {
  const [expensesRes, incomeRes, transfersRes] = await Promise.all([
    supabase
      .from('expenses')
      .select('title, amount, transaction_date, created_at')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('income')
      .select('title, amount, transaction_date, created_at')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('transfers')
      .select('amount, transaction_date, created_at, from_account:accounts!from_account_id(name, display_name, emoji), to_account:accounts!to_account_id(name, display_name, emoji)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (expensesRes.error) console.error('fetchRecentTransactions expenses error:', expensesRes.error.message);
  if (incomeRes.error) console.error('fetchRecentTransactions income error:', incomeRes.error.message);
  if (transfersRes.error) console.error('fetchRecentTransactions transfers error:', transfersRes.error.message);

  const accountLabel = (row: { name: string; display_name: string | null; emoji: string | null }) =>
    row.emoji ? `${row.emoji} ${row.display_name ?? row.name}` : (row.display_name ?? row.name);

  const expenses: RecentTransaction[] = (expensesRes.data ?? []).map(e => ({
    type: 'expense' as const,
    title: e.title,
    amount: e.amount,
    transaction_date: e.transaction_date,
    created_at: e.created_at,
  }));

  const income: RecentTransaction[] = (incomeRes.data ?? []).map(i => ({
    type: 'income' as const,
    title: i.title,
    amount: i.amount,
    transaction_date: i.transaction_date,
    created_at: i.created_at,
  }));

  const transfers: RecentTransaction[] = (transfersRes.data ?? []).map(t => {
    type AccountRow = { name: string; display_name: string | null; emoji: string | null };
    const from = t.from_account as unknown as AccountRow;
    const to = t.to_account as unknown as AccountRow;
    return {
      type: 'transfer' as const,
      from_label: accountLabel(from),
      to_label: accountLabel(to),
      amount: t.amount,
      transaction_date: t.transaction_date,
      created_at: t.created_at,
    };
  });

  return [...expenses, ...income, ...transfers]
    .sort((a, b) => {
      const dateComp = b.transaction_date.localeCompare(a.transaction_date);
      if (dateComp !== 0) return dateComp;
      return b.created_at.localeCompare(a.created_at);
    })
    .slice(0, 10);
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
