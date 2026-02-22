export const ACCOUNTS = {
  CHECKING: 'WF CHECKING',

  SAVINGS: 'SAVINGS',

  CASH: 'CASH',

  INVESTMENT: {
    ROTH_IRA: 'Roth IRA',
    DIVIDEND_KINGS: 'Dividend Kings',
    GROWTH_MONSTER: 'Growth Monster',
  },

  CREDIT: {
    AMEX_DELTA: 'Delta Skymiles',
    AMAZON_PRIME: 'Amazon Prime',
    CAP1_QUICKSILVER: 'Quicksilver',
    CITI_DOUBLECASH: 'DoubleCash',
    WF_ACTIVE_CASH: 'Active Cash',
    AMEX_HILTON: 'Hilton Honors',
  },
} as const;

export const CHECKING_CALLBACK_MAP: Record<string, string> = {
  debit_wf_checking: ACCOUNTS.CHECKING,
};

export const CREDIT_CALLBACK_MAP: Record<string, string> = {
  credit_amex_delta: ACCOUNTS.CREDIT.AMEX_DELTA,
  credit_amazon_prime: ACCOUNTS.CREDIT.AMAZON_PRIME,
  credit_cap1_quicksilver: ACCOUNTS.CREDIT.CAP1_QUICKSILVER,
  credit_citi_doublecash: ACCOUNTS.CREDIT.CITI_DOUBLECASH,
  credit_wf_active_cash: ACCOUNTS.CREDIT.WF_ACTIVE_CASH,
  credit_amex_hilton: ACCOUNTS.CREDIT.AMEX_HILTON,
};

export const INVESTMENT_CALLBACK_MAP: Record<string, string> = {
  inv_roth_ira: ACCOUNTS.INVESTMENT.ROTH_IRA,
  inv_dividend_kings: ACCOUNTS.INVESTMENT.DIVIDEND_KINGS,
  inv_growth_monster: ACCOUNTS.INVESTMENT.GROWTH_MONSTER,
};

export const SAVINGS_CALLBACK_MAP: Record<string, string> = {
  savings_main: ACCOUNTS.SAVINGS,
};

export const TRANSFER_ACCOUNT_CALLBACK_MAP: Record<string, string> = {
  account_checking: ACCOUNTS.CHECKING,
  account_savings: ACCOUNTS.SAVINGS,
};
