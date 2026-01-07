export interface InsightContext {
  contextType: string;
  contextField: string;
  data?: Record<string, unknown>;
  fromDate?: string;
  toDate?: string;
  accountName?: string;
  partyName?: string;
  [key: string]: unknown;
}

export interface InsightResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface PLComparisonResult {
  current_profit: number;
  previous_profit: number;
  variance_amount: number;
  variance_percent: number;
  top_contributors: Array<{
    account: string;
    current: number;
    previous: number;
    variance: number;
    variance_percent: number;
    transaction_count: number;
    drill_down_link: string;
  }>;
}

export interface LedgerMovementResult {
  account: string;
  opening_balance: number;
  closing_balance: number;
  net_change: number;
  transaction_groups: Array<{
    voucher_type: string;
    count: number;
    total_amount: number;
    transactions: Array<{
      name: string;
      party?: string;
      amount: number;
      reference?: string;
      link: string;
      date: string;
    }>;
  }>;
}
