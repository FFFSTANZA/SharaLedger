import { Doc } from 'fyo/model/doc';
import { Money } from 'pesa';
import { ModelNameEnum } from 'models/types';
import { isPesa } from 'fyo/utils';

export type LinkedEntryRelationship =
  | 'payment'
  | 'return'
  | 'stock_transfer'
  | 'journal_entry'
  | 'ledger_entry'
  | 'reference'
  | 'child_table'
  | 'other';

export interface LinkedEntryReason {
  // The business reason for this link
  reason: string;
  // The impact/effect of this link
  impact?: string;
  // The relationship type
  relationship: LinkedEntryRelationship;
  // Icon to display
  icon: string;
  // Color class for visual distinction
  color: 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'gray';
  // Additional metadata
  metadata?: {
    amount?: Money;
    quantity?: number;
    percentage?: number;
    status?: string;
  };
}

interface LinkedDoc {
  name: string;
  schemaName: string;
  [key: string]: unknown;
}

/**
 * Get the business reason and impact for a linked entry
 */
export async function getLinkedEntryReason(
  sourceDoc: Doc,
  linkedDoc: LinkedDoc
): Promise<LinkedEntryReason> {
  const { schemaName } = linkedDoc;

  // Payment relationships
  if (schemaName === ModelNameEnum.Payment) {
    return await getPaymentReason(sourceDoc, linkedDoc);
  }

  // Stock transfer relationships
  if (
    schemaName === ModelNameEnum.Shipment ||
    schemaName === ModelNameEnum.PurchaseReceipt
  ) {
    return await getStockTransferReason(sourceDoc, linkedDoc);
  }

  // Invoice relationships
  if (
    schemaName === ModelNameEnum.SalesInvoice ||
    schemaName === ModelNameEnum.PurchaseInvoice
  ) {
    return await getInvoiceReason(sourceDoc, linkedDoc);
  }

  // Quote relationships
  if (schemaName === 'SalesQuote') {
    return await getQuoteReason(sourceDoc, linkedDoc);
  }

  // Journal Entry relationships
  if (schemaName === ModelNameEnum.JournalEntry) {
    return getJournalEntryReason(sourceDoc, linkedDoc);
  }

  // Ledger Entry relationships
  if (schemaName === ModelNameEnum.AccountingLedgerEntry) {
    return getLedgerEntryReason(sourceDoc, linkedDoc);
  }

  if (schemaName === ModelNameEnum.StockLedgerEntry) {
    return getStockLedgerEntryReason(sourceDoc, linkedDoc);
  }

  // Stock Movement relationships
  if (schemaName === ModelNameEnum.StockMovement) {
    return getStockMovementReason(sourceDoc, linkedDoc);
  }

  // Default for other relationships
  return getDefaultReason(sourceDoc, linkedDoc);
}

async function getPaymentReason(
  sourceDoc: Doc,
  linkedDoc: LinkedDoc
): Promise<LinkedEntryReason> {
  const amount = linkedDoc.amount as Money | undefined;
  const party = linkedDoc.party as string | undefined;
  const paymentType = linkedDoc.paymentType as string | undefined;

  // Check if this payment is against the source document
  let amountAgainstSource: Money | undefined;
  try {
    const paymentForEntries = (await sourceDoc.fyo.db.getAll('PaymentFor', {
      fields: ['amount'],
      filters: {
        parent: linkedDoc.name,
        referenceName: sourceDoc.name!,
      },
    })) as { amount: Money }[];

    if (paymentForEntries.length > 0) {
      amountAgainstSource = paymentForEntries[0].amount;
    }
  } catch (e) {
    // Payment might not be against this document
  }

  const isReceive = paymentType === 'Receive';
  const verb = isReceive ? 'received' : 'paid';
  const direction = isReceive ? 'from' : 'to';

  let reason = '';
  let impact = '';

  if (amountAgainstSource) {
    // Payment is specifically against this document
    reason = `Payment ${verb} ${direction} ${party || 'party'}`;
    impact = `Reduced outstanding by ${sourceDoc.fyo.format(amountAgainstSource, 'Currency')}`;
  } else {
    // Payment exists but might not be directly linked
    reason = `Payment ${verb} ${direction} ${party || 'party'}`;
    if (amount) {
      impact = `Amount: ${sourceDoc.fyo.format(amount, 'Currency')}`;
    }
  }

  return {
    reason,
    impact,
    relationship: 'payment',
    icon: isReceive ? 'arrow-down-circle' : 'arrow-up-circle',
    color: 'green',
    metadata: {
      amount: amountAgainstSource || amount,
    },
  };
}

