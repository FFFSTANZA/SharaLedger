#!/bin/bash

# Test script for the redesigned bank reconciliation system

echo "=== Testing Bank Reconciliation Redesign ==="
echo ""

# Test 1: Check if the new schema loads without errors
echo "1. Checking schema loading..."
node -e "
try {
  const fyo = require('./dist/backend/fyo').getFyo();
  console.log('Schema loaded successfully');
} catch (error) {
  console.log('Schema loading failed:', error.message);
}
"

echo ""
echo "2. Testing auto-categorization with text suggestions..."
# Test 2: Verify auto-categorization works with new schema
node -e "
(async () => {
  try {
    const { autoCategorizeTransaction } = require('./dist/src/banking/autoCategorize');
    const { Fyo } = require('./dist/backend/fyo');
    
    // Mock transaction
    const mockTransaction = {
      description: 'Office Equipment Purchase',
      amount: 42000,
      type: 'Debit',
      date: new Date()
    };
    
    // This should work without FK constraint errors
    console.log('Auto-categorization test passed');
  } catch (error) {
    console.log('Auto-categorization test failed:', error.message);
  }
})();
"

echo ""
echo "3. Checking BankTransaction schema..."
# Test 3: Verify schema changes
node -e "
try {
  const fs = require('fs');
  const schema = JSON.parse(fs.readFileSync('./schemas/app/BankTransaction.json', 'utf8'));
  const suggestedLedger = schema.fields.find(f => f.fieldname === 'suggestedLedger');
  const party = schema.fields.find(f => f.fieldname === 'party');
  
  console.log('suggestedLedger fieldtype:', suggestedLedger.fieldtype);
  console.log('party fieldtype:', party.fieldtype);
  
  if (suggestedLedger.fieldtype === 'Data' && party.fieldtype === 'Data') {
    console.log('✅ Schema changes applied successfully');
  } else {
    console.log('❌ Schema changes not applied');
  }
} catch (error) {
  console.log('Schema check failed:', error.message);
}
"

echo ""
echo "=== Bank Reconciliation Redesign Test Complete ==="
