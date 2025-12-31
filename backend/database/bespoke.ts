import {
  Cashflow,
  CashflowSeriesPoint,
  DashboardSummary,
  IncomeExpense,
  TopExpenses,
  TotalCreditAndDebit,
  TotalOutstanding,
} from 'utils/db/types';
import { ModelNameEnum } from '../../models/types';
import DatabaseCore from './core';
import { BespokeFunction } from './types';
import { DocItem, ReturnDocItem } from 'models/inventory/types';
import { safeParseFloat } from 'utils/index';

export class BespokeQueries {
  [key: string]: BespokeFunction;

  static async getLastInserted(
    db: DatabaseCore,
    schemaName: string
  ): Promise<number> {
    const lastInserted = (await db.knex!.raw(
      'select cast(name as int) as num from ?? order by num desc limit 1',
      [schemaName]
    )) as { num: number }[];

    const num = lastInserted?.[0]?.num;
    if (num === undefined) {
      return 0;
    }
    return num;
  }

  static async getTopExpenses(
    db: DatabaseCore,
    fromDate: string,
    toDate: string
  ) {
    const expenseAccounts = db
      .knex!.select('name')
      .from('Account')
      .where('rootType', 'Expense');

    const topExpenses = await db
      .knex!.select({
        total: db.knex!.raw('sum(cast(debit as real) - cast(credit as real))'),
      })
      .select('account')
      .from('AccountingLedgerEntry')
      .where('reverted', false)
      .where('account', 'in', expenseAccounts)
      .whereBetween('date', [fromDate, toDate])
      .groupBy('account')
      .orderBy('total', 'desc')
      .limit(5);
    return topExpenses as TopExpenses;
  }

  static async getTotalOutstanding(
    db: DatabaseCore,
    schemaName: string,
    fromDate: string,
    toDate: string
  ) {
    return (await db.knex!(schemaName)
      .sum({ total: 'baseGrandTotal' })
      .sum({ outstanding: 'outstandingAmount' })
      .where('submitted', true)
      .where('cancelled', false)
      .whereBetween('date', [fromDate, toDate])
      .first()) as TotalOutstanding;
  }

  static async getCashflow(db: DatabaseCore, fromDate: string, toDate: string) {
    const cashAndBankAccounts = db.knex!('Account')
      .select('name')
      .where('accountType', 'in', ['Cash', 'Bank'])
      .andWhere('isGroup', false);
    const dateAsMonthYear = db.knex!.raw(`strftime('%Y-%m', ??)`, 'date');
    return (await db.knex!('AccountingLedgerEntry')
      .where('reverted', false)
      .sum({
        inflow: 'debit',
        outflow: 'credit',
      })
      .select({
        yearmonth: dateAsMonthYear,
      })
      .where('account', 'in', cashAndBankAccounts)
      .whereBetween('date', [fromDate, toDate])
      .groupBy(dateAsMonthYear)) as Cashflow;
  }

