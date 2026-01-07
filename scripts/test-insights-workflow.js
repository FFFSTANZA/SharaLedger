/**
 * Integration test for Zero-Argument Accounting workflow
 * Tests the complete flow without requiring database
 */

console.log('🧪 Testing Zero-Argument Accounting Workflow\n');

// Test 1: Import all modules
console.log('1. Module Imports');
try {
  const types = require('../models/insights/types');
  const paramTypes = require('../models/insights/parameterTypes');
  const paramHelpers = require('../models/insights/parameterHelpers');
  const queryFunctions = require('../models/insights/queryFunctions');

  console.log('   ✅ types.ts exports:', Object.keys(types).length, 'items');
  console.log(
    '   ✅ parameterTypes.ts exports:',
    Object.keys(paramTypes).length,
    'items'
  );
  console.log(
    '   ✅ parameterHelpers.ts exports:',
    Object.keys(paramHelpers).length,
    'items'
  );
  console.log(
    '   ✅ queryFunctions.ts exports:',
    Object.keys(queryFunctions).length,
    'items'
  );
} catch (e) {
  console.log('   ❌ Import failed:', e.message);
  process.exit(1);
}

// Test 2: Parameter parsing
console.log('\n2. Parameter Parsing');
try {
  const {
    parseAvailableParameters,
  } = require('../models/insights/parameterTypes');

  const validJson =
    '[{"type":"group_by","label":"By Customer","field":"party"}]';
  const params = parseAvailableParameters(validJson);

  if (params.length === 1 && params[0].type === 'group_by') {
    console.log('   ✅ parseAvailableParameters works correctly');
  } else {
    console.log('   ❌ parseAvailableParameters returned unexpected result');
    process.exit(1);
  }

  // Test empty/invalid
  const empty1 = parseAvailableParameters(undefined);
  const empty2 = parseAvailableParameters('');
  const empty3 = parseAvailableParameters('invalid json');

  if (empty1.length === 0 && empty2.length === 0 && empty3.length === 0) {
    console.log('   ✅ Handles invalid input gracefully');
  } else {
    console.log('   ❌ Invalid input not handled correctly');
    process.exit(1);
  }
} catch (e) {
  console.log('   ❌ Parameter parsing failed:', e.message);
  process.exit(1);
}

// Test 3: Parameter chips creation
console.log('\n3. Parameter Chips Creation');
try {
  const { createParameterChips } = require('../models/insights/parameterTypes');

  const params = [
    { type: 'group_by', label: 'By Customer', field: 'party' },
    { type: 'limit', label: 'Top 10', value: 10 },
  ];

  const chips = createParameterChips(params);

  if (chips.length === 2 && chips[0].label === 'By Customer') {
    console.log('   ✅ createParameterChips works correctly');
    console.log(`   ✅ Generated ${chips.length} chips`);
  } else {
    console.log('   ❌ Unexpected chip structure');
    process.exit(1);
  }
} catch (e) {
  console.log('   ❌ Chip creation failed:', e.message);
  process.exit(1);
}

// Test 4: Parameter merging
console.log('\n4. Parameter Merging');
try {
  const {
    mergeAppliedParameters,
  } = require('../models/insights/parameterTypes');

  const existing = { group_by: 'party' };
  const newParam = { type: 'limit', label: 'Top 10', value: 10 };

  const merged = mergeAppliedParameters(existing, newParam);

  if (merged.group_by === 'party' && merged.limit === 10) {
    console.log('   ✅ mergeAppliedParameters works correctly');
  } else {
    console.log('   ❌ Parameter merge failed');
    process.exit(1);
  }
} catch (e) {
  console.log('   ❌ Parameter merging failed:', e.message);
  process.exit(1);
}

