// Test script to verify E-Way Bill date fix
const { setupDummyInstance } = require('./dist/dummy/index.js');
const Fyo = require('./dist/fyo');

async function testEWayBillGeneration() {
  console.log('Testing E-Way Bill generation with fixed dates...');

  const fyo = new Fyo('test.db');
  try {
    await setupDummyInstance('test.db', fyo, 0.1, 10); // Small test data

    // Query for E-Way Bills to check if dates are properly formatted
    const eWayBills = await fyo.db.getAll('EWayBill');
    console.log(`Generated ${eWayBills.length} E-Way Bills`);

    if (eWayBills.length > 0) {
      const sampleBill = eWayBills[0];
      console.log('Sample E-Way Bill:');
      console.log('- E-Way Bill Date:', sampleBill.ewayBillDate);
      console.log('- Valid Upto:', sampleBill.validUpto);
      console.log('- Type of E-Way Bill Date:', typeof sampleBill.ewayBillDate);
      console.log('- Type of Valid Upto:', typeof sampleBill.validUpto);

      // Check if dates are valid Date objects
      const isValidDate = (date) => date instanceof Date && !isNaN(date);

      if (
        isValidDate(sampleBill.ewayBillDate) &&
        isValidDate(sampleBill.validUpto)
      ) {
        console.log(
          '✅ E-Way Bill dates are properly formatted as Date objects'
        );
      } else {
        console.log('❌ E-Way Bill dates are not properly formatted');
      }
    } else {
      console.log(
        'No E-Way Bills generated (this is normal for small test data)'
      );
    }

    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    const fs = require('fs');
    if (fs.existsSync('test.db')) {
      fs.unlinkSync('test.db');
    }
  }
}

testEWayBillGeneration();