  static async getCashflowSeries(
    db: DatabaseCore,
    fromDate: string,
    toDate: string,
    groupBy: 'day' | 'month'
  ): Promise<CashflowSeriesPoint> {
    const cashAndBankAccounts = db.knex!('Account')
      .select('name')
      .where('accountType', 'in', ['Cash', 'Bank'])
      .andWhere('isGroup', false);

    const format = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m';
    const periodExpr = db.knex!.raw(`strftime('${format}', ??)`, 'date');

    const aggregated = (await db.knex!('AccountingLedgerEntry')
      .where('reverted', false)
      .where('account', 'in', cashAndBankAccounts)
      .whereBetween('date', [fromDate, toDate])
      .select({
        period: periodExpr,
        inflow: db.knex!.raw('sum(cast(debit as real))'),
        outflow: db.knex!.raw('sum(cast(credit as real))'),
      })
      .groupBy(periodExpr)
      .orderBy(periodExpr)) as unknown as {
      period: string;
      inflow: number;
      outflow: number;
    }[];

    const entries = (await db.knex!('AccountingLedgerEntry')
      .where('reverted', false)
      .where('account', 'in', cashAndBankAccounts)
      .whereBetween('date', [fromDate, toDate])
      .select({
        period: periodExpr,
        debit: db.knex!.raw('cast(debit as real)'),
        credit: db.knex!.raw('cast(credit as real)'),
      })
      .select('referenceType', 'referenceName')) as unknown as {
      period: string;
      debit: number;
      credit: number;
      referenceType?: string;
      referenceName?: string;
    }[];

    const highlightMap: Record<
      string,
      {
        topInflow?: {
          amount: number;
          referenceType?: string;
          referenceName?: string;
        };
        topOutflow?: {
          amount: number;
          referenceType?: string;
          referenceName?: string;
        };
      }
    > = {};

    for (const e of entries) {
      const period = e.period;
      highlightMap[period] ??= {};

      const debit = safeParseFloat(e.debit);
      const credit = safeParseFloat(e.credit);

      if (debit > (highlightMap[period].topInflow?.amount ?? 0)) {
        highlightMap[period].topInflow = {
          amount: debit,
          referenceType: e.referenceType,
          referenceName: e.referenceName,
        };
      }

      if (credit > (highlightMap[period].topOutflow?.amount ?? 0)) {
        highlightMap[period].topOutflow = {
          amount: credit,
          referenceType: e.referenceType,
          referenceName: e.referenceName,
        };
      }
    }

    return aggregated.map((row) => {
      const inflow = safeParseFloat(row.inflow);
      const outflow = safeParseFloat(row.outflow);
      const net = inflow - outflow;
      const highlights = highlightMap[row.period] ?? {};

      const topInflow = highlights.topInflow?.amount
        ? highlights.topInflow
        : undefined;
      const topOutflow = highlights.topOutflow?.amount
        ? highlights.topOutflow
        : undefined;

      return {
        period: row.period,
        inflow,
        outflow,
        net,
        topInflow,
        topOutflow,
      };
    });
  }