async function getStockTransferReason(
  sourceDoc: Doc,
  linkedDoc: LinkedDoc
): Promise<LinkedEntryReason> {
  const schemaName = linkedDoc.schemaName;
  const isShipment = schemaName === ModelNameEnum.Shipment;
  const party = linkedDoc.party as string | undefined;
  const grandTotal = linkedDoc.grandTotal as Money | undefined;
  const returnAgainst = linkedDoc.returnAgainst as string | undefined;

  let reason = '';
  let impact = '';
  let icon = '';
  let color: LinkedEntryReason['color'] = 'blue';

  if (returnAgainst) {
    // This is a return
    reason = isShipment
      ? `Stock returned from ${party || 'customer'}`
      : `Stock returned to ${party || 'supplier'}`;
    impact = 'Items received back';
    icon = 'corner-up-left';
    color = 'orange';
  } else {
    // Normal stock transfer
    reason = isShipment
      ? `Stock shipped to ${party || 'customer'}`
      : `Stock received from ${party || 'supplier'}`;

    // Try to get quantity information
    try {
      const items = (await sourceDoc.fyo.db.getAll(
        isShipment ? 'ShipmentItem' : 'PurchaseReceiptItem',
        {
          fields: ['quantity'],
          filters: { parent: linkedDoc.name },
        }
      )) as { quantity: number }[];

      const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQty > 0) {
        impact = `${sourceDoc.fyo.format(totalQty, 'Float')} items transferred`;
      }
    } catch (e) {
      // Couldn't get item details
      if (grandTotal && grandTotal.isPositive()) {
        impact = `Value: ${sourceDoc.fyo.format(grandTotal, 'Currency')}`;
      }
    }

    icon = isShipment ? 'truck' : 'package';
    color = 'blue';
  }

  return {
    reason,
    impact,
    relationship: 'stock_transfer',
    icon,
    color,
    metadata: {
      amount: grandTotal,
    },
  };
}

async function getInvoiceReason(
  sourceDoc: Doc,
  linkedDoc: LinkedDoc
): Promise<LinkedEntryReason> {
  const schemaName = linkedDoc.schemaName;
  const isSales = schemaName === ModelNameEnum.SalesInvoice;
  const party = linkedDoc.party as string | undefined;
  const grandTotal = linkedDoc.grandTotal as Money | undefined;
  const outstandingAmount = linkedDoc.outstandingAmount as Money | undefined;
  const returnAgainst = linkedDoc.returnAgainst as string | undefined;

  let reason = '';
  let impact = '';
  let color: LinkedEntryReason['color'] = 'blue';

  if (returnAgainst) {
    // This is a return invoice
    reason = isSales
      ? `Credit note issued to ${party || 'customer'}`
      : `Debit note issued to ${party || 'supplier'}`;
    impact = grandTotal
      ? `Returned ${sourceDoc.fyo.format(grandTotal.abs(), 'Currency')}`
      : '';
    color = 'orange';
  } else {
    // Normal invoice
    reason = isSales
      ? `Invoice raised for ${party || 'customer'}`
      : `Bill received from ${party || 'supplier'}`;

    if (outstandingAmount && outstandingAmount.isPositive()) {
      const paidAmount = grandTotal
        ? grandTotal.sub(outstandingAmount)
        : sourceDoc.fyo.pesa(0);
      if (paidAmount.isPositive()) {
        impact = `Paid ${sourceDoc.fyo.format(paidAmount, 'Currency')} of ${sourceDoc.fyo.format(grandTotal!, 'Currency')}`;
      } else {
        impact = `Outstanding: ${sourceDoc.fyo.format(outstandingAmount, 'Currency')}`;
      }
      color = 'orange';
    } else if (grandTotal) {
      impact = `Fully paid: ${sourceDoc.fyo.format(grandTotal, 'Currency')}`;
      color = 'green';
    }
  }

  return {
    reason,
    impact,
    relationship: returnAgainst ? 'return' : 'reference',
    icon: isSales ? 'file-text' : 'shopping-cart',
    color,
    metadata: {
      amount: grandTotal,
      status: outstandingAmount?.isPositive() ? 'unpaid' : 'paid',
    },
  };
}

