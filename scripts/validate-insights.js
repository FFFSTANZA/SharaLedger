/**
 * Validation script for Zero-Argument Accounting system
 */

const fixtures = require('../fixtures/insightQueryTemplatesWithParameters.json');

console.log('🔍 Validating Zero-Argument Accounting System\n');

// 1. Check fixtures
console.log('1. Fixtures Validation');
console.log(`   ✅ Loaded ${fixtures.length} templates`);

const queryFunctions = [
  'compare_pl_periods',
  'trace_ledger_movements',
  'analyze_customer_outstanding',
];

let errors = 0;

// 2. Validate query functions
console.log('\n2. Query Functions Validation');
fixtures.forEach((t, i) => {
  if (!queryFunctions.includes(t.queryFunction)) {
    console.log(
      `   ❌ Template ${i + 1}: Unknown function "${t.queryFunction}"`
    );
    errors++;
  }
});

if (errors === 0) {
  console.log('   ✅ All query functions are implemented');
}

// 3. Validate required fields
console.log('\n3. Template Fields Validation');
const requiredFields = [
  'name',
  'templateId',
  'contextType',
  'contextField',
  'questionText',
  'queryFunction',
  'answerTemplate',
  'trustLevel',
];

fixtures.forEach((t, i) => {
  const missing = requiredFields.filter((f) => !t[f]);
  if (missing.length > 0) {
    console.log(
      `   ❌ Template ${i + 1}: Missing fields: ${missing.join(', ')}`
    );
    errors++;
  }
});

if (errors === 0) {
  console.log('   ✅ All templates have required fields');
}

// 4. Validate availableParameters JSON
console.log('\n4. Parameters Validation');
fixtures.forEach((t, i) => {
  if (t.availableParameters) {
    try {
      const params = JSON.parse(t.availableParameters);
      if (!Array.isArray(params)) {
        console.log(
          `   ❌ Template ${i + 1}: availableParameters must be array`
        );
        errors++;
      } else {
        params.forEach((p, pi) => {
          if (!p.type || !p.label) {
            console.log(
              `   ❌ Template ${i + 1}, param ${pi + 1}: Missing type or label`
            );
            errors++;
          }
        });
      }
    } catch (e) {
      console.log(
        `   ❌ Template ${i + 1}: Invalid JSON in availableParameters`
      );
      errors++;
    }
  }
});

if (errors === 0) {
  console.log('   ✅ All parameter definitions are valid');
}

// 5. Validate context types
console.log('\n5. Context Types Validation');
const validContexts = [
  'Report',
  'Ledger',
  'Customer',
  'Vendor',
  'Item',
  'Account',
];

fixtures.forEach((t, i) => {
  if (!validContexts.includes(t.contextType)) {
    console.log(
      `   ❌ Template ${i + 1}: Invalid contextType "${t.contextType}"`
    );
    errors++;
  }
});

if (errors === 0) {
  console.log('   ✅ All context types are valid');
}

// 6. Summary
console.log('\n' + '='.repeat(50));
if (errors === 0) {
  console.log('✅ All validations passed!');
  console.log('🚀 Zero-Argument Accounting system is ready');
  process.exit(0);
} else {
  console.log(`❌ Found ${errors} error(s)`);
  console.log('⚠️  Please fix the issues above');
  process.exit(1);
}