  static async getDashboardSummary(
    db: DatabaseCore,
    fromDate: string,
    toDate: string,
    prevFromDate: string,
    prevToDate: string,
    today: string,
    creditDays = 30
  ): Promise<DashboardSummary> {
    const dueModifier = `+${creditDays} day`;

    const cashAndBankAccounts = db.knex!('Account')
      .select('name')
      .where('accountType', 'in', ['Cash', 'Bank'])
      .andWhere('isGroup', false);

    const taxAccounts = db.knex!('Account')
      .select('name')
      .where('accountType', 'Tax')
      .andWhere('isGroup', false);

    const getCashBalance = async (tillDate: string) => {
      const res = (await db.knex!('AccountingLedgerEntry')
        .where('reverted', false)
        .where('account', 'in', cashAndBankAccounts)
        .where('date', '<=', tillDate)
        .select({
          balance: db.knex!.raw(
            'sum(cast(debit as real) - cast(credit as real))'
          ),
        })
        .first()) as { balance?: number } | undefined;

      return safeParseFloat(res?.balance);
    };

    const getProfit = async (
      startDate: string,
      endDate: string
    ): Promise<{ income: number; expense: number }> => {
      const res = (await db.knex!.raw(
        `
        select 
          sum(case when a.rootType = 'Income'
            then cast(ale.credit as real) - cast(ale.debit as real)
            else 0 end) as income,
          sum(case when a.rootType = 'Expense'
            then cast(ale.debit as real) - cast(ale.credit as real)
            else 0 end) as expense
        from AccountingLedgerEntry ale
        join Account a on a.name = ale.account
        where
          ale.reverted = false and
          date(ale.date) between date(?) and date(?) and
          a.rootType in ('Income', 'Expense')
        `,
        [startDate, endDate]
      )) as { income: number; expense: number }[];

      return {
        income: safeParseFloat(res?.[0]?.income),
        expense: safeParseFloat(res?.[0]?.expense),
      };
    };

    const [cashBalance, cashBalancePrev, profit, profitPrev] =
      await Promise.all([
        getCashBalance(toDate),
        getCashBalance(prevToDate),
        getProfit(fromDate, toDate),
        getProfit(prevFromDate, prevToDate),
      ]);

    const receivablesRes = (await db.knex!('SalesInvoice')
      .where({ submitted: true, cancelled: false })
      .whereRaw('cast(outstandingAmount as real) > 0')
      .select({
        outstanding: db.knex!.raw('sum(cast(outstandingAmount as real))'),
        overdue: db.knex!.raw(
          `sum(case when date(date, ?) < date(?) then cast(outstandingAmount as real) else 0 end)`,
          [dueModifier, today]
        ),
        overdueCount: db.knex!.raw(
          `sum(case when date(date, ?) < date(?) then 1 else 0 end)`,
          [dueModifier, today]
        ),
      })
      .first()) as {
      outstanding?: number;
      overdue?: number;
      overdueCount?: number;
    };

    const payablesRes = (await db.knex!('PurchaseInvoice')
      .where({ submitted: true, cancelled: false })
      .whereRaw('cast(outstandingAmount as real) > 0')
      .select({
        outstanding: db.knex!.raw('sum(cast(outstandingAmount as real))'),
        overdue: db.knex!.raw(
          `sum(case when date(date, ?) < date(?) then cast(outstandingAmount as real) else 0 end)`,
          [dueModifier, today]
        ),
        overdueCount: db.knex!.raw(
          `sum(case when date(date, ?) < date(?) then 1 else 0 end)`,
          [dueModifier, today]
        ),
        dueNext7: db.knex!.raw(
          `sum(case when date(date, ?) >= date(?) and date(date, ?) <= date(?, '+7 day') then cast(outstandingAmount as real) else 0 end)`,
          [dueModifier, today, dueModifier, today]
        ),
        dueNext7Count: db.knex!.raw(
          `sum(case when date(date, ?) >= date(?) and date(date, ?) <= date(?, '+7 day') then 1 else 0 end)`,
          [dueModifier, today, dueModifier, today]
        ),
      })
      .first()) as {
      outstanding?: number;
      overdue?: number;
      overdueCount?: number;
      dueNext7?: number;
      dueNext7Count?: number;
    };

    const nextDueRes = (await db.knex!('PurchaseInvoice')
      .where({ submitted: true, cancelled: false })
      .whereRaw('cast(outstandingAmount as real) > 0')
      .whereRaw('date(date, ?) >= date(?)', [dueModifier, today])
      .whereRaw("date(date, ?) <= date(?, '+7 day')", [dueModifier, today])
      .select('name', 'party')
      .select({
        amount: db.knex!.raw('cast(outstandingAmount as real)'),
        dueDate: db.knex!.raw('date(date, ?)', [dueModifier]),
      })
      .orderBy(db.knex!.raw('date(date, ?)', [dueModifier]), 'asc')
      .first()) as
      | {
          name?: string;
          party?: string;
          amount?: number;
          dueDate?: string;
        }
      | undefined;

    const getInvoiceControl = async (
      schemaName: 'SalesInvoice' | 'PurchaseInvoice'
    ) => {
      const res = (await db.knex!(schemaName)
        .where({ submitted: true, cancelled: false })
        .whereBetween('date', [fromDate, toDate])
        .select({
          total: db.knex!.raw('sum(cast(baseGrandTotal as real))'),
          outstanding: db.knex!.raw('sum(cast(outstandingAmount as real))'),
          count: db.knex!.raw('count(*)'),
          unpaidCount: db.knex!.raw(
            'sum(case when cast(outstandingAmount as real) > 0 then 1 else 0 end)'
          ),
          paidCount: db.knex!.raw(
            'sum(case when cast(outstandingAmount as real) = 0 then 1 else 0 end)'
          ),
        })
        .first()) as {
        total?: number;
        outstanding?: number;
        count?: number;
        unpaidCount?: number;
        paidCount?: number;
      };

      return {
        total: safeParseFloat(res?.total),
        outstanding: safeParseFloat(res?.outstanding),
        count: safeParseFloat(res?.count),
        unpaidCount: safeParseFloat(res?.unpaidCount),
        paidCount: safeParseFloat(res?.paidCount),
      };
    };

    const [salesAgg, purchasesAgg] = await Promise.all([
      getInvoiceControl('SalesInvoice'),
      getInvoiceControl('PurchaseInvoice'),
    ]);

    const avgSalesCollectionRes = (await db.knex!.raw(
      `
      select avg(julianday(p.lastPaymentDate) - julianday(i.date)) as avgDays
      from SalesInvoice i
      join (
        select pf.referenceName as invoiceName, max(datetime(pay.date)) as lastPaymentDate
        from PaymentFor pf
        join Payment pay on pay.name = pf.parent
        where
          pf.referenceType = 'SalesInvoice' and
          pf.parentSchemaName = 'Payment' and
          pay.submitted = true and
          pay.cancelled = false
        group by pf.referenceName
      ) p on p.invoiceName = i.name
      where
        i.submitted = true and
        i.cancelled = false and
        cast(i.outstandingAmount as real) = 0 and
        date(i.date) between date(?) and date(?)
      `,
      [fromDate, toDate]
    )) as { avgDays: number }[];

    const avgCollectionDays = avgSalesCollectionRes?.[0]?.avgDays;

    const topExpensesCurrent = await BespokeQueries.getTopExpenses(
      db,
      fromDate,
      toDate
    );

    const topExpenseAccounts = topExpensesCurrent.map((e) => e.account);
    let prevExpenseTotals: { account: string; total: number }[] = [];
    if (topExpenseAccounts.length) {
      prevExpenseTotals = (await db.knex!('AccountingLedgerEntry')
        .where('reverted', false)
        .where('account', 'in', topExpenseAccounts)
        .whereBetween('date', [prevFromDate, prevToDate])
        .select('account')
        .select({
          total: db.knex!.raw(
            'sum(cast(debit as real) - cast(credit as real))'
          ),
        })
        .groupBy('account')) as unknown as { account: string; total: number }[];
    }

    const prevExpenseMap = prevExpenseTotals.reduce((acc, r) => {
      acc[r.account] = safeParseFloat(r.total);
      return acc;
    }, {} as Record<string, number>);

    const topExpenses = topExpensesCurrent.map((e) => ({
      account: e.account,
      total: safeParseFloat(e.total),
      prevTotal: prevExpenseMap[e.account] ?? 0,
    }));

    const taxRes = (await db.knex!('AccountingLedgerEntry')
      .where('reverted', false)
      .where('account', 'in', taxAccounts)
      .where('date', '<=', toDate)
      .select({
        netGst: db.knex!.raw('sum(cast(credit as real) - cast(debit as real))'),
      })
      .first()) as { netGst?: number };

    return {
      cashBalance,
      cashBalancePrev,
      profit,
      profitPrev,
      receivables: {
        outstanding: safeParseFloat(receivablesRes?.outstanding),
        overdue: safeParseFloat(receivablesRes?.overdue),
        overdueCount: safeParseFloat(receivablesRes?.overdueCount),
      },
      payables: {
        outstanding: safeParseFloat(payablesRes?.outstanding),
        overdue: safeParseFloat(payablesRes?.overdue),
        overdueCount: safeParseFloat(payablesRes?.overdueCount),
        dueNext7: safeParseFloat(payablesRes?.dueNext7),
        dueNext7Count: safeParseFloat(payablesRes?.dueNext7Count),
        nextDueName: nextDueRes?.name,
        nextDueParty: nextDueRes?.party,
        nextDueAmount:
          nextDueRes?.amount !== undefined
            ? safeParseFloat(nextDueRes.amount)
            : undefined,
        nextDueDate: nextDueRes?.dueDate,
      },
      sales: {
        ...salesAgg,
        avgCollectionDays:
          avgCollectionDays === null || avgCollectionDays === undefined
            ? null
            : safeParseFloat(avgCollectionDays),
      },
      purchases: purchasesAgg,
      topExpenses,
      tax: {
        netGst: safeParseFloat(taxRes?.netGst),
      },
    };
  }

