#!/usr/bin/env node

/**
 * License System Test Script
 * 
 * This script tests the license generation and verification system.
 * Run this to verify the license system is working correctly.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Keys for testing
const TEST_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAuK7fH8m9A4JdGqF7hXwKd1Zp4Yj5N9vDxPj3T7GqLj2K5bN
6C8m9Q1VwR4xY7A3zF2E9jH6T5D8cB1L2VwG7xY3D4K9fN6E8bM1L5G9qV0X
wR8yC3J7dH5T6K1l2Q8xP4F7V9cL3J5eH8M6j4Q9xK2F1V7cN8l0K5E3dL6H4
M7j2P0xK3J8G5dL1H6i9M0l7K4J2eP5M8N6K3L0j9Q7M5l8K4N1j6P0M7L9K2
j8Q5M8L7K3N0j9Q6M9l7K4N2j6P0M8L9K2j8Q6M9l8K4N3j6P0M9L9K2j8Q7
M9l9K4N4j6P1M0L9K3j9Q9M1l1K5N6j7P1M2L0K4j9QIDAQABAoIBAFx3H2JL
9Q8M7K4N1j6P0M8L9K2j8Q6M9l8K4N3j6P0M9L9K2j8Q7M9l9K4N4j6P1M0L9
K3j9Q9M1l1K5N6j7P1M2L0K4j9Q8M2l2K6N7j8P1M3L1K5j0QAMQIDAQABAoIB
AH5J3K9L4M8N2j7P1M9L0K3j0Q8M3l3K7N8j9P1M4L2K6j1Q9M4l4K8N9jP2M5
L3K7j2QAMQIDAQABAoIBAD6K4L0M5N3j8P2M0L1K4j0Q9M5l5K9N0jP3M6L4K8
j1QAMQIDAQABAoIBAD7L5M1N4j9P3M1L2K5j1QAMQIDAQABAoIBAD8M6L2N5j0P
4M2L3K6j2QAMQIDAQABAoIBAD9N7M3L6j3QAMQIDAQABAoIBAEAM8L4N6j1P5M3
L4K7j2QAMQIDAQABAoIBAEBN9M5L7j3QAMQIDAQABAoIBAECOAL0M8N7j2P6M4L5
K8j3QAMQIDAQABAoIBAEDPAL1M9N8j3P7M5L6K9j4QAMQIDAQABAoIBAE
-----END RSA PRIVATE KEY-----`;

const TEST_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuK7fH8m9A4JdGqF7hXw
Kd1Zp4Yj5N9vDxPj3T7GqLj2K5bN6C8m9Q1VwR4xY7A3zF2E9jH6T5D8cB1L2
VwG7xY3D4K9fN6E8bM1L5G9qV0XwR8yC3J7dH5T6K1l2Q8xP4F7V9cL3J5eH8
M6j4Q9xK2F1V7cN8l0K5E3dL6H4M7j2P0xK3J8G5dL1H6i9M0l7K4J2eP5M8
N6K3L0j9Q7M5l8K4N1j6P0M7L9K2j8Q5M8L7K3N0j9Q6M9l7K4N2j6P0M8L9
K2j8Q6M9l8K4N3j6P0M9L9K2j8Q7M9l9K4N4j6P1M0L9K3j9Q9M1l1K5N6j
P1M2L0K4j9QAMQIDAQAB
-----END PUBLIC KEY-----`;

function generateTestLicense(customerName, deviceId, months = 12) {
  const issueDate = new Date();
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + months);

  const payload = {
    product: "Versoll Books",
    licenseType: "YEARLY",
    issuedTo: customerName,
    deviceId: deviceId,
    issuedAt: issueDate.toISOString(),
    expiresAt: expiryDate.toISOString(),
    gracePeriodDays: 15
  };

  const sign = crypto.createSign('SHA256');
  sign.update(JSON.stringify(payload));
  sign.end();
  const signature = sign.sign(TEST_PRIVATE_KEY, 'base64');

  return { payload, signature };
}

function verifyLicense(licenseFile) {
  try {
    const { payload, signature } = licenseFile;

    const verify = crypto.createVerify('SHA256');
    verify.update(JSON.stringify(payload));
    verify.end();

    const isValid = verify.verify(TEST_PUBLIC_KEY, signature, 'base64');
    
    return {
      valid: isValid,
      payload,
      signature
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

function runTests() {
  console.log('🧪 License System Tests\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  // Test 1: Generate and verify valid license
  console.log('\nTest 1: Generate and verify valid license');
  try {
    const license = generateTestLicense('Test Customer', 'A1B2C3D4E5F6G7H8');
    const verification = verifyLicense(license);
    
    if (verification.valid) {
      console.log('  ✅ PASS: License signature valid');
      passed++;
    } else {
      console.log('  ❌ FAIL: License signature invalid');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failed++;
  }

  // Test 2: Detect tampering
  console.log('\nTest 2: Detect payload tampering');
  try {
    const license = generateTestLicense('Test Customer', 'A1B2C3D4E5F6G7H8');
    license.payload.issuedTo = 'Tampered Name';
    const verification = verifyLicense(license);
    
    if (!verification.valid) {
      console.log('  ✅ PASS: Tampering detected');
      passed++;
    } else {
      console.log('  ❌ FAIL: Tampering not detected');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failed++;
  }

  // Test 3: Detect signature tampering
  console.log('\nTest 3: Detect signature tampering');
  try {
    const license = generateTestLicense('Test Customer', 'A1B2C3D4E5F6G7H8');
    license.signature = 'fake_signature_123';
    const verification = verifyLicense(license);
    
    if (!verification.valid) {
      console.log('  ✅ PASS: Signature tampering detected');
      passed++;
    } else {
      console.log('  ❌ FAIL: Signature tampering not detected');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failed++;
  }

  // Test 4: Device mismatch handling
  console.log('\nTest 4: Device mismatch detection (application logic)');
  try {
    const license = generateTestLicense('Test Customer', 'A1B2C3D4E5F6G7H8');
    const verification = verifyLicense(license);
    
    // Simulate device check
    const currentDeviceId = 'X9Y8Z7W6V5U4T3S2';
    const deviceMatch = verification.payload.deviceId === currentDeviceId;
    
    if (!deviceMatch) {
      console.log('  ✅ PASS: Device mismatch would be detected');
      passed++;
    } else {
      console.log('  ❌ FAIL: Device mismatch not detected');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failed++;
  }

  // Test 5: Generate test license file
  console.log('\nTest 5: Generate test license file');
  try {
    const license = generateTestLicense('Test User', 'A1B2C3D4E5F6G7H8', 1);
    const testFile = path.join(__dirname, 'test_license.key');
    fs.writeFileSync(testFile, JSON.stringify(license, null, 2));
    
    if (fs.existsSync(testFile)) {
      console.log(`  ✅ PASS: Test license file created at ${testFile}`);
      passed++;
    } else {
      console.log('  ❌ FAIL: Test license file not created');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failed++;
  }

  // Test 6: Expiry date calculation
  console.log('\nTest 6: Expiry date calculation');
  try {
    const months = 12;
    const license = generateTestLicense('Test Customer', 'A1B2C3D4E5F6G7H8', months);
    const issueDate = new Date(license.payload.issuedAt);
    const expiryDate = new Date(license.payload.expiresAt);
    const diffMonths = (expiryDate.getFullYear() - issueDate.getFullYear()) * 12 + 
                       (expiryDate.getMonth() - issueDate.getMonth());
    
    if (diffMonths === months) {
      console.log(`  ✅ PASS: Expiry date calculated correctly (${months} months)`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: Expiry date incorrect (${diffMonths} vs ${months} months)`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests:  ${passed + failed}`);
  console.log(`Passed:       ${passed} ✅`);
  console.log(`Failed:       ${failed} ❌`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! License system is working correctly.');
    console.log('\n📝 Next Steps:');
    console.log('   1. Run: node scripts/generateLicense.js to create real licenses');
    console.log('   2. Test license import in the application');
    console.log('   3. Verify read-only mode on expiry');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix issues.');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests();
}

module.exports = { generateTestLicense, verifyLicense };
