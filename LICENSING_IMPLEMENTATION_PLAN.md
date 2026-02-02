# Frappy Books Licensing System Design
## Recommended Model: Device-Bound Time-Based License (Hybrid Offline)

This document details the architecture and implementation plan for the "Device-Bound Time-Based License" model. This model is selected for its balance of security, offline capability, and user-friendliness, specifically tailored for the Indian SMB market.

### 1. Executive Summary

-   **Model**: Annual Subscription with Offline License File.
-   **Security**: Asymmetric Cryptography (RSA/Ed25519) + Hardware Fingerprinting.
-   **Enforcement**: Read-Only mode upon expiry (no data lockout).
-   **User Flow**: User installs -> sends Machine ID -> You send License File -> App activates.

---

### 2. Technical Architecture

#### A. Key Components
1.  **Admin Tool (Your Side)**: A secure script/app to generate signed license files.
2.  **Client App (User Side)**:
    -   Generates unique `DEVICE_ID`.
    -   Validates license signature.
    -   Checks expiry and device match.
    -   Enforces UI restrictions (Active vs. Read-Only).

#### B. The License File (`license.key` or `.json`)
This file contains the business logic and is signed to prevent tampering.

```json
{
  "payload": {
    "product": "Frappy Books Pro",
    "licenseType": "YEARLY",
    "issuedTo": "ABC Traders",
    "deviceId": "a1b2c3d4...", 
    "issuedAt": "2024-02-01T00:00:00.000Z",
    "expiresAt": "2025-02-01T00:00:00.000Z",
    "gracePeriodDays": 15
  },
  "signature": "base64_encoded_signature_of_payload_string"
}
```

---

### 3. Implementation Details

#### Step 1: Generate Device Fingerprint (Client Side)

We need a stable ID that doesn't change with updates but prevents copying.
**Recommended Library**: `node-machine-id` (Simple, robust for Electron) or native Node `crypto` + system info.

**Implementation Logic (Concept):**
```typescript
import { machineIdSync } from 'node-machine-id';
import { createHash } from 'crypto';

export function getDeviceFingerprint(): string {
  // 1. Get base machine ID (OS/Hardware based)
  const baseId = machineIdSync({ original: true }); // 'original: true' is more stable
  
  // 2. Hash it to obfuscate the real hardware ID
  const hash = createHash('sha256').update(baseId + 'FRAPPY_SALT').digest('hex');
  
  return hash.substring(0, 16).toUpperCase(); // Friendly 16-char ID
}
```

#### Step 2: License Generation (Admin/Server Side)

You need a private key to sign licenses. The app will have the public key to verify them.

**Setup:**
1.  Generate an RSA Key Pair (2048-bit or 4096-bit).
2.  Embed `public_key.pem` into the Frappy Books source code.
3.  Keep `private_key.pem` **SECURE** on your laptop/server.

**Generator Script (Node.js):**
```javascript
const crypto = require('crypto');
const fs = require('fs');

// Load Private Key
const privateKey = fs.readFileSync('private_key.pem', 'utf8');

function generateLicense(customerName, deviceId, months = 12) {
  const issueDate = new Date();
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + months);

  const payload = {
    product: "Frappy Books",
    issuedTo: customerName,
    deviceId: deviceId,
    issuedAt: issueDate.toISOString(),
    expiresAt: expiryDate.toISOString(),
    gracePeriodDays: 7
  };

  // Create Signature
  const sign = crypto.createSign('SHA256');
  sign.update(JSON.stringify(payload));
  sign.end();
  const signature = sign.sign(privateKey, 'base64');

  return { payload, signature };
}

// Usage:
// const license = generateLicense("ABC Traders", "USER_DEVICE_ID_HERE");
// fs.writeFileSync('license.frappy', JSON.stringify(license));
```

#### Step 3: License Verification (Client App Startup)

When the app starts, it must validate the license file found in the user's data folder.

**Verification Logic:**
```typescript
import { public_key } from './config'; // Embedded in code
import { getDeviceFingerprint } from './utils/device';

export function validateLicense(licenseFileContent: any): LicenseStatus {
  try {
    const { payload, signature } = licenseFileContent;

    // 1. Verify Signature Integrity
    const verify = crypto.createVerify('SHA256');
    verify.update(JSON.stringify(payload));
    verify.end();
    
    if (!verify.verify(public_key, signature, 'base64')) {
      return { status: 'INVALID', reason: 'Signature mismatch' };
    }

    // 2. Verify Device Binding
    const currentDeviceId = getDeviceFingerprint();
    if (payload.deviceId !== currentDeviceId) {
      return { status: 'INVALID', reason: 'Device mismatch' };
    }

    // 3. Verify Expiry
    const now = new Date();
    const expiry = new Date(payload.expiresAt);
    
    // Check Grace Period
    const gracePeriodEnd = new Date(expiry);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + (payload.gracePeriodDays || 0));

    if (now > gracePeriodEnd) {
      return { status: 'EXPIRED', reason: 'License expired' };
    }

    if (now > expiry) {
      return { status: 'GRACE_PERIOD', daysLeft: /* calc diff */ };
    }

    return { status: 'ACTIVE' };

  } catch (e) {
    return { status: 'ERROR', reason: 'Corrupt file' };
  }
}
```

---

### 4. Security & Anti-Tamper Measures

#### A. Clock Tampering Prevention
Users might turn back their system clock to extend the license.
**Solution**: Store the "Last Seen" timestamp securely.

1.  **On App Close/Save**: Write the current timestamp to a hidden file (e.g., encrypted in user data) or local database.
2.  **On App Start**:
    -   Read `last_seen_timestamp`.
    -   If `current_system_time < last_seen_timestamp`: **Flag Tampering**.
    -   Force Read-Only mode until system time > last seen.

#### B. Read-Only Mode Implementation
This is critical for trust. Do not disable the app.
-   **Disable**: "Save", "Update", "Delete", "Create New" buttons.
-   **Enable**: "View", "Print", "Export PDF", "Backup".
-   **UI**: Show a persistent red banner: *"License Expired. Read-Only Mode. Contact Support to Renew."*

---

### 5. Business Operations Workflow

1.  **Sale**: You agree on a price with the client.
2.  **Install**: You (or they) install the trial version.
3.  **Registration**:
    -   App shows a popup: "Machine ID: X1Y2-Z3A4".
    -   User sends this ID to you via WhatsApp/Email.
4.  **Issue**:
    -   You paste ID into your generator tool.
    -   Tool creates `license.frappy`.
    -   You send file back after payment.
5.  **Activation**:
    -   User clicks "Import License" in the app.
    -   App validates and unlocks full features.
6.  **Renewal**:
    -   11 months later, app warns "Expiring in 30 days".
    -   User pays -> You send new file with new expiry date.

---

### 6. Recommended Next Steps

1.  Add `node-machine-id` to dependencies.
2.  Create a `LicenseManager` class in the backend/main process.
3.  Add a `License` table or store in `settings` table to cache status.
4.  Implement the "Import License" UI in Settings.