function getJournalEntryReason(
  sourceDoc: Doc,
  linkedDoc: LinkedDoc
): LinkedEntryReason {
  const entryType = linkedDoc.entryType as string | undefined;

  let reason = '';
  let impact = '';

  switch (entryType) {
    case 'Journal Entry':
      reason = 'Manual journal entry created';
      impact = 'Accounting adjustment made';
      break;
    case 'Bank Entry':
      reason = 'Bank transaction recorded';
      impact = 'Bank balance updated';
      break;
    case 'Cash Entry':
      reason = 'Cash transaction recorded';
      impact = 'Cash balance updated';
      break;
    case 'Credit Note':
      reason = 'Credit note adjustment';
      impact = 'Account credited';
      break;
    case 'Debit Note':
      reason = 'Debit note adjustment';
      impact = 'Account debited';
      break;
    default:
      reason = `${entryType || 'Journal entry'} recorded`;
      impact = 'Accounts adjusted';
  }

  return {
    reason,
    impact,
    relationship: 'journal_entry',
    icon: 'book',
    color: 'purple',
  };
}

function getLedgerEntryReason(
  sourceDoc: Doc,
  linkedDoc: LinkedDoc
): LinkedEntryReason {
  const account = linkedDoc.account as string | undefined;
  const credit = linkedDoc.credit as Money | undefined;
  const debit = linkedDoc.debit as Money | undefined;

  let reason = `Accounting entry in ${account || 'account'}`;
  let impact = '';

  if (isPesa(credit) && credit.isPositive()) {
    impact = `Credited ${sourceDoc.fyo.format(credit, 'Currency')}`;
  } else if (isPesa(debit) && debit.isPositive()) {
    impact = `Debited ${sourceDoc.fyo.format(debit, 'Currency')}`;
  }

  return {
    reason,
    impact,
    relationship: 'ledger_entry',
    icon: 'layers',
    color: 'gray',
    metadata: {
      amount: credit?.isPositive() ? credit : debit,
    },
  };
}

function getStockLedgerEntryReason(
  sourceDoc: Doc,
  linkedDoc: LinkedDoc
): LinkedEntryReason {
  const item = linkedDoc.item as string | undefined;
  const location = linkedDoc.location as string | undefined;
  const quantity = linkedDoc.quantity as number | undefined;

  const reason = `Stock movement for ${item || 'item'}`;
  const impact =
    quantity !== undefined
      ? `${quantity > 0 ? 'Added' : 'Removed'} ${sourceDoc.fyo.format(Math.abs(quantity), 'Float')} units ${location ? `at ${location}` : ''}`
      : '';

  return {
    reason,
    impact,
    relationship: 'ledger_entry',
    icon: 'box',
    color: 'gray',
    metadata: {
      quantity,
    },
  };
}

function getStockMovementReason(
  sourceDoc: Doc,
  linkedDoc: LinkedDoc
): LinkedEntryReason {
  const amount = linkedDoc.amount as Money | undefined;

  return {
    reason: 'Stock transferred between locations',
    impact: amount
      ? `Value: ${sourceDoc.fyo.format(amount, 'Currency')}`
      : 'Items moved',
    relationship: 'stock_transfer',
    icon: 'shuffle',
    color: 'blue',
    metadata: {
      amount,
    },
  };
}

async function getQuoteReason(
  sourceDoc: Doc,
  linkedDoc: LinkedDoc
): Promise<LinkedEntryReason> {
  const party = linkedDoc.party as string | undefined;
  const grandTotal = linkedDoc.grandTotal as Money | undefined;

  const reason = `Quote prepared for ${party || 'customer'}`;
  const impact = grandTotal
    ? `Quoted value: ${sourceDoc.fyo.format(grandTotal, 'Currency')}`
    : 'Proposal sent';

  return {
    reason,
    impact,
    relationship: 'reference',
    icon: 'file',
    color: 'blue',
    metadata: {
      amount: grandTotal,
      status: 'quote',
    },
  };
}

