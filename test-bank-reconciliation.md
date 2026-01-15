# Bank Reconciliation Fixes - January 2025

## Problem
The bank reconciliation feature was failing with FOREIGN KEY constraint errors when trying to suggest/post transactions:

```
SqliteError: update `BankTransaction` set `suggestedLedger` = 'Purchase' ... FOREIGN KEY constraint failed
```

## Root Cause
The `suggestedLedger` and `party` fields in BankTransaction are Link fields with FOREIGN KEY constraints:
- `suggestedLedger` → Links to Account table
- `party` → Links to Party table

The auto-categorization system was suggesting account/party names that didn't exist in the database, causing SQLite to reject the UPDATE/INSERT operations.

## Solutions Implemented

### 1. Auto-Categorization Enhancements (`src/banking/autoCategorize.ts`)

#### Account Type Mappings
Added comprehensive mappings for all business accounts:
```typescript
private accountTypeMapping: Record<string, { rootType: string; accountType: string }> = {
  'Purchase': { rootType: 'Expense', accountType: 'Expense Account' },
  'Taxes': { rootType: 'Expense', accountType: 'Expense Account' },
  'Discounts': { rootType: 'Income', accountType: 'Income Account' },
  'Interest Income': { rootType: 'Income', accountType: 'Income Account' },
  // ... 30+ account mappings
};
```

#### Auto-Account Creation
Added `ensureAccountExists()` method that:
1. Checks if account exists in database
2. If not, creates it automatically with proper rootType and accountType
3. Returns success/failure status

Called automatically after suggestion generation:
```typescript
// If we have an account, ensure it exists in the database
if (account) {
  await this.ensureAccountExists(account);
}
```

#### Enhanced Party Detection
Improved `findPartyFromDescription()` to:
1. Sort parties by length (longer names first) to avoid false positives
2. Use regex word boundaries for exact matching
3. Extract party names from common patterns:
   - "Payment from Client X"
   - "To Customer Y"
   - "Vendor Z"

```typescript
const fromMatch = description.match(/(?:from|to|client|customer|vendor|supplier)\s+([A-Za-z\s]+?)(?:\s+(?:via|by|using|through)|$)/i);
```

#### Return Party in Suggestions
Modified `autoCategorizeTransaction()` to return party:
```typescript
export async function autoCategorizeTransaction(
  transaction: any,
  fyo: Fyo
): Promise<{ account: string | undefined; voucherType: string; party?: string }>
```

### 2. Bank Reconciliation UI Enhancements (`src/pages/BankReconciliation.vue`)

#### Added Party Column
- Added Party column to transactions table header
- Displays `partyName || txn.party || '-'`
- Shows which party was detected from the description

#### Enhanced Suggestion Verification
Modified all suggestion methods to verify existence before saving:

```typescript
// Only set suggestedLedger if we have a valid account
if (suggestion.account) {
  try {
    const accountExists = await fyo.db.exists('Account', suggestion.account);
    if (accountExists) {
      doc.suggestedLedger = suggestion.account;
    } else {
      console.warn(`Account ${suggestion.account} does not exist`);
      doc.suggestedLedger = '';
    }
  } catch (e) {
    console.warn(`Error checking account existence:`, e);
    doc.suggestedLedger = '';
  }
}

// Set party if suggested
if (suggestion.party) {
  try {
    const partyExists = await fyo.db.exists('Party', suggestion.party);
    if (partyExists) {
      doc.party = suggestion.party;
    } else {
      console.warn(`Party ${suggestion.party} does not exist`);
    }
  } catch (e) {
    console.warn(`Error checking party existence:`, e);
  }
}
```

#### Enhanced Edit Suggestion Modal
- Now validates both ledger and party before saving
- Shows clear error messages for invalid references
- Prevents FK constraint violations at the UI level

### 3. New Auto-Categorization Rules

Added rules for previously unsupported transaction types:
- **Equipment Purchase**: "equipment purchase", "office equipment", "laptop", "furniture", etc.
- **Miscellaneous Business Expense**: "misc business expense", "general expense"
- **Client Payment Patterns**: "payment from client", "payment from customer"

## Testing Checklist

- [x] Import bank statement with transactions
- [x] Click "Suggest" on imported transactions
- [x] Verify suggested ledger accounts are auto-created
- [x] Verify parties are extracted from descriptions
- [x] Click "Post" to create GL vouchers
- [x] Verify no FOREIGN KEY constraint errors
- [x] Test editing suggestions with custom ledger/party
- [x] Verify party column displays correctly

## Benefits

1. **No More FK Errors**: Accounts are created automatically, eliminating constraint violations
2. **Better Party Detection**: Patterns extract party names from "Payment from/to X" formats
3. **More Flexible**: Users can edit both ledger and party in suggestion modal
4. **Better Visibility**: Party column shows detected parties at a glance
5. **Robust Error Handling**: Clear messages when something goes wrong
6. **Smart Account Creation**: Accounts created with proper rootType and accountType

## Notes

- Parent accounts are not used (to avoid cascading FK complexity)
- All accounts are created as leaf nodes (isGroup: false)
- Party detection is case-insensitive and uses word boundaries
- Account creation is idempotent (won't fail if already exists)
- Caches (accountsCache, partiesCache) improve performance
