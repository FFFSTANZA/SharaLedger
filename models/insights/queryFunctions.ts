import { Fyo } from 'fyo';
import { DateTime } from 'luxon';
import {
  InsightContext,
  InsightResult,
  PLComparisonResult,
  LedgerMovementResult,
} from './types';

/**
 * Query Function: compare_pl_periods
 * Compares Profit & Loss between two periods and shows variance analysis
 */
export async function compare_pl_periods(
  fyo: Fyo,
  context: InsightContext
): Promise<InsightResult> {
  try {
    const toDate = context.toDate || DateTime.now().toISODate();
    const fromDate =
      context.fromDate || DateTime.now().minus({ months: 1 }).toISODate();

    const currentPeriodEnd = DateTime.fromISO(toDate);
    const currentPeriodStart = DateTime.fromISO(fromDate);
    const periodLength = currentPeriodEnd.diff(currentPeriodStart, 'days').days;

    const prevPeriodEnd = currentPeriodStart.minus({ days: 1 });
    const prevPeriodStart = prevPeriodEnd.minus({ days: periodLength });

    const currentEntries = await fyo.db.getAllRaw('AccountingLedgerEntry', {
      filters: {
        date: [
          '>=',
          currentPeriodStart.toISODate(),
          '<=',
          currentPeriodEnd.toISODate(),
        ],
      },
    });

    const prevEntries = await fyo.db.getAllRaw('AccountingLedgerEntry', {
      filters: {
        date: [
          '>=',
          prevPeriodStart.toISODate(),
          '<=',
          prevPeriodEnd.toISODate(),
        ],
      },
    });

    const accountMap = new Map<
      string,
      { current: number; previous: number; count: number }
    >();

    for (const entry of currentEntries) {
      const account = entry.account as string;
      const debit = (entry.debit as number) || 0;
      const credit = (entry.credit as number) || 0;
      const amount = debit - credit;

      if (!accountMap.has(account)) {
        accountMap.set(account, { current: 0, previous: 0, count: 0 });
      }
      const acc = accountMap.get(account)!;
      acc.current += amount;
      acc.count += 1;
    }

    for (const entry of prevEntries) {
      const account = entry.account as string;
      const debit = (entry.debit as number) || 0;
      const credit = (entry.credit as number) || 0;
      const amount = debit - credit;

      if (!accountMap.has(account)) {
        accountMap.set(account, { current: 0, previous: 0, count: 0 });
      }
      accountMap.get(account)!.previous += amount;
    }

    const accounts = await fyo.db.getAllRaw('Account', {
      filters: {
        rootType: ['in', ['Income', 'Expense']],
      },
    });

    const accountRootTypeMap = new Map<string, string>();
    for (const acc of accounts) {
      accountRootTypeMap.set(acc.name as string, acc.rootType as string);
    }

    let currentProfit = 0;
    let previousProfit = 0;

    const contributors: Array<{
      account: string;
      current: number;
      previous: number;
      variance: number;
      variance_percent: number;
      transaction_count: number;
      drill_down_link: string;
    }> = [];

    for (const [account, values] of accountMap.entries()) {
      const rootType = accountRootTypeMap.get(account);
      if (!rootType) continue;

      const isIncome = rootType === 'Income';
      const currentAmount = isIncome ? -values.current : values.current;
      const previousAmount = isIncome ? -values.previous : values.previous;

      currentProfit += isIncome ? values.current : -values.current;
      previousProfit += isIncome ? values.previous : -values.previous;

      const variance = currentAmount - previousAmount;
      const variancePercent =
        previousAmount !== 0 ? (variance / Math.abs(previousAmount)) * 100 : 0;

      contributors.push({
        account,
        current: currentAmount,
        previous: previousAmount,
        variance,
        variance_percent: variancePercent,
        transaction_count: values.count,
        drill_down_link: `/list/AccountingLedgerEntry?account=${encodeURIComponent(
          account
        )}`,
      });
    }

    contributors.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
    const topContributors = contributors.slice(0, 5);

    const result: PLComparisonResult = {
      current_profit: currentProfit,
      previous_profit: previousProfit,
      variance_amount: currentProfit - previousProfit,
      variance_percent:
        previousProfit !== 0
          ? ((currentProfit - previousProfit) / Math.abs(previousProfit)) * 100
          : 0,
      top_contributors: topContributors,
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Query Function: trace_ledger_movements
 * Lists all transactions that built up a ledger balance
 */
export async function trace_ledger_movements(
  fyo: Fyo,
  context: InsightContext
): Promise<InsightResult> {
  try {
    const accountName = context.accountName as string;
    const toDate = context.toDate || DateTime.now().toISODate();
    const fromDate =
      context.fromDate || DateTime.now().minus({ months: 1 }).toISODate();

    if (!accountName) {
      return {
        success: false,
        error: 'Account name is required',
      };
    }

    const entries = await fyo.db.getAllRaw('AccountingLedgerEntry', {
      filters: {
        account: accountName,
        date: ['>=', fromDate, '<=', toDate],
      },
      orderBy: 'date',
    });

    const openingBalance = 0;
    const transactionGroups = new Map<
      string,
      {
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
      }
    >();

    for (const entry of entries) {
      const debit = (entry.debit as number) || 0;
      const credit = (entry.credit as number) || 0;
      const amount = debit - credit;

      const voucherType =
        (entry.referenceName as string)?.split('-')[0] || 'Other';

      if (!transactionGroups.has(voucherType)) {
        transactionGroups.set(voucherType, {
          voucher_type: voucherType,
          count: 0,
          total_amount: 0,
          transactions: [],
        });
      }

      const group = transactionGroups.get(voucherType)!;
      group.count += 1;
      group.total_amount += amount;
      group.transactions.push({
        name: entry.name as string,
        party: entry.party as string | undefined,
        amount,
        reference: entry.referenceName as string | undefined,
        link: `/list/AccountingLedgerEntry?name=${encodeURIComponent(
          entry.name as string
        )}`,
        date: entry.date as string,
      });
    }

    const closingBalance =
      openingBalance +
      entries.reduce((sum, e) => {
        const debit = (e.debit as number) || 0;
        const credit = (e.credit as number) || 0;
        return sum + (debit - credit);
      }, 0);

    const result: LedgerMovementResult = {
      account: accountName,
      opening_balance: openingBalance,
      closing_balance: closingBalance,
      net_change: closingBalance - openingBalance,
      transaction_groups: Array.from(transactionGroups.values()),
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Query Function: analyze_customer_outstanding
 * Analyzes why a customer's outstanding amount is high
 */
export async function analyze_customer_outstanding(
  fyo: Fyo,
  context: InsightContext
): Promise<InsightResult> {
  try {
    const partyName = context.partyName as string;
    if (!partyName) {
      return {
        success: false,
        error: 'Party name is required',
      };
    }

    const invoices = await fyo.db.getAllRaw('SalesInvoice', {
      filters: {
        party: partyName,
        submitted: true,
        cancelled: false,
      },
    });

    const payments = await fyo.db.getAllRaw('Payment', {
      filters: {
        party: partyName,
        submitted: true,
        cancelled: false,
      },
    });

    let totalInvoiced = 0;
    let totalPaid = 0;
    const overdueInvoices: Array<{
      name: string;
      date: string;
      amount: number;
      outstanding: number;
      days_overdue: number;
    }> = [];

    const now = DateTime.now();

    for (const invoice of invoices) {
      const amount = (invoice.grandTotal as number) || 0;
      totalInvoiced += amount;

      const outstanding = (invoice.outstandingAmount as number) || 0;
      if (outstanding > 0) {
        const dueDate = DateTime.fromISO(invoice.date as string);
        const daysOverdue = Math.floor(now.diff(dueDate, 'days').days);

        overdueInvoices.push({
          name: invoice.name as string,
          date: invoice.date as string,
          amount,
          outstanding,
          days_overdue: daysOverdue,
        });
      }
    }

    for (const payment of payments) {
      totalPaid += (payment.amount as number) || 0;
    }

    overdueInvoices.sort((a, b) => b.days_overdue - a.days_overdue);

    const avgPaymentDays =
      payments.length > 0
        ? payments.reduce((sum, p) => {
            const paymentDate = DateTime.fromISO(p.date as string);
            return sum + paymentDate.toMillis();
          }, 0) / payments.length
        : 0;

    return {
      success: true,
      data: {
        party: partyName,
        total_invoiced: totalInvoiced,
        total_paid: totalPaid,
        outstanding: totalInvoiced - totalPaid,
        overdue_invoices: overdueInvoices.slice(0, 10),
        invoice_count: invoices.length,
        payment_count: payments.length,
        avg_payment_cycle_days: avgPaymentDays,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Export all query functions
 */
export const queryFunctions = {
  compare_pl_periods,
  trace_ledger_movements,
  analyze_customer_outstanding,
};