function getDefaultReason(sourceDoc: Doc, linkedDoc: LinkedDoc): LinkedEntryReason {
  const schemaLabel =
    sourceDoc.fyo.schemaMap[linkedDoc.schemaName]?.label || linkedDoc.schemaName;
  const name = linkedDoc.name as string | undefined;

  // Handle reference documents (Party, Item, Account, Location)
  if (linkedDoc.schemaName === ModelNameEnum.Party) {
    const partyName = name;
    const role = (linkedDoc as any).role as string | undefined;
    return {
      reason: role ? `${role}: ${partyName}` : partyName,
      impact: 'Party record',
      relationship: 'reference',
      icon: 'user',
      color: 'blue',
    };
  }

  if (linkedDoc.schemaName === ModelNameEnum.Item) {
    const itemName = name;
    const itemType = (linkedDoc as any).itemType as string | undefined;
    return {
      reason: itemType ? `${itemType}: ${itemName}` : itemName,
      impact: 'Item record',
      relationship: 'reference',
      icon: 'box',
      color: 'blue',
    };
  }

  if (linkedDoc.schemaName === ModelNameEnum.Account) {
    const accountName = name;
    const rootType = (linkedDoc as any).rootType as string | undefined;
    return {
      reason: rootType ? `${rootType}: ${accountName}` : accountName,
      impact: 'Account record',
      relationship: 'ledger_entry',
      icon: 'layers',
      color: 'purple',
    };
  }

  if (linkedDoc.schemaName === ModelNameEnum.Location) {
    const locationName = name;
    return {
      reason: locationName,
      impact: 'Location record',
      relationship: 'reference',
      icon: 'map-pin',
      color: 'blue',
    };
  }

  // Default fallback for other types
  const party = linkedDoc.party as string | undefined;
  const item = linkedDoc.item as string | undefined;
  const account = linkedDoc.account as string | undefined;

  let reason = `Related ${schemaLabel.toLowerCase()}`;
  let impact = 'Referenced document';

  // Add context based on schema type
  if (party) {
    reason = `${schemaLabel} for ${party}`;
  } else if (item) {
    reason = `${schemaLabel}: ${item}`;
  } else if (account) {
    reason = `${schemaLabel}: ${account}`;
  } else if (name) {
    reason = `${schemaLabel}: ${name}`;
  }

  return {
    reason,
    impact,
    relationship: 'reference',
    icon: 'link',
    color: 'gray',
  };
}

/**
 * Get aggregated impact summary for all linked entries
 */
export function getLinkedEntriesImpactSummary(
  reasons: LinkedEntryReason[]
): {
  totalPayments: Money | null;
  totalOutstanding: Money | null;
  itemsTransferred: number;
  hasReturns: boolean;
} {
  let totalPayments: Money | null = null;
  let totalOutstanding: Money | null = null;
  let itemsTransferred = 0;
  let hasReturns = false;

  for (const reason of reasons) {
    if (reason.relationship === 'payment' && reason.metadata?.amount) {
      if (!totalPayments) {
        totalPayments = reason.metadata.amount;
      } else {
        totalPayments = totalPayments.add(reason.metadata.amount);
      }
    }

    if (reason.relationship === 'return') {
      hasReturns = true;
    }

    if (
      reason.relationship === 'stock_transfer' &&
      reason.metadata?.quantity
    ) {
      itemsTransferred += reason.metadata.quantity;
    }
  }

  return {
    totalPayments,
    totalOutstanding,
    itemsTransferred,
    hasReturns,
  };
}

/**
 * Group linked entries by relationship type
 */
export function groupLinkedEntriesByRelationship(
  entries: Array<LinkedDoc & { reason: LinkedEntryReason }>
): Record<LinkedEntryRelationship, Array<LinkedDoc & { reason: LinkedEntryReason }>> {
  const groups: Record<LinkedEntryRelationship, Array<LinkedDoc & { reason: LinkedEntryReason }>> = {
    payment: [],
    return: [],
    stock_transfer: [],
    journal_entry: [],
    ledger_entry: [],
    reference: [],
    child_table: [],
    other: [],
  };

  for (const entry of entries) {
    groups[entry.reason.relationship].push(entry);
  }

  return groups;
}
