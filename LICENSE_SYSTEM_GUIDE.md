# Device-Bound Time-Based License System

Complete implementation of a secure, offline-capable licensing system for Versoll Books.

## Architecture Overview

The license system consists of three main components:

1. **License Manager** (Backend): Validates licenses, manages device fingerprints
2. **License UI** (Frontend): User interface for license management
3. **License Generator** (Admin Tool): Creates signed license files

### Security Features

- **Asymmetric Cryptography**: RSA-2048 bit signatures prevent tampering
- **Device Binding**: Licenses are locked to specific machines
- **Clock Tampering Detection**: Prevents license extension via system time manipulation
- **Offline Validation**: No internet connection required for license checks
- **Grace Period**: 15-day grace period after expiry with read-only mode

## Components

### 1. Backend (Main Process)

#### File: `main/licenseManager.ts`

Core license management logic:

```typescript
class LicenseManager {
  // Get unique device fingerprint
  async getDeviceFingerprint(): Promise<string>
  
  // Validate loaded license
  async validateLicense(): Promise<LicenseValidationResult>
  
  // Import new license file
  async importLicenseFile(filePath: string): Promise<{success, message}>
  
  // Remove current license
  async deleteLicenseFile(): Promise<void>
  
  // Track last seen timestamp (anti-clock-tampering)
  async updateLastSeenTimestamp(): Promise<void>
}
```

**Status Types:**
- `ACTIVE`: License valid and within date range
- `GRACE_PERIOD`: License expired but within grace period
- `EXPIRED`: License expired beyond grace period
- `INVALID`: Signature verification failed or device mismatch
- `NOT_FOUND`: No license file present
- `TRIAL`: Trial mode (not implemented yet)

#### File: `main/registerIpcMainActionListeners.ts`

IPC handlers for license operations:

```typescript
IPC_ACTIONS.LICENSE_GET_DEVICE_ID    // Get machine ID for license generation
IPC_ACTIONS.LICENSE_VALIDATE         // Check license status
IPC_ACTIONS.LICENSE_IMPORT           // Import license file
IPC_ACTIONS.LICENSE_DELETE           // Remove license
```

### 2. Frontend (Renderer Process)

#### File: `src/pages/License/License.vue`

Complete license management interface with:

- **Status Display**: Visual indicators of license status with color coding
- **Device ID Display**: Shows machine ID for license requests
- **License Details**: Shows issued to, expiry date, days remaining
- **Import Function**: File picker to load license files
- **Refresh Function**: Re-validate current license
- **Remove Function**: Delete current license (with confirmation)

**Status Colors:**
- Green (`#10b981`): Active
- Amber (`#f59e0b`): Grace Period
- Red (`#ef4444`): Expired/Invalid
- Gray (`#6b7280`): Not Found
- Blue (`#3b82f6`): Trial

#### File: `src/router.ts`

Added license route:
```typescript
{
  path: '/license',
  name: 'License',
  component: License,
}
```

#### File: `src/utils/sidebarConfig.ts`

Added License menu item under Setup section.

### 3. Database Schema

#### File: `schemas/app/License.json`

License tracking schema:

```json
{
  "name": "License",
  "label": "License",
  "isSingle": true,
  "fields": [
    "deviceId": "Device ID (read-only)",
    "licenseStatus": "Current status (read-only)",
    "licenseType": "Type of license (read-only)",
    "issuedTo": "Customer name (read-only)",
    "expiryDate": "Expiration date (read-only)",
    "daysLeft": "Days remaining (read-only)",
    "gracePeriodEnd": "Grace period end date (read-only)"
  ]
}
```

#### File: `models/baseModels/License/License.ts`

License model with utility methods:

```typescript
class License extends Doc {
  async validateLicense(): Promise<LicenseStatus>
  async refreshLicenseStatus(): Promise<void>
  isReadOnly(): boolean
  isActive(): boolean
  isGracePeriod(): boolean
  getStatusMessage(): string
  getStatusColor(): string
}
```

### 4. Admin Tool

#### File: `scripts/generateLicense.js`

License generation script for creating signed license files.

**Usage:**
```bash
node scripts/generateLicense.js <customerName> <deviceId> [durationMonths]
```

**Examples:**
```bash
# Generate 12-month license
node scripts/generateLicense.js "ABC Traders" "A1B2C3D4E5F6G7H8"

# Generate 24-month license
node scripts/generateLicense.js "XYZ Corp" "A1B2C3D4E5F6G7H8" 24
```

**Output:**
- Creates `.key` file containing:
  - `payload`: License details
  - `signature`: RSA signature of payload

## License File Format

```json
{
  "payload": {
    "product": "Versoll Books",
    "licenseType": "YEARLY",
    "issuedTo": "ABC Traders",
    "deviceId": "A1B2C3D4E5F6G7H8",
    "issuedAt": "2025-01-01T00:00:00.000Z",
    "expiresAt": "2026-01-01T00:00:00.000Z",
    "gracePeriodDays": 15
  },
  "signature": "base64_encoded_rsa_signature"
}
```

## Device Fingerprinting

The device ID is generated from:

