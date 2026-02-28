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
