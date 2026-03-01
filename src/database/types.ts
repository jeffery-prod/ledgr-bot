export interface AccountType {
  id: string;
  name: string;
  display_name: string;
  emoji: string | null;
  sort_order: number;
}

export interface Account {
  id: string;
  name: string;
  display_name: string | null;
  emoji: string | null;
  account_type_id: string;
  sort_order: number;
}

export interface ExpenseType {
  id: string;
  name: string;
  display_name: string;
  emoji: string | null;
  sort_order: number;
}

export interface IncomeType {
  id: string;
  name: string;
  display_name: string;
  emoji: string | null;
  sort_order: number;
}

export interface RecentExpense {
  type: 'expense';
  title: string | null;
  amount: number;
  transaction_date: string;
  created_at: string;
}

export interface RecentIncome {
  type: 'income';
  title: string | null;
  amount: number;
  transaction_date: string;
  created_at: string;
}

export interface RecentTransfer {
  type: 'transfer';
  from_label: string;
  to_label: string;
  amount: number;
  transaction_date: string;
  created_at: string;
}

export type RecentTransaction = RecentExpense | RecentIncome | RecentTransfer;