1. **Operating System**: Platform (Windows, macOS, Linux)
2. **Architecture**: CPU architecture (x64, arm64)
3. **Hostname**: Machine hostname
4. **MAC Address**: First non-internal network interface MAC
5. **Username**: Current system user
6. **Salt**: Application-specific salt for security

These values are combined, hashed with SHA-256, and shortened to 16 characters.

## Clock Tampering Prevention

**How it works:**

1. On app close, save current timestamp to `userData/.last_seen`
2. On app startup, read saved timestamp
3. If `current_time < last_seen - 24 hours`, flag as tampering
4. Tampering detection forces read-only mode

**File Location:**
- Windows: `%APPDATA%/Versoll Books/.last_seen`
- macOS: `~/Library/Application Support/Versoll Books/.last_seen`
- Linux: `~/.config/Versoll Books/.last_seen`

## License File Location

- **Development**: `<project>/.userData/license.key`
- **Production**: Platform-specific user data directory

## Workflow

### For End Users

1. **Install App**: Download and install Versoll Books
2. **Get Device ID**: Open Settings → License
3. **Contact Support**: Send Device ID to support
4. **Receive License**: Get `.key` file via email
5. **Import License**: Use "Import License" button
6. **Activate**: App validates and activates license

### For Support/Admin

1. **Receive Request**: Get customer name and Device ID
2. **Generate License**: Run license generation script
3. **Send File**: Email `.key` file to customer
4. **Track Expiry**: Monitor license renewals

### Renewal Process

1. **Warning**: App shows warning 30 days before expiry
2. **Contact**: Customer contacts support for renewal
3. **Generate**: Admin creates new license with new expiry date
4. **Import**: Customer imports new license file
5. **Activate**: License updated and extended

## Read-Only Mode

When license expires (including grace period):

**Disabled Features:**
- Save buttons
- Create New buttons
- Edit functionality
- Delete functionality

**Enabled Features:**
- View all data
- Print documents
- Export to PDF
- Backup database
- View reports

**UI Indicators:**
- Red banner: "License Expired. Read-Only Mode."
- Status shows as EXPIRED
- All write operations blocked

## Grace Period

- **Duration**: 15 days (configurable)
- **Behavior**: Full functionality during grace period
- **Warning**: User notified of upcoming expiry
- **After Grace**: Read-only mode activated

## Security Considerations

### Key Management

**Private Key:**
- Location: Keep offline, secure storage
- Access: Only license generation script
- Backup: Secure encrypted backup
- Rotation: Generate new keys annually

**Public Key:**
- Location: Embedded in application code
- Distribution: Included in app builds
- Update: Requires app update to change

### Protection Against Tampering

1. **Signature Verification**: RSA-2048 prevents file modification
2. **Device Binding**: Prevents license sharing
3. **Clock Check**: Prevents time manipulation
4. **Secure Storage**: License file in user data directory

### Known Limitations

- Hardware changes (e.g., new network card) can change device ID
- Virtual machines may have unstable device IDs
- System clock manipulation within 24-hour window not detected

## Development

### Testing License Generation

```bash
# Get your device ID from the app
# Then generate a test license
node scripts/generateLicense.js "Test User" "YOUR_DEVICE_ID" 1
```

### Testing License Validation

1. Start the app
2. Navigate to Settings → License
3. Check license status display
4. Test import functionality
5. Test delete functionality

### Testing Read-Only Mode

1. Set system date beyond expiry + grace period
2. Restart app
3. Verify read-only mode is active
4. Reset system date

## Troubleshooting

### License Shows as Invalid

**Possible Causes:**
- License file corrupted
- Device ID mismatch
- Signature verification failed

**Solutions:**
- Regenerate license with correct Device ID
- Contact support for new license
- Check license file integrity

### Clock Tampering Detected

**Cause:** System clock was turned back

**Solution:** 
- Reset system clock to correct time
- Wait until clock passes last seen timestamp
- Contact support if issue persists

### Device ID Changed

**Possible Causes:**
- New network adapter
- OS reinstallation
- Hardware changes

**Solution:**
- Get new Device ID from app
- Request license regeneration from support
- Import new license file

## Future Enhancements

Potential improvements:

1. **Trial Mode**: Time-limited trial without license
2. **Floating Licenses**: Multiple devices per license
3. **Feature Tiers**: Different license levels
4. **Cloud Activation**: Online activation with server validation
5. **License Transfer**: Formal process to move license between devices
6. **Usage Analytics**: Track feature usage (with consent)
7. **Offline Activation**: Generate activation codes offline

## Compliance

This license system is designed to:

- **Protect Intellectual Property**: Prevent unauthorized use
- **User-Friendly**: No internet required, simple activation
- **Fair Usage**: Device-bound prevents license sharing
- **Transparent**: Clear status indicators and expiry dates
- **Data Preservation**: Read-only mode protects user data

## Support

For license-related issues:

- **Email**: support@versoll.com
- **Include**: Device ID, error message, screenshot
- **Response Time**: Usually within 24 business hours

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Compatible With**: Versoll Books v0.36.0+