  static async getIncomeAndExpenses(
    db: DatabaseCore,
    fromDate: string,
    toDate: string
  ) {
    const income = (await db.knex!.raw(
      `
      select sum(cast(credit as real) - cast(debit as real)) as balance, strftime('%Y-%m', date) as yearmonth
      from AccountingLedgerEntry
      where
        reverted = false and
        date between date(?) and date(?) and
        account in (
          select name
          from Account
          where rootType = 'Income'
        )
      group by yearmonth`,
      [fromDate, toDate]
    )) as IncomeExpense['income'];

    const expense = (await db.knex!.raw(
      `
      select sum(cast(debit as real) - cast(credit as real)) as balance, strftime('%Y-%m', date) as yearmonth
      from AccountingLedgerEntry
      where
        reverted = false and
        date between date(?) and date(?) and
        account in (
          select name
          from Account
          where rootType = 'Expense'
        )
      group by yearmonth`,
      [fromDate, toDate]
    )) as IncomeExpense['expense'];

    return { income, expense };
  }

  static async getTotalCreditAndDebit(db: DatabaseCore) {
    return (await db.knex!.raw(`
    select 
        account, 
      sum(cast(credit as real)) as totalCredit, 
      sum(cast(debit as real)) as totalDebit
    from AccountingLedgerEntry
    group by account
    `)) as unknown as TotalCreditAndDebit;
  }