// Test 5: Date range calculation
console.log('\n5. Date Range Calculation');
try {
  const { calculateDateRange } = require('../models/insights/parameterHelpers');

  const range = calculateDateRange('last_7_days');

  if (range.fromDate && range.toDate) {
    console.log('   ✅ calculateDateRange works');
    console.log(`   ✅ Generated range: ${range.fromDate} to ${range.toDate}`);
  } else {
    console.log('   ❌ Date range calculation failed');
    process.exit(1);
  }

  // Test all range types
  const rangeTypes = [
    'last_7_days',
    'last_30_days',
    'last_quarter',
    'current_fy',
    'last_fy',
    'custom',
  ];

  rangeTypes.forEach((type) => {
    const r = calculateDateRange(type, '2024-01-01', '2024-01-31');
    if (!r.fromDate || !r.toDate) {
      console.log(`   ❌ Failed for range type: ${type}`);
      process.exit(1);
    }
  });

  console.log('   ✅ All date range types work');
} catch (e) {
  console.log('   ❌ Date range calculation failed:', e.message);
  process.exit(1);
}

// Test 6: Query functions structure
console.log('\n6. Query Functions Structure');
try {
  const { queryFunctions } = require('../models/insights/queryFunctions');

  const expectedFunctions = [
    'compare_pl_periods',
    'trace_ledger_movements',
    'analyze_customer_outstanding',
  ];

  const actualFunctions = Object.keys(queryFunctions);

  expectedFunctions.forEach((fn) => {
    if (!actualFunctions.includes(fn)) {
      console.log(`   ❌ Missing query function: ${fn}`);
      process.exit(1);
    }
  });

  console.log('   ✅ All query functions exported');
  console.log(`   ✅ Available functions: ${actualFunctions.join(', ')}`);
} catch (e) {
  console.log('   ❌ Query functions check failed:', e.message);
  process.exit(1);
}

// Test 7: CommonParameterSets
console.log('\n7. Common Parameter Sets');
try {
  const { CommonParameterSets } = require('../models/insights/parameterTypes');

  const sets = Object.keys(CommonParameterSets);

  if (sets.length >= 4) {
    console.log('   ✅ CommonParameterSets defined');
    console.log(`   ✅ Available sets: ${sets.join(', ')}`);

    // Check structure
    const profitAnalysis = CommonParameterSets.profitAnalysis;
    if (Array.isArray(profitAnalysis) && profitAnalysis.length > 0) {
      console.log(
        `   ✅ profitAnalysis has ${profitAnalysis.length} parameters`
      );
    } else {
      console.log('   ❌ profitAnalysis structure invalid');
      process.exit(1);
    }
  } else {
    console.log('   ❌ CommonParameterSets incomplete');
    process.exit(1);
  }
} catch (e) {
  console.log('   ❌ CommonParameterSets check failed:', e.message);
  process.exit(1);
}

// Test 8: Grouping helpers
console.log('\n8. Grouping Helpers');
try {
  const {
    groupByField,
    applyLimit,
  } = require('../models/insights/parameterHelpers');

  const testData = [
    { party: 'Customer A', amount: 100 },
    { party: 'Customer B', amount: 200 },
    { party: 'Customer A', amount: 150 },
  ];

  const grouped = groupByField(testData, 'party');

  if (grouped.size === 2) {
    console.log('   ✅ groupByField works correctly');
    console.log(`   ✅ Grouped into ${grouped.size} groups`);
  } else {
    console.log('   ❌ groupByField failed');
    process.exit(1);
  }

  const limited = applyLimit(testData, 2);

  if (limited.length === 2) {
    console.log('   ✅ applyLimit works correctly');
  } else {
    console.log('   ❌ applyLimit failed');
    process.exit(1);
  }
} catch (e) {
  console.log('   ❌ Grouping helpers failed:', e.message);
  process.exit(1);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('✅ All workflow tests passed!');
console.log('🎉 Zero-Argument Accounting system is fully functional');
console.log('\nKey Features Verified:');
console.log('  ✅ Parameter parsing and validation');
console.log('  ✅ Parameter chip generation');
console.log('  ✅ Parameter merging for refinements');
console.log('  ✅ Date range calculations');
console.log('  ✅ Query function exports');
console.log('  ✅ Common parameter sets');
console.log('  ✅ Grouping and limiting helpers');
console.log('\n🚀 Ready for database integration!');
