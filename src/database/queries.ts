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
  type AccountRow = { name: string; display_name: string | null; emoji: string | null };
  type TypeRow = { display_name: string; emoji: string | null };

  const accountLabel = (row: AccountRow) =>
    row.emoji ? `${row.emoji} ${row.display_name ?? row.name}` : (row.display_name ?? row.name);

  const typeLabel = (row: TypeRow) =>
    row.emoji ? `${row.emoji} ${row.display_name}` : row.display_name;

  const [expensesRes, incomeRes, transfersRes] = await Promise.all([
    supabase
      .from('expenses')
      .select('title, amount, transaction_date, created_at, notes, expense_type:expense_types(display_name, emoji), account:accounts(name, display_name, emoji)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('income')
      .select('title, amount, transaction_date, created_at, notes, income_type:income_types(display_name, emoji), account:accounts(name, display_name, emoji)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('transfers')
      .select('amount, transaction_date, created_at, notes, from_account:accounts!from_account_id(name, display_name, emoji), to_account:accounts!to_account_id(name, display_name, emoji)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (expensesRes.error) console.error('fetchRecentTransactions expenses error:', expensesRes.error.message);
  if (incomeRes.error) console.error('fetchRecentTransactions income error:', incomeRes.error.message);
  if (transfersRes.error) console.error('fetchRecentTransactions transfers error:', transfersRes.error.message);

  const expenses: RecentTransaction[] = (expensesRes.data ?? []).map(e => ({
    type: 'expense' as const,
    title: e.title,
    amount: e.amount,
    transaction_date: e.transaction_date,
    created_at: e.created_at,
    notes: e.notes,
    account_label: accountLabel(e.account as unknown as AccountRow),
    category_label: typeLabel(e.expense_type as unknown as TypeRow),
  }));

  const income: RecentTransaction[] = (incomeRes.data ?? []).map(i => ({
    type: 'income' as const,
    title: i.title,
    amount: i.amount,
    transaction_date: i.transaction_date,
    created_at: i.created_at,
    notes: i.notes,
    account_label: accountLabel(i.account as unknown as AccountRow),
    income_type_label: typeLabel(i.income_type as unknown as TypeRow),
  }));

  const transfers: RecentTransaction[] = (transfersRes.data ?? []).map(t => ({
    type: 'transfer' as const,
    amount: t.amount,
    transaction_date: t.transaction_date,
    created_at: t.created_at,
    notes: t.notes,
    from_label: accountLabel(t.from_account as unknown as AccountRow),
    to_label: accountLabel(t.to_account as unknown as AccountRow),
  }));

  return [...expenses, ...income, ...transfers]
    .sort((a, b) => {
      const dateComp = b.transaction_date.localeCompare(a.transaction_date);
      if (dateComp !== 0) return dateComp;
      return b.created_at.localeCompare(a.created_at);
    })
    .slice(0, 10);
}

export async function fetchTodayTransactions(): Promise<RecentTransaction[]> {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  type AccountRow = { name: string; display_name: string | null; emoji: string | null };
  type TypeRow = { display_name: string; emoji: string | null };

  const accountLabel = (row: AccountRow) =>
    row.emoji ? `${row.emoji} ${row.display_name ?? row.name}` : (row.display_name ?? row.name);

  const typeLabel = (row: TypeRow) =>
    row.emoji ? `${row.emoji} ${row.display_name}` : row.display_name;

  const [expensesRes, incomeRes, transfersRes] = await Promise.all([
    supabase
      .from('expenses')
      .select('title, amount, transaction_date, created_at, notes, expense_type:expense_types(display_name, emoji), account:accounts(name, display_name, emoji)')
      .eq('transaction_date', today)
      .order('created_at', { ascending: false }),
    supabase
      .from('income')
      .select('title, amount, transaction_date, created_at, notes, income_type:income_types(display_name, emoji), account:accounts(name, display_name, emoji)')
      .eq('transaction_date', today)
      .order('created_at', { ascending: false }),
    supabase
      .from('transfers')
      .select('amount, transaction_date, created_at, notes, from_account:accounts!from_account_id(name, display_name, emoji), to_account:accounts!to_account_id(name, display_name, emoji)')
      .eq('transaction_date', today)
      .order('created_at', { ascending: false }),
  ]);

  if (expensesRes.error) console.error('fetchTodayTransactions expenses error:', expensesRes.error.message);
  if (incomeRes.error) console.error('fetchTodayTransactions income error:', incomeRes.error.message);
  if (transfersRes.error) console.error('fetchTodayTransactions transfers error:', transfersRes.error.message);

  const expenses: RecentTransaction[] = (expensesRes.data ?? []).map(e => ({
    type: 'expense' as const,
    title: e.title,
    amount: e.amount,
    transaction_date: e.transaction_date,
    created_at: e.created_at,
    notes: e.notes,
    account_label: accountLabel(e.account as unknown as AccountRow),
    category_label: typeLabel(e.expense_type as unknown as TypeRow),
  }));

  const income: RecentTransaction[] = (incomeRes.data ?? []).map(i => ({
    type: 'income' as const,
    title: i.title,
    amount: i.amount,
    transaction_date: i.transaction_date,
    created_at: i.created_at,
    notes: i.notes,
    account_label: accountLabel(i.account as unknown as AccountRow),
    income_type_label: typeLabel(i.income_type as unknown as TypeRow),
  }));

  const transfers: RecentTransaction[] = (transfersRes.data ?? []).map(t => ({
    type: 'transfer' as const,
    amount: t.amount,
    transaction_date: t.transaction_date,
    created_at: t.created_at,
    notes: t.notes,
    from_label: accountLabel(t.from_account as unknown as AccountRow),
    to_label: accountLabel(t.to_account as unknown as AccountRow),
  }));

  return [...expenses, ...income, ...transfers]
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function fetchLastTransaction(): Promise<RecentTransaction | null> {
  type AccountRow = { name: string; display_name: string | null; emoji: string | null };
  type TypeRow = { display_name: string; emoji: string | null };

  const accountLabel = (row: AccountRow) =>
    row.emoji ? `${row.emoji} ${row.display_name ?? row.name}` : (row.display_name ?? row.name);

  const typeLabel = (row: TypeRow) =>
    row.emoji ? `${row.emoji} ${row.display_name}` : row.display_name;

  const [expenseRes, incomeRes, transferRes] = await Promise.all([
    supabase
      .from('expenses')
      .select('title, amount, transaction_date, created_at, notes, expense_type:expense_types(display_name, emoji), account:accounts(name, display_name, emoji)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('income')
      .select('title, amount, transaction_date, created_at, notes, income_type:income_types(display_name, emoji), account:accounts(name, display_name, emoji)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('transfers')
      .select('amount, transaction_date, created_at, notes, from_account:accounts!from_account_id(name, display_name, emoji), to_account:accounts!to_account_id(name, display_name, emoji)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (expenseRes.error) console.error('fetchLastTransaction expense error:', expenseRes.error.message);
  if (incomeRes.error) console.error('fetchLastTransaction income error:', incomeRes.error.message);
  if (transferRes.error) console.error('fetchLastTransaction transfer error:', transferRes.error.message);

  const candidates: RecentTransaction[] = [];

  if (expenseRes.data) {
    const e = expenseRes.data;
    candidates.push({
      type: 'expense',
      title: e.title,
      amount: e.amount,
      transaction_date: e.transaction_date,
      created_at: e.created_at,
      notes: e.notes,
      account_label: accountLabel(e.account as unknown as AccountRow),
      category_label: typeLabel(e.expense_type as unknown as TypeRow),
    });
  }

  if (incomeRes.data) {
    const i = incomeRes.data;
    candidates.push({
      type: 'income',
      title: i.title,
      amount: i.amount,
      transaction_date: i.transaction_date,
      created_at: i.created_at,
      notes: i.notes,
      account_label: accountLabel(i.account as unknown as AccountRow),
      income_type_label: typeLabel(i.income_type as unknown as TypeRow),
    });
  }

  if (transferRes.data) {
    const t = transferRes.data;
    candidates.push({
      type: 'transfer',
      amount: t.amount,
      transaction_date: t.transaction_date,
      created_at: t.created_at,
      notes: t.notes,
      from_label: accountLabel(t.from_account as unknown as AccountRow),
      to_label: accountLabel(t.to_account as unknown as AccountRow),
    });
  }

  if (candidates.length === 0) return null;

  return candidates.sort((a, b) => {
    const dateComp = b.transaction_date.localeCompare(a.transaction_date);
    if (dateComp !== 0) return dateComp;
    return b.created_at.localeCompare(a.created_at);
  })[0];
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