  static async getStockQuantity(
    db: DatabaseCore,
    item: string,
    location?: string,
    fromDate?: string,
    toDate?: string,
    batch?: string,
    serialNumbers?: string[]
  ): Promise<number | null> {
    /* eslint-disable @typescript-eslint/no-floating-promises */
    const query = db.knex!(ModelNameEnum.StockLedgerEntry)
      .sum('quantity')
      .where('item', item);

    if (location) {
      query.andWhere('location', location);
    }

    if (batch) {
      query.andWhere('batch', batch);
    }

    if (serialNumbers?.length) {
      query.andWhere('serialNumber', 'in', serialNumbers);
    }

    if (fromDate) {
      query.andWhereRaw('datetime(date) > datetime(?)', [fromDate]);
    }

    if (toDate) {
      query.andWhereRaw('datetime(date) < datetime(?)', [toDate]);
    }

    const value = (await query) as Record<string, number | null>[];
    if (!value.length) {
      return null;
    }

    return value[0][Object.keys(value[0])[0]];
  }

  static async getReturnBalanceItemsQty(
    db: DatabaseCore,
    schemaName: ModelNameEnum,
    docName: string
  ): Promise<Record<string, ReturnDocItem> | undefined> {
    const returnDocNames = (
      await db.knex!(schemaName)
        .select('name')
        .where('returnAgainst', docName)
        .andWhere('submitted', true)
        .andWhere('cancelled', false)
    ).map((i: { name: string }) => i.name);

    if (!returnDocNames.length) {
      return;
    }

    const returnedItemsQuery = db.knex!(`${schemaName}Item`)
      .sum({ quantity: 'quantity' })
      .whereIn('parent', returnDocNames);

    const docItemsQuery = db.knex!(`${schemaName}Item`)
      .where('parent', docName)
      .sum({ quantity: 'quantity' });

    if (
      [ModelNameEnum.SalesInvoice, ModelNameEnum.PurchaseInvoice].includes(
        schemaName
      )
    ) {
      returnedItemsQuery.select('item', 'batch').groupBy('item', 'batch');
      docItemsQuery.select('name', 'item', 'batch').groupBy('item', 'batch');
    }

    if (
      [ModelNameEnum.Shipment, ModelNameEnum.PurchaseReceipt].includes(
        schemaName
      )
    ) {
      returnedItemsQuery
        .select('item', 'batch', 'serialNumber')
        .groupBy('item', 'batch', 'serialNumber');
      docItemsQuery
        .select('name', 'item', 'batch', 'serialNumber')
        .groupBy('item', 'batch', 'serialNumber');
    }

    const returnedItems = (await returnedItemsQuery) as DocItem[];
    if (!returnedItems.length) {
      return;
    }
    const docItems = (await docItemsQuery) as DocItem[];

    const docItemsMap = BespokeQueries.#getDocItemMap(docItems);
    const returnedItemsMap = BespokeQueries.#getDocItemMap(returnedItems);

    const returnBalanceItems = BespokeQueries.#getReturnBalanceItemQtyMap(
      docItemsMap,
      returnedItemsMap
    );
    return returnBalanceItems;
  }

  static #getDocItemMap(docItems: DocItem[]): Record<string, ReturnDocItem> {
    const docItemsMap: Record<string, ReturnDocItem> = {};
    const batchesMap:
      | Record<
          string,
          { quantity: number; serialNumbers?: string[] | undefined }
        >
      | undefined = {};

    for (const item of docItems) {
      if (!!docItemsMap[item.item]) {
        if (item.batch) {
          let serialNumbers: string[] | undefined;

          if (!docItemsMap[item.item].batches![item.batch]) {
            docItemsMap[item.item].batches![item.batch] = {
              quantity: item.quantity,
              serialNumbers,
            };
          } else {
            docItemsMap[item.item].batches![item.batch] = {
              quantity: (docItemsMap[item.item].batches![item.batch].quantity +=
                item.quantity),
              serialNumbers,
            };
          }
        } else {
          docItemsMap[item.item].quantity += item.quantity;
        }

        if (item.serialNumber) {
          const serialNumbers: string[] = [];

          if (docItemsMap[item.item].serialNumbers) {
            serialNumbers.push(...(docItemsMap[item.item].serialNumbers ?? []));
          }

          serialNumbers.push(...item.serialNumber.split('\n'));
          docItemsMap[item.item].serialNumbers = serialNumbers;
        }
        continue;
      }

      if (item.batch) {
        let serialNumbers: string[] | undefined = undefined;
        if (item.serialNumber) {
          serialNumbers = item.serialNumber.split('\n');
        }

        batchesMap[item.batch] = {
          serialNumbers,
          quantity: item.quantity,
        };
      }

      let serialNumbers: string[] | undefined = undefined;

      if (!item.batch && item.serialNumber) {
        serialNumbers = item.serialNumber.split('\n');
      }

      docItemsMap[item.item] = {
        serialNumbers,
        batches: batchesMap,
        quantity: item.quantity,
      };
    }
    return docItemsMap;
  }

  static #getReturnBalanceItemQtyMap(
    docItemsMap: Record<string, ReturnDocItem>,
    returnedItemsMap: Record<string, ReturnDocItem>
  ): Record<string, ReturnDocItem> {
    const returnBalanceItems: Record<string, ReturnDocItem> | undefined = {};
    const balanceBatchQtyMap:
      | Record<
          string,
          { quantity: number; serialNumbers: string[] | undefined }
        >
      | undefined = {};

    for (const row in docItemsMap) {
      const balanceSerialNumbersMap: string[] | undefined = [];
      let balanceQty = safeParseFloat(-docItemsMap[row].quantity);
      const docItem = docItemsMap[row];
      const returnedDocItem = returnedItemsMap[row];
      const docItemHasBatch = !!Object.keys(docItem.batches ?? {}).length;

      if (returnedItemsMap) {
        for (const item in returnedItemsMap) {
          if (docItemHasBatch && item !== row) {
            continue;
          }

          balanceQty = -(
            Math.abs(balanceQty) + returnedItemsMap[item].quantity
          );

          const returnedItem = returnedItemsMap[item];

          if (docItem.serialNumbers && returnedItem.serialNumbers) {
            for (const serialNumber of docItem.serialNumbers) {
              if (!returnedItem.serialNumbers.includes(serialNumber)) {
                balanceSerialNumbersMap.push(serialNumber);
              }
            }
          }
        }
      }

      if (docItemHasBatch && docItem.batches) {
        for (const batch in docItem.batches) {
          const docItemSerialNumbers = docItem.batches[batch].serialNumbers;
          const itemSerialNumbers = docItem.batches[batch].serialNumbers;
          let balanceSerialNumbers: string[] | undefined;

          if (docItemSerialNumbers && itemSerialNumbers) {
            balanceSerialNumbers = docItemSerialNumbers.filter(
              (serialNumber: string) =>
                itemSerialNumbers.indexOf(serialNumber) == -1
            );
          }

          const ItemQty = Math.abs(docItem.batches[batch].quantity);
          let balanceQty = safeParseFloat(-ItemQty);

          if (!returnedDocItem || !returnedDocItem?.batches) {
            continue;
          }

          const returnedItem = returnedDocItem?.batches[batch];

          if (!returnedItem) {
            balanceBatchQtyMap[batch] = {
              quantity: balanceQty,
              serialNumbers: balanceSerialNumbers,
            };
            continue;
          }

          balanceQty = -(
            Math.abs(safeParseFloat(-ItemQty)) -
            Math.abs(returnedDocItem.batches[batch].quantity)
          );

          balanceBatchQtyMap[batch] = {
            quantity: balanceQty,
            serialNumbers: balanceSerialNumbers,
          };
        }
      }

      returnBalanceItems[row] = {
        quantity: balanceQty,
        batches: balanceBatchQtyMap,
        serialNumbers: balanceSerialNumbersMap,
      };
    }

    return returnBalanceItems;
  }

  static async getPOSTransactedAmount(
    db: DatabaseCore,
    fromDate: Date,
    toDate: Date,
    lastShiftClosingDate?: Date
  ): Promise<Record<string, number> | undefined> {
    const invoicesQuery = db.knex!(ModelNameEnum.SalesInvoice)
      .select('name', 'returnAgainst')
      .where('isPOS', true)
      .andWhereBetween('date', [fromDate.toISOString(), toDate.toISOString()]);

    if (lastShiftClosingDate) {
      invoicesQuery.andWhere(
        'created',
        '>',
        lastShiftClosingDate.toISOString()
      );
    }

    const invoices = (await invoicesQuery) as {
      name: string;
      returnAgainst: string | null;
    }[];

    if (!invoices.length) {
      return;
    }

    const sinvNames = invoices.map((row) => row.name);
    const invoiceSignMap = invoices.reduce<Record<string, number>>(
      (map, inv) => {
        map[inv.name] = inv.returnAgainst ? -1 : 1;
        return map;
      },
      {}
    );

    const paymentEntryNames: string[] = (
      await db.knex!(ModelNameEnum.PaymentFor)
        .select('parent', 'referenceName')
        .whereIn('referenceName', sinvNames)
    ).map((doc: { parent: string }) => doc.parent);

    if (!paymentEntryNames.length) {
      return;
    }

    const groupedAmounts = (await db.knex!(ModelNameEnum.Payment)
      .select('paymentMethod', 'name')
      .whereIn('name', paymentEntryNames)
      .groupBy('paymentMethod', 'name')
      .sum({ amount: 'amount' })) as {
      paymentMethod: string;
      name: string;
      amount: number;
    }[];

    const transactedAmounts: Record<string, number> = {};

    for (const row of groupedAmounts) {
      const paymentRefs = (await db.knex!(ModelNameEnum.PaymentFor)
        .select('referenceName')
        .where('parent', row.name)) as { referenceName: string }[];

      for (const ref of paymentRefs) {
        const sign = invoiceSignMap[ref.referenceName] ?? 1;
        const signedAmount = Number(row.amount) * sign;

        transactedAmounts[row.paymentMethod] =
          (transactedAmounts[row.paymentMethod] ?? 0) + signedAmount;
      }
    }

    return transactedAmounts;
  }
}
