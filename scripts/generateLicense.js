#!/usr/bin/env node

/**
 * License Generation Tool
 * 
 * This script generates signed license files for Versoll Books.
 * Keep the private key secure and never distribute it.
 * 
 * Usage:
 *   node scripts/generateLicense.js <customerName> <deviceId> [durationMonths]
 *   
 * Examples:
 *   node scripts/generateLicense.js "ABC Traders" "A1B2C3D4E5F6G7H8"
 *   node scripts/generateLicense.js "XYZ Corp" "A1B2C3D4E5F6G7H8" 12
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Private Key - KEEP THIS SECRET
// This key should be stored securely and never committed to version control
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCmj2semgYGQE+e
rlSAJBelTV2Ote40p62EICnUJ7bRzimMSNnYVMxg4qfcM4p2sEsazvPfXPuwGlmD
/jxdg9iWD9DDmqOuB0LtUL11ehC8owHd6W2W4M2BfXRYVvdkKk+el7Q2xySt3DBJ
kvh3t3/rZr+pRgZR/HNXL417xw6Bq2ChVXsZyRsvzVrg9qO4XprRVlzSJLpoRi5U
dEcKUXPmpQdUHprpelJfewxTINAv7GnlXK+SBFg7cuY1q5ByaWqFquZJ+JSSFbQB
692JED6lO2wkySDLXubx85uuOInqxD/iv81cvFNSJ1uGkpDnIFGe5boB2b+/ujE6
ImoNmEKRAgMBAAECggEAFdcRe0JEDvbI2exPDTxuU1EZNvjZItNn177l7TlF6i3n
2crFse2wnPWrgB7MBbMpLfs8FCpboGRcH4grPzHmKQsq2zNASjYOixK+vRRD9JBF
UuVkZtfUaqnaIylIKDy6Evgee95SC3AnbsZUSVJo9iOTdy1E7+Qz9Zc5LKVV3B+4
AnWQz7EZNz09ASUhqmovoV4e5tpgFgUS8dBwBvgpGy3sx1zeYl59kwBvoRRWBA44
5Ox/dtps6MEOmr8Ix7JkjoQRvrF82dgm16CkSogM7zqREGeCKGPCCBQQKlyOg8nq
RgNnsvPDu+6t0+E1UcXuKo/SMNF7rvdUF0PZcu5bTwKBgQDZhVwD4uRmPIPHifpX
XrJlQ9q2CdFz24ggQeGHXPzj1ugqgDK3zp/b/ZaNaYwcLac8GESPVe3HZEhHbZoC
eftv6Zn9ssj2g622mwD7OsLl2ikWW1vloS/zxr/THzsU9eOqIrkJmc2VSI/qg2tn
1B0qiuP9KL4Jh0wDydQ16cmjIwKBgQDEBkFe3kz9RTI+JNwhd1zgj3ERapzbzPMr
6Rgfg55o6EevX+o59x/BbGxKFFhrm4wgDHnAPbM5LZ4x0NKbjDoySi9Buqx+3wZz
tFtjYW6X7Lv3HX3lkP21nNkgFWzvP7oFHzrUymk0C2V9qAoQivRCbPHxBWLGk535
SeDSzscIuwKBgQCoqT8vxD5VB5cmoVX7aPHqkzKC9Bn0O8TRPkQhMXjlMT3TtpOc
8hoB+h9ChxScxMlnT2nZukck1B03RUSlpu/PVtKQZJBulKuda5LXOjjlAMPbEfuv
kcwcuX8DtLObDQ36XfIb/6Xomtr8e+pMF6yF0Cv3oB+6Q64tQdHJ+/zdAQKBgQCj
AlysKoq1dyx/1yEjx2H57+7jv9evRPDXDCCeXFKIBNlP8qASEfpbW/F1bRPWcGSH
Zjh88BIxM0lBPdlVtrfSiDRiIX0+h/KSl2ID88sHFbt9lQ3TsM36j/NTJd4P2tuz
VLQUrjnsKKn+Y5XzCcpzzqsndgYdAja1ToViaMfE7wKBgBVLc5KwadNF0VPGqPa+
x+RVYgXQMDFiOOdihIJyh1s3mw5R3kHWx/dfK37yUvarQH7gqwQv1DWqoJEJ8w8E
19p3PqT0R1BqTkiK+QlcgA2ugx6SH/BFm/26sPPHW6KKkR0WqjH9FDRg4i9JnAL8
3tIRHVVF2M1A0qJrMmYR1Hww
-----END PRIVATE KEY-----`;

function generateLicense(customerName, deviceId, durationMonths = 12) {
  const issueDate = new Date();
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + parseInt(durationMonths));

  const payload = {
    product: "Versoll Books",
    licenseType: "YEARLY",
    issuedTo: customerName,
    deviceId: deviceId,
    issuedAt: issueDate.toISOString(),
    expiresAt: expiryDate.toISOString(),
    gracePeriodDays: 15
  };

  // Create Signature
  const sign = crypto.createSign('SHA256');
  sign.update(JSON.stringify(payload));
  sign.end();
  const signature = sign.sign(PRIVATE_KEY, 'base64');

  return {
    payload,
    signature
  };
}

function saveLicense(license, filename) {
  const licenseData = JSON.stringify(license, null, 2);
  fs.writeFileSync(filename, licenseData, 'utf8');
  console.log(`\n✅ License saved to: ${filename}`);
}

function displayLicenseInfo(license) {
  console.log('\n' + '='.repeat(60));
  console.log('LICENSE DETAILS');
  console.log('='.repeat(60));
  console.log(`Product:          ${license.payload.product}`);
  console.log(`License Type:     ${license.payload.licenseType}`);
  console.log(`Issued To:        ${license.payload.issuedTo}`);
  console.log(`Device ID:        ${license.payload.deviceId}`);
  console.log(`Issued At:        ${new Date(license.payload.issuedAt).toLocaleString()}`);
  console.log(`Expires At:       ${new Date(license.payload.expiresAt).toLocaleString()}`);
  console.log(`Grace Period:     ${license.payload.gracePeriodDays} days`);
  console.log('\n'.repeat(60));
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('❌ Error: Missing required arguments');
    console.log('\nUsage:');
    console.log('  node scripts/generateLicense.js <customerName> <deviceId> [durationMonths]');
    console.log('\nArguments:');
    console.log('  customerName    - Name of the customer/organization');
    console.log('  deviceId         - Device ID (16-character hex code)');
    console.log('  durationMonths   - License duration in months (default: 12)');
    console.log('\nExamples:');
    console.log('  node scripts/generateLicense.js "ABC Traders" "A1B2C3D4E5F6G7H8"');
    console.log('  node scripts/generateLicense.js "XYZ Corp" "A1B2C3D4E5F6G7H8" 24');
    process.exit(1);
  }

  const customerName = args[0];
  const deviceId = args[1];
  const durationMonths = args[2] || 12;

  // Validate deviceId format (should be 16 hex characters)
  if (!/^[A-F0-9]{16}$/i.test(deviceId)) {
    console.log('❌ Error: Invalid Device ID format');
    console.log('   Device ID should be a 16-character hexadecimal string (e.g., A1B2C3D4E5F6G7H8)');
    process.exit(1);
  }

  console.log('\n🔐 Generating License...');
  console.log(`   Customer: ${customerName}`);
  console.log(`   Device ID: ${deviceId}`);
  console.log(`   Duration: ${durationMonths} months`);

  try {
    const license = generateLicense(customerName, deviceId, durationMonths);
    displayLicenseInfo(license);

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
    const filename = `license_${customerName.replace(/\s+/g, '_')}_${timestamp}.key`;
    
    saveLicense(license, filename);
    
    console.log('✅ License generated successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Send the license file to the customer');
    console.log('   2. Ask customer to import it in: Settings → License');
    console.log('   3. Customer can activate their copy of Versoll Books');
    
  } catch (error) {
    console.error('\n❌ Error generating license:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateLicense, saveLicense };
