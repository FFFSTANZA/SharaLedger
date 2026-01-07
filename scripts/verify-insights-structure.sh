#!/bin/bash

echo "🔍 Verifying Zero-Argument Accounting Structure"
echo ""

errors=0

# 1. Check all required files exist
echo "1. File Structure Check"
files=(
  "schemas/app/InsightQueryTemplate.json"
  "schemas/app/InsightNarrative.json"
  "models/baseModels/InsightQueryTemplate/InsightQueryTemplate.ts"
  "models/baseModels/InsightNarrative/InsightNarrative.ts"
  "models/insights/types.ts"
  "models/insights/parameterTypes.ts"
  "models/insights/parameterHelpers.ts"
  "models/insights/queryFunctions.ts"
  "models/insights/insightService.ts"
  "models/insights/index.ts"
  "fixtures/insightQueryTemplatesWithParameters.json"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file - MISSING"
    ((errors++))
  fi
done

# 2. Check exports in index.ts
echo ""
echo "2. Module Exports Check"
if grep -q "export \* from './types'" models/insights/index.ts; then
  echo "   ✅ types exported"
else
  echo "   ❌ types not exported"
  ((errors++))
fi

if grep -q "export \* from './queryFunctions'" models/insights/index.ts; then
  echo "   ✅ queryFunctions exported"
else
  echo "   ❌ queryFunctions not exported"
  ((errors++))
fi

if grep -q "export \* from './insightService'" models/insights/index.ts; then
  echo "   ✅ insightService exported"
else
  echo "   ❌ insightService not exported"
  ((errors++))
fi

if grep -q "export \* from './parameterTypes'" models/insights/index.ts; then
  echo "   ✅ parameterTypes exported"
else
  echo "   ❌ parameterTypes not exported"
  ((errors++))
fi

if grep -q "export \* from './parameterHelpers'" models/insights/index.ts; then
  echo "   ✅ parameterHelpers exported"
else
  echo "   ❌ parameterHelpers not exported"
  ((errors++))
fi

# 3. Check model registrations
echo ""
echo "3. Model Registration Check"
if grep -q "InsightQueryTemplate" models/index.ts; then
  echo "   ✅ InsightQueryTemplate registered in models/index.ts"
else
  echo "   ❌ InsightQueryTemplate not registered"
  ((errors++))
fi

if grep -q "InsightNarrative" models/index.ts; then
  echo "   ✅ InsightNarrative registered in models/index.ts"
else
  echo "   ❌ InsightNarrative not registered"
  ((errors++))
fi

if grep -q "InsightQueryTemplate = 'InsightQueryTemplate'" models/types.ts; then
  echo "   ✅ InsightQueryTemplate in ModelNameEnum"
else
  echo "   ❌ InsightQueryTemplate not in ModelNameEnum"
  ((errors++))
fi

if grep -q "InsightNarrative = 'InsightNarrative'" models/types.ts; then
  echo "   ✅ InsightNarrative in ModelNameEnum"
else
  echo "   ❌ InsightNarrative not in ModelNameEnum"
  ((errors++))
fi

# 4. Check schema registrations
echo ""
echo "4. Schema Registration Check"
if grep -q "InsightQueryTemplate" schemas/schemas.ts; then
  echo "   ✅ InsightQueryTemplate registered in schemas.ts"
else
  echo "   ❌ InsightQueryTemplate not registered"
  ((errors++))
fi

if grep -q "InsightNarrative" schemas/schemas.ts; then
  echo "   ✅ InsightNarrative registered in schemas.ts"
else
  echo "   ❌ InsightNarrative not registered"
  ((errors++))
fi

# 5. Check query functions
echo ""
echo "5. Query Functions Check"
if grep -q "export async function compare_pl_periods" models/insights/queryFunctions.ts; then
  echo "   ✅ compare_pl_periods defined"
else
  echo "   ❌ compare_pl_periods missing"
  ((errors++))
fi

if grep -q "export async function trace_ledger_movements" models/insights/queryFunctions.ts; then
  echo "   ✅ trace_ledger_movements defined"
else
  echo "   ❌ trace_ledger_movements missing"
  ((errors++))
fi

if grep -q "export async function analyze_customer_outstanding" models/insights/queryFunctions.ts; then
  echo "   ✅ analyze_customer_outstanding defined"
else
  echo "   ❌ analyze_customer_outstanding missing"
  ((errors++))
fi

# 6. Check InsightService methods
echo ""
echo "6. InsightService Methods Check"
methods=(
  "getTemplatesForContext"
  "executeQueryTemplate"
  "generateNarrative"
  "saveNarrative"
  "generateInsight"
  "getAvailableParameters"
  "getParameterChips"
  "refineInsight"
  "getExplorationHistory"
  "reconstructExplorationPath"
)

for method in "${methods[@]}"; do
  if grep -q "$method" models/insights/insightService.ts; then
    echo "   ✅ $method"
  else
    echo "   ❌ $method - MISSING"
    ((errors++))
  fi
done

# Summary
echo ""
echo "=================================================="
if [ $errors -eq 0 ]; then
  echo "✅ All structure checks passed!"
  echo "🚀 Zero-Argument Accounting system structure is complete"
  exit 0
else
  echo "❌ Found $errors error(s)"
  echo "⚠️  Please fix the issues above"
  exit 1
fi
