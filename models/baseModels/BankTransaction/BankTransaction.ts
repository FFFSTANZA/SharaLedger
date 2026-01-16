import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';
import { DateTime } from 'luxon';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';

export class BankTransaction extends Doc {
  date!: Date;
  description!: string;
  amount!: Money;
  type!: 'Credit' | 'Debit';
  bankAccount!: string;
  account?: string;
  party?: string;
  notes?: string;
  status!: 'Unreconciled' | 'Reconciled';
  postedVoucher?: string;
  postedVoucherType?: string;
  matchingVoucher?: string;
  matchingVoucherType?: string;
  reference?: string;
  chequeNo?: string;

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['date', 'description', 'amount', 'type', 'status'],
    };
  }

  async postToGL() {
    if (this.status === 'Reconciled') {
      throw new Error('Transaction is already reconciled');
    }

    // 1. If we have a matching voucher (existing Payment/Invoice)
    if (this.matchingVoucher && this.matchingVoucherType) {
      return await this.reconcileWithMatchingVoucher();
    }

    // 2. Create new document
    if (!this.account) {
      throw new Error('Account is required to post to GL');
    }

    let voucher: Doc;
    if (this.party) {
      voucher = await this.createPaymentEntry();
    } else {
      // Check if it's a transfer between bank accounts
      const isTransfer = await this.checkIfTransfer();
      if (isTransfer) {
          voucher = await this.createTransferEntry();
      } else {
          voucher = await this.createJournalEntry();
      }
    }

    await voucher.submit();

    await this.setAndSync({
      status: 'Reconciled',
      postedVoucher: voucher.name,
      postedVoucherType: voucher.schemaName,
    });

    return voucher;
  }

  async suggest() {
    // 1. Try to find a matching voucher first (High confidence)
    const match = await this.findMatch();
    if (match) {
      await this.setAndSync({
        matchingVoucher: match.name,
        matchingVoucherType: match.schemaName,
      });
      return;
    }

    // 2. Try pattern matching
    const suggestion = await this.getPatternSuggestion();
    if (suggestion) {
        await this.setAndSync(suggestion);
    }
  }

  async findMatch() {
    const amount = this.amount;
    const isCredit = this.type === 'Credit';

    // Search in Payments
    const paymentType = isCredit ? 'Receive' : 'Pay';
    const payments = await this.fyo.db.getAllRaw(ModelNameEnum.Payment, {
        filters: {
            paymentType,
            amount: amount,
            docstatus: 1, // Submitted
        },
        limit: 5,
    });

    // Check if one of them is within 7 days
    const txnDate = DateTime.fromJSDate(this.date);
    for (const p of payments) {
        const pDate = DateTime.fromJSDate(new Date(p.date as string));
        if (Math.abs(pDate.diff(txnDate, 'days').days) <= 7) {
            return await this.fyo.doc.getDoc(ModelNameEnum.Payment, p.name as string);
        }
    }

    // Search in Unpaid Invoices
    const invoiceModel = isCredit ? ModelNameEnum.SalesInvoice : ModelNameEnum.PurchaseInvoice;
    const invoices = await this.fyo.db.getAllRaw(invoiceModel, {
        filters: {
            outstandingAmount: amount,
            docstatus: 1,
        },
        limit: 5,
    });

    for (const inv of invoices) {
        const invDate = DateTime.fromJSDate(new Date(inv.date as string));
        if (Math.abs(invDate.diff(txnDate, 'days').days) <= 30) {
            return await this.fyo.doc.getDoc(invoiceModel, inv.name as string);
        }
    }

    return null;
  }

  private async getPatternSuggestion() {
    const desc = this.description.toLowerCase();
    const isCredit = this.type === 'Credit';

    // 1. Try to find a matching BankRule
    try {
        const rules = await this.fyo.db.getAllRaw(ModelNameEnum.BankRule, {
            filters: { isActive: true },
        });

        for (const rule of rules) {
            if (desc.includes((rule.condition as string).toLowerCase())) {
                return {
                    account: rule.targetAccount as string,
                    party: rule.targetParty as string | undefined,
                };
            }
        }
    } catch (e) {
        console.error('Error fetching bank rules:', e);
    }

    // 2. Fallback to hardcoded simple pattern rules
    const patterns: Record<string, string> = {
        'salary': 'Salaries',
        'rent': 'Rent Expense',
        'electricity': 'Electricity Expense',
        'water': 'Water Expense',
        'internet': 'Internet Expense',
        'phone': 'Telephone Expense',
        'gst': isCredit ? 'GST Payable' : 'GST Input',
        'tax': 'Taxes Paid',
        'interest': isCredit ? 'Interest Income' : 'Interest Expense',
        'bank charges': 'Bank Charges',
        'service charge': 'Bank Charges',
    };

    for (const [kw, acc] of Object.entries(patterns)) {
        if (desc.includes(kw)) {
            const account = await this.findAccount(acc);
            if (account) return { account };
        }
    }

    // Try to find party
    const parties = await this.fyo.db.getAllRaw(ModelNameEnum.Party, { fields: ['name'] });
    for (const p of parties) {
        if (desc.includes((p.name as string).toLowerCase())) {
            return { 
                party: p.name as string,
                account: isCredit ? 'Sales' : 'Cost of Goods Sold' // Default accounts
            };
        }
    }

    return null;
  }

  private async findAccount(name: string) {
    const results = await this.fyo.db.getAllRaw(ModelNameEnum.Account, {
        filters: { name: { like: `%${name}%` }, isGroup: false },
        limit: 1
    });
    return results.length > 0 ? results[0].name as string : null;
  }

  private async reconcileWithMatchingVoucher() {
    const voucher = await this.fyo.doc.getDoc(
      this.matchingVoucherType!,
      this.matchingVoucher!
    );

    // If it's an Invoice, we should create a Payment against it
    if (
      voucher.schemaName === ModelNameEnum.SalesInvoice ||
      voucher.schemaName === ModelNameEnum.PurchaseInvoice
    ) {
      const payment = await this.createPaymentForInvoice(voucher);
      await payment.submit();
      
      await this.setAndSync({
        status: 'Reconciled',
        postedVoucher: payment.name,
        postedVoucherType: payment.schemaName,
      });
      return payment;
    }

    // If it's already a Payment or JournalEntry, just link it
    await this.setAndSync({
      status: 'Reconciled',
      postedVoucher: voucher.name,
      postedVoucherType: voucher.schemaName,
    });

    return voucher;
  }

  private async createPaymentEntry() {
    const isCredit = this.type === 'Credit';
    
    // Check if party exists
    let partyExists = await this.fyo.db.exists('Party', this.party!);
    if (!partyExists) {
        const newParty = this.fyo.doc.getNewDoc('Party');
        await newParty.set({
            name: this.party,
            role: isCredit ? 'Customer' : 'Supplier',
        });
        await newParty.sync();
    }

    const payment = this.fyo.doc.getNewDoc(ModelNameEnum.Payment);
    await payment.set({
      party: this.party,
      date: this.date,
      paymentType: isCredit ? 'Receive' : 'Pay',
      amount: this.amount,
      referenceId: this.reference || this.chequeNo || undefined,
      paymentMethod: 'Bank',
    });

    if (isCredit) {
      // Money coming in: From Party Account -> To Bank Account
      await payment.set({
        account: this.account, // Party receivable account
        paymentAccount: this.bankAccount, // Bank account
      });
    } else {
      // Money going out: From Bank Account -> To Party Account
      await payment.set({
        account: this.bankAccount, // Bank account
        paymentAccount: this.account, // Party payable account
      });
    }

    await payment.sync();
    return payment;
  }

  private async createPaymentForInvoice(invoice: Doc) {
    const isCredit = this.type === 'Credit';
    const payment = this.fyo.doc.getNewDoc(ModelNameEnum.Payment);
    
    await payment.set({
      party: invoice.party,
      date: this.date,
      paymentType: isCredit ? 'Receive' : 'Pay',
      amount: this.amount,
      referenceId: this.reference || this.chequeNo || undefined,
      paymentMethod: 'Bank',
    });

    if (isCredit) {
      await payment.set({
        account: invoice.account,
        paymentAccount: this.bankAccount,
      });
    } else {
      await payment.set({
        account: this.bankAccount,
        paymentAccount: invoice.account,
      });
    }

    // Set "Payment For" table
    const paymentFor = payment.fyo.doc.getNewDoc(ModelNameEnum.PaymentFor);
    await paymentFor.set({
        referenceType: invoice.schemaName,
        referenceName: invoice.name,
        amount: this.amount,
    });
    await payment.set({ for: [paymentFor] });

    await payment.sync();
    return payment;
  }

  private async createJournalEntry() {
    const isCredit = this.type === 'Credit';
    const amount = this.amount;
    
    const je = this.fyo.doc.getNewDoc(ModelNameEnum.JournalEntry);
    await je.set({
      entryType: 'Bank Entry',
      date: this.date,
      referenceNumber: this.reference || this.chequeNo || undefined,
      userRemark: this.notes || this.description || undefined,
    });

    const accounts = [];
    if (isCredit) {
      // Money coming in (Debit bank, Credit income/other account)
      accounts.push({
        account: this.bankAccount,
        debit: amount,
        credit: this.fyo.pesa(0),
      });
      accounts.push({
        account: this.account,
        debit: this.fyo.pesa(0),
        credit: amount,
      });
    } else {
      // Money going out (Credit bank, Debit expense/other account)
      accounts.push({
        account: this.bankAccount,
        debit: this.fyo.pesa(0),
        credit: amount,
      });
      accounts.push({
        account: this.account,
        debit: amount,
        credit: this.fyo.pesa(0),
      });
    }

    await je.set({ accounts });
    await je.sync();
    return je;
  }

  private async checkIfTransfer() {
    if (!this.account) return false;
    const acc = await this.fyo.doc.getDoc(ModelNameEnum.Account, this.account);
    return acc.accountType === 'Bank' || acc.accountType === 'Cash';
  }

  private async createTransferEntry() {
    // Transfers are best represented by Journal Entry in Frappe Books
    // or a Payment if you prefer. Let's use Journal Entry.
    return await this.createJournalEntry();
  }
}
