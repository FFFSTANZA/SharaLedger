# Banking Module Migration Notes

## Schema Change: Removed `linkedVoucher` Column

### Background
The `linkedVoucher` field was defined in the BankTransaction schema but was never actually created in the database table. This caused SQL errors when trying to query or insert data:
```
SqliteError: table BankTransaction has no column named linkedVoucher
```

### Changes Made
- Removed `linkedVoucher` field from `schemas/app/BankTransaction.json`
- Removed `linkedVoucher` from all TypeScript interfaces
- Removed `linkedVoucher` from database queries

### Migration Impact

#### For New Installations
✅ **No action required**
- The BankTransaction table will be created without the linkedVoucher column
- Everything will work as expected

#### For Existing Installations
✅ **No action required**
- The linkedVoucher column was never actually created in the database
- It only existed in the schema definition
- Removing it from the schema aligns the code with the actual database structure
- No data loss since the column never existed

#### If You Somehow Have a linkedVoucher Column (Unlikely)
If your database somehow has a linkedVoucher column (which shouldn't happen based on the codebase), you have two options:

**Option 1: Keep the column (safe)**
```sql
-- The column will remain in the database but won't be used
-- No action needed
```

**Option 2: Remove the column (optional cleanup)**
```sql
-- WARNING: Test this in a backup first!
-- SQLite requires creating a new table without the column

-- 1. Create backup
cp data/frappe.db data/frappe.db.backup

-- 2. Use SQLite to rebuild table without linkedVoucher
-- This is complex and should only be done if absolutely necessary
-- Better approach: Leave the unused column alone
```

### Verification Steps

1. **Check your database schema:**
```bash
sqlite3 data/frappe.db ".schema BankTransaction"
```

2. **Run the test suite:**
```bash
./test-banking-tabs.sh
```

3. **Test import functionality:**
   - Go to Banking → Statement Import
   - Import a sample bank statement
   - Verify no SQL errors in the console
   - Switch to Reconciliation tab
   - Verify transactions appear correctly

### Rollback (If Needed)

If you need to rollback this change:

1. **Restore the schema definition:**
```bash
git checkout HEAD~1 -- schemas/app/BankTransaction.json
```

2. **Restore the old pages:**
```bash
git checkout HEAD~1 -- src/pages/BankImport.vue
git checkout HEAD~1 -- src/pages/BankReconciliation.vue
git checkout HEAD~1 -- src/router.ts
git checkout HEAD~1 -- src/utils/sidebarConfig.ts
```

3. **Remove the Banking.vue parent:**
```bash
rm src/pages/Banking.vue
```

However, note that rollback will bring back the SQL errors.

### Additional Changes

#### UI Restructure: Tabbed Banking Interface

The Banking module now uses a tabbed interface for better UX:
- **Before:** Separate pages for Import and Reconciliation
- **After:** Single Banking page with tabs

**Benefits:**
- Seamless navigation between import and reconciliation
- Auto-refresh when switching to reconciliation tab
- Better workflow integration
- Cleaner sidebar menu

**Backward Compatibility:**
- Old routes redirect to new structure:
  - `/bank-import` → `/banking`
  - `/bank-reconciliation` → `/banking?tab=reconciliation`
- Bookmarks and saved links continue to work

### Support

If you encounter any issues:

1. Check the console for errors
2. Run `./test-banking-tabs.sh` to verify setup
3. Review the BANKING_CHANGES.md documentation
4. Check that your database is properly initialized

### Summary

✅ Safe migration - no data loss
✅ Fixes critical SQL errors
✅ Improves user experience
✅ Maintains backward compatibility
✅ No manual migration steps required
