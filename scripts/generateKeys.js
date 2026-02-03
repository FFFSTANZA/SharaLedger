#!/usr/bin/env node

/**
 * Generate RSA Key Pair for License System
 *
 * This script generates a new RSA key pair for license signing.
 * Keep the private key secure!
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateKeyPair() {
  console.log('🔐 Generating RSA-2048 key pair...\n');

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { privateKey, publicKey };
}

function saveKeys(privateKey, publicKey) {
  const keysDir = path.join(__dirname, '..', 'keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir);
  }

  const privateKeyPath = path.join(keysDir, 'private_key.pem');
  const publicKeyPath = path.join(keysDir, 'public_key.pem');

  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);

  console.log('✅ Private key saved to: ' + privateKeyPath);
  console.log('✅ Public key saved to: ' + publicKeyPath + '\n');

  return { privateKeyPath, publicKeyPath };
}

function displayKeyInfo(privateKey, publicKey) {
  console.log('KEY INFORMATION');
  console.log('='.repeat(60));

  // Get key info
  const privateKeyObj = crypto.createPrivateKey(privateKey);
  const publicKeyObj = crypto.createPublicKey(publicKey);

  console.log('Private Key Format:', privateKeyObj.asymmetricKeyType);
  console.log('Public Key Format:', publicKeyObj.asymmetricKeyType);
  console.log('Key Modulus Length:', privateKeyObj.asymmetricKeyDetails?.modulusLength);
  console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
  console.log('   • Keep private key SECURE and NEVER commit to git');
  console.log('   • The public key is embedded in the application');
  console.log('   • Generate new keys if private key is compromised');
  console.log('   • Backup private key in encrypted storage');
}

function updateApplicationCode(publicKey, privateKey) {
  console.log('\n📝 Updating application code...\n');

  const licenseManagerPath = path.join(__dirname, '..', 'main', 'licenseManager.ts');
  const licenseManagerContent = fs.readFileSync(licenseManagerPath, 'utf8');

  // Simple string replacement for public key
  const publicKeyStart = 'this.publicKey = `';
  const publicKeyEnd = '`;';

  const startIndex = licenseManagerContent.indexOf(publicKeyStart);
  const endIndex = licenseManagerContent.indexOf(publicKeyEnd, startIndex);

  if (startIndex !== -1 && endIndex !== -1) {
    const updatedContent =
      licenseManagerContent.substring(0, startIndex) +
      publicKeyStart +
      publicKey.trim() +
      publicKeyEnd +
      licenseManagerContent.substring(endIndex + publicKeyEnd.length);

    fs.writeFileSync(licenseManagerPath, updatedContent);
    console.log('✅ Updated: main/licenseManager.ts');
  } else {
    console.log('⚠️  Could not find publicKey in licenseManager.ts');
  }

  const generatorScriptPath = path.join(__dirname, '..', 'scripts', 'generateLicense.js');
  const generatorScriptContent = fs.readFileSync(generatorScriptPath, 'utf8');

  // Simple string replacement for private key
  const privateKeyStart = 'const PRIVATE_KEY = `';
  const privateKeyEnd = '`;';

  const startIndex2 = generatorScriptContent.indexOf(privateKeyStart);
  const endIndex2 = generatorScriptContent.indexOf(privateKeyEnd, startIndex2);

  if (startIndex2 !== -1 && endIndex2 !== -1) {
    const updatedContent2 =
      generatorScriptContent.substring(0, startIndex2) +
      privateKeyStart +
      privateKey.trim() +
      privateKeyEnd +
      generatorScriptContent.substring(endIndex2 + privateKeyEnd.length);

    fs.writeFileSync(generatorScriptPath, updatedContent2);
    console.log('✅ Updated: scripts/generateLicense.js');
  } else {
    console.log('⚠️  Could not find PRIVATE_KEY in generateLicense.js');
  }
}

function main() {
  console.log('RSA KEY PAIR GENERATOR');
  console.log('='.repeat(60) + '\n');

  const { privateKey, publicKey } = generateKeyPair();

  // Save keys
  saveKeys(privateKey, publicKey);

  // Display info
  displayKeyInfo(privateKey, publicKey);

  // Update application code
  updateApplicationCode(publicKey, privateKey);

  console.log('\n✅ Key generation complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Review the generated keys in the keys/ directory');
  console.log('   2. Commit the updated application code');
  console.log('   3. NEVER commit the keys directory to version control');
  console.log('   4. Store private key securely (password manager, encrypted USB, etc.)');
}

if (require.main === module) {
  main();
}

module.exports = { generateKeyPair };
