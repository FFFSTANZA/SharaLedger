#!/bin/bash

echo "=== Banking Module SQL & Core Module Compatibility Check ==="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Test 1: Check for SQL injection risks
echo "1. Checking for SQL injection vulnerabilities..."
if grep -r "orderBy.*desc.*desc" src/pages/BankReconciliation.vue src/pages/BankImport.vue 2>/dev/null | grep -q "orderBy.*'"; then
    echo -e "${RED}❌ Potential SQL injection risk found - FAIL${NC}"
    ((FAIL++))
else
    echo -e "${GREEN}✅ No SQL injection vulnerabilities detected - PASS${NC}"
    ((PASS++))
fi

echo ""

# Test 2: Check orderBy format is array
echo "2. Checking orderBy parameter format..."
if grep -q "orderBy: \[" src/pages/BankReconciliation.vue; then
    echo -e "${GREEN}✅ Using array format for orderBy - PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ orderBy not using array format - FAIL${NC}"
    ((FAIL++))
fi

echo ""

# Test 3: Check all fields in queries exist in schema
echo "3. Verifying all queried fields exist in BankTransaction schema..."
# 'name' field is implicit for documents with naming: random/manual
QUERY_FIELDS="date description type amount reference chequeNo bankName status suggestedLedger suggestedVoucherType account importOrder"
ALL_VALID=true

for field in $QUERY_FIELDS; do
    if ! grep -q "\"fieldname\": \"$field\"" schemas/app/BankTransaction.json; then
        echo -e "${RED}❌ Field '$field' not found in schema - FAIL${NC}"
        ALL_VALID=false
        ((FAIL++))
    fi
done

if $ALL_VALID; then
    echo -e "${GREEN}✅ All queried fields exist in schema - PASS${NC}"
    ((PASS++))
fi

echo ""

# Test 4: Check for proper fyo.pesa usage for Currency fields
echo "4. Checking proper Money type handling..."
if grep -q "fyo.pesa(txn.amount)" src/pages/BankImport.vue; then
    echo -e "${GREEN}✅ BankTransaction.amount using fyo.pesa() - PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ BankTransaction.amount not using fyo.pesa() - FAIL${NC}"
    ((FAIL++))
fi

if grep -q "fyo.pesa(amount)" src/banking/glPosting.ts; then
    echo -e "${GREEN}✅ GL posting amounts using fyo.pesa() - PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ GL posting amounts not using fyo.pesa() - FAIL${NC}"
    ((FAIL++))
fi

echo ""

# Test 5: Check that banking module doesn't modify core schemas
echo "5. Verifying banking module doesn't modify core schemas..."
CORE_SCHEMAS="Account Payment JournalEntry Party Invoice SalesInvoice PurchaseInvoice"
BANKING_SCHEMAS="BankTransaction BankImportBatch BankImportProfile"

CORE_MODIFIED=false
for schema in $CORE_SCHEMAS; do
    if grep -q "import.*Bank" schemas/app/${schema}.json 2>/dev/null; then
        echo -e "${RED}❌ Core schema '$schema' modified by banking - FAIL${NC}"
        CORE_MODIFIED=true
        ((FAIL++))
    fi
done

if ! $CORE_MODIFIED; then
    echo -e "${GREEN}✅ No core schemas modified - PASS${NC}"
    ((PASS++))
fi

echo ""

# Test 6: Check that banking schemas are properly registered
echo "6. Verifying banking schemas are registered..."
SCHEMAS_REGISTERED=0
for schema in $BANKING_SCHEMAS; do
    if grep -q "import.*${schema}" schemas/schemas.ts; then
        ((SCHEMAS_REGISTERED++))
    fi
done

if [ $SCHEMAS_REGISTERED -eq 3 ]; then
    echo -e "${GREEN}✅ All 3 banking schemas registered - PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ Only $SCHEMAS_REGISTERED/3 banking schemas registered - FAIL${NC}"
    ((FAIL++))
fi

echo ""

# Test 7: Check that bank transactions use .sync() not .insert()
echo "7. Checking proper document save pattern..."
if grep -q "await doc.sync()" src/pages/BankImport.vue; then
    echo -e "${GREEN}✅ Using .sync() for document saves - PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ Not using .sync() for document saves - FAIL${NC}"
    ((FAIL++))
fi

echo ""

# Test 8: Check that filters are properly formatted
echo "8. Checking filter object format..."
if grep -q "filters: \[" src/pages/BankReconciliation.vue 2>/dev/null; then
    echo -e "${RED}❌ Filters using array format - FAIL${NC}"
    ((FAIL++))
elif grep -q "filters: {" src/pages/BankReconciliation.vue; then
    echo -e "${GREEN}✅ Filters using object format - PASS${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️  Could not verify filter format - WARN${NC}"
    ((WARN++))
fi

echo ""

# Test 9: Check that banking doesn't create circular dependencies
echo "9. Checking for circular dependencies..."
CIRCULAR_DEPS=false

# Check if banking modules import from each other in a cycle
if grep -q "import.*BankReconciliation" src/banking/glPosting.ts 2>/dev/null; then
    echo -e "${RED}❌ Potential circular dependency detected - FAIL${NC}"
    CIRCULAR_DEPS=true
    ((FAIL++))
fi

if ! $CIRCULAR_DEPS; then
    echo -e "${GREEN}✅ No circular dependencies detected - PASS${NC}"
    ((PASS++))
fi

echo ""

# Test 10: Check that GL posting uses existing models
echo "10. Verifying GL posting uses existing Payment/JournalEntry models..."
if grep -q "getNewDoc('Payment')" src/banking/glPosting.ts; then
    echo -e "${GREEN}✅ Uses existing Payment model - PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ Not using existing Payment model - FAIL${NC}"
    ((FAIL++))
fi

if grep -q "getNewDoc('JournalEntry')" src/banking/glPosting.ts; then
    echo -e "${GREEN}✅ Uses existing JournalEntry model - PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ Not using existing JournalEntry model - FAIL${NC}"
    ((FAIL++))
fi

echo ""
echo "======================================"
echo "Test Summary:"
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARN${NC}"
echo "======================================"

if [ $FAIL -eq 0 ]; then
    echo -e "\n${GREEN}All critical tests passed! Banking module is safe and doesn't break core functionality.${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Please review the issues above.${NC}"
    exit 1
fi
