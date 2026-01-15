# Banking Module V2 - Clean Architecture

## Philosophy: Tally/Zoho Style Banking

**Core Principle**: Bank transactions are imported records, NOT accounting vouchers. When you "post" them, they create proper Payment/JournalEntry documents that handle all GL posting.

## Architecture

### 1. Bank Transaction (Import Record)
- Simple data storage, NO foreign key constraints
- All fields are Data/Currency/Date types
- Tracks: date, description, amount, type (debit/credit)
- Status: `Unreconciled` → `Reconciled`
- Links to created voucher: `postedVoucher` + `postedVoucherType`

### 2. Voucher Creation (Payment/Journal Entry)
- User categorizes: account, party (optional), notes
- Click "Post" → Creates Payment or JournalEntry
- The voucher handles all GL posting through existing system
- Bank transaction stores reference to created voucher

### 3. Reconciliation
- Match bank transactions with existing vouchers OR
- Create new vouchers from bank transactions
- Mark as reconciled when matched

## User Flow

```
Import Statement → View Transactions → Categorize → Post to GL → Reconciled
                                          ↓
                                    Auto-suggest based on:
                                    - Description patterns
                                    - Amount matching
                                    - Party names
```

## Key Features

### Auto-Categorization
- Pattern matching on description
- Amount-based matching with existing vouchers
- Learning from past categorizations
- Smart defaults (Income/Expense account suggestions)

### Batch Operations
- Auto-categorize all uncategorized
- Post multiple transactions at once
- Bulk matching with existing vouchers

### Bank Account Management
- Multiple bank accounts supported
- Import from CSV/Excel/OFX
- Duplicate detection

## Schema Changes

### BankTransaction
```json
{
  "status": ["Unreconciled", "Reconciled"],
  "account": "Data",  // No FK constraint
  "party": "Data",    // No FK constraint
  "notes": "Text",
  "postedVoucher": "Data",
  "postedVoucherType": "Data",
  "bankAccount": "Data"  // No FK constraint
}
```

### Benefits
1. ✅ No FK constraint errors
2. ✅ Simple 2-state workflow
3. ✅ Proper GL posting through existing voucher system
4. ✅ Flexible and user-friendly
5. ✅ Easy to extend and maintain
6. ✅ Works seamlessly with Fyo framework

## Implementation Plan

1. Clean BankTransaction schema (remove all FKs)
2. New posting logic that creates Payment/JournalEntry
3. Simplified UI with inline editing
4. Smart auto-categorization
5. Bank account selector
6. Voucher matching system
