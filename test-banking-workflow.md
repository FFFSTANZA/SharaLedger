# Banking Module - User Workflow Test

## Test Environment Setup
1. Ensure the application is running: `npm run dev`
2. Open the application in a browser
3. Have a sample bank statement ready (CSV or Excel)

---

## Test Case 1: Direct Access to Banking Module

### Steps
1. Navigate to sidebar
2. Find "Setup" section
3. Click on "Banking" → "Statement Import"

### Expected Results
✅ Banking page opens
✅ Import tab is active by default
✅ "Import Bank Statement" header visible
✅ File upload area visible
✅ Tab bar shows "Statement Import" and "Reconciliation"

---

## Test Case 2: Import Bank Statement

### Steps
1. On Import tab, click "Import Statement" button
2. Select a bank statement file (CSV/XLSX)
3. Verify column mappings are auto-detected
4. Click "Import" button
5. Wait for import to complete

### Expected Results
✅ File loads successfully
✅ Transactions preview appears
✅ Column mapping sidebar shows correct mappings
✅ Summary shows total credits/debits
✅ Import completes without errors
✅ Success modal appears
✅ No "linkedVoucher" errors in console

### Console Verification
```javascript
// Open browser console (F12)
// Should see NO errors like:
// ❌ "no such column: linkedVoucher"
// ❌ "table BankTransaction has no column named linkedVoucher"
```

---

## Test Case 3: Navigate to Reconciliation

### Steps
1. After import success, click "Go to Reconciliation" button
2. Observe tab switch

### Expected Results
✅ Modal closes
✅ Automatically switches to Reconciliation tab
✅ Transactions appear in reconciliation list
✅ Data is fresh (just imported)
✅ Import tab clears (no longer shows imported data)

---

## Test Case 4: Manual Tab Switching

### Steps
1. Click on "Statement Import" tab
2. Verify import tab shows empty state
3. Click on "Reconciliation" tab
4. Verify reconciliation tab shows transactions

### Expected Results
✅ Tabs switch smoothly
✅ No page reload
✅ No loading flicker (using v-show)
✅ Data persists in each tab
✅ Active tab is visually highlighted

---

## Test Case 5: Reconciliation Operations

### Steps
1. On Reconciliation tab
2. Select one or more imported transactions
3. Click "Post Selected" button
4. Confirm posting

### Expected Results
✅ Transactions status updates to "Posted"
✅ No linkedVoucher errors
✅ Transaction list refreshes
✅ Summary stats update

---

## Test Case 6: Backward Compatibility - Old Routes

### Steps
1. Manually navigate to `/bank-import` in browser URL
2. Press Enter
3. Observe redirection
4. Manually navigate to `/bank-reconciliation`
5. Press Enter
6. Observe redirection

### Expected Results
✅ `/bank-import` redirects to `/banking`
✅ Import tab is active
✅ `/bank-reconciliation` redirects to `/banking?tab=reconciliation`
✅ Reconciliation tab is active
✅ No 404 errors
✅ URL updates in browser

---

## Test Case 7: Sidebar Navigation

### Steps
1. Click "Banking" → "Statement Import" in sidebar
2. Verify Import tab opens
3. Click "Banking" → "Reconciliation" in sidebar
4. Verify Reconciliation tab opens

### Expected Results
✅ Sidebar items work correctly
✅ Correct tab opens for each menu item
✅ No page reload between clicks
✅ Visual feedback in sidebar

---

## Test Case 8: Auto-Refresh on Tab Switch

### Steps
1. Import a statement (if not already done)
2. Switch to another application/window
3. Manually add a transaction via another method (if possible)
4. Return to Banking page
5. Click Reconciliation tab

### Expected Results
✅ Reconciliation data refreshes automatically
✅ New transactions appear
✅ No manual refresh needed

---

## Test Case 9: Query Parameter Support

### Steps
1. Manually type `/banking?tab=reconciliation` in URL
2. Press Enter
3. Manually type `/banking?tab=import` (or no param)
4. Press Enter

### Expected Results
✅ `?tab=reconciliation` opens Reconciliation tab
✅ No param or `?tab=import` opens Import tab
✅ Query param is respected on page load

---

## Test Case 10: Browser Back/Forward

### Steps
1. Start on Import tab
2. Switch to Reconciliation tab
3. Click browser back button
4. Click browser forward button

### Expected Results
✅ Back button behavior is consistent
✅ Forward button behavior is consistent
✅ Tab state may or may not change (depends on routing implementation)
✅ No errors or crashes

---

## Test Case 11: Error Handling

### Steps
1. Try to import an invalid file (non-CSV/Excel)
2. Try to import an empty file
3. Try to import with wrong format

### Expected Results
✅ Appropriate error messages shown
✅ No database errors
✅ No linkedVoucher errors
✅ User can retry
✅ Application remains stable

---

## Test Case 12: Multiple Imports

### Steps
1. Import first statement file
2. Go to Reconciliation tab
3. Return to Import tab
4. Import another statement file
5. Check Reconciliation tab

### Expected Results
✅ Multiple imports work
✅ No duplicate detection issues
✅ All transactions appear in reconciliation
✅ No errors

---

## Console Error Check

Throughout all tests, monitor browser console for:

### ❌ Should NOT See:
- `SqliteError: ... linkedVoucher`
- `no such column: linkedVoucher`
- `undefined is not a function` (in Banking components)
- Vue warnings about missing refs
- TypeScript errors

### ✅ Should See:
- Normal Vite/Vue debug messages
- Import success messages
- Transaction count messages

---

## Performance Check

### Metrics to Observe:
- Tab switching: < 100ms (should feel instant)
- Import file loading: Depends on file size
- Reconciliation data load: < 500ms for normal datasets
- No memory leaks on repeated tab switches

---

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

---

## Mobile/Responsive Check

1. Open in mobile viewport (F12 → Device toolbar)
2. Test tab switching on small screen
3. Verify layout doesn't break
4. Tabs should be scrollable or stacked

---

## Accessibility Check

### Keyboard Navigation
1. Tab through the interface
2. Use arrow keys on tab bar
3. Press Enter to switch tabs

### Expected Results
✅ All interactive elements are keyboard accessible
✅ Tab order is logical
✅ Focus indicators are visible
✅ Screen reader friendly (if using screen reader)

---

## Summary Checklist

**Core Functionality**
- [ ] Import works without linkedVoucher errors
- [ ] Reconciliation shows data correctly
- [ ] Tab switching is smooth
- [ ] Auto-refresh works

**Navigation**
- [ ] Sidebar menu items work
- [ ] Backward compatible routes redirect
- [ ] Query parameters work
- [ ] Browser back/forward work

**Data Integrity**
- [ ] No duplicate imports
- [ ] No data loss
- [ ] Transaction statuses update correctly
- [ ] No SQL errors in console

**User Experience**
- [ ] UI is intuitive
- [ ] Loading states are clear
- [ ] Error messages are helpful
- [ ] Workflow is seamless

---

## Sign-off

**Tester Name:** _________________
**Date:** _________________
**Result:** ☐ PASS ☐ FAIL ☐ NEEDS REVIEW

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Quick Verification Commands

```bash
# Run automated tests
./test-banking-tabs.sh

# Check for errors in code
npx vue-tsc --noEmit

# Check for TODO/FIXME comments
grep -r "TODO\|FIXME" src/pages/Bank*.vue

# Verify schema integrity
cat schemas/app/BankTransaction.json | grep linkedVoucher
# Should return nothing

# Check git diff
git diff schemas/app/BankTransaction.json
```

---

**Status:** Ready for User Acceptance Testing (UAT)
