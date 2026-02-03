import { createHash, createVerify } from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';

export interface LicensePayload {
  product: string;
  licenseType: string;
  issuedTo: string;
  deviceId: string;
  issuedAt: string;
  expiresAt: string;
  gracePeriodDays: number;
}

export interface LicenseFile {
  payload: LicensePayload;
  signature: string;
}

export enum LicenseStatus {
  ACTIVE = 'ACTIVE',
  GRACE_PERIOD = 'GRACE_PERIOD',
  EXPIRED = 'EXPIRED',
  INVALID = 'INVALID',
  NOT_FOUND = 'NOT_FOUND',
  TRIAL = 'TRIAL',
}

export interface LicenseValidationResult {
  status: LicenseStatus;
  reason?: string;
  daysLeft?: number;
  expiryDate?: Date;
  issuedTo?: string;
  gracePeriodEnd?: Date;
}

export class LicenseManager {
  private publicKey: string;
  private licenseFilePath: string;
  private lastSeenFilePath: string;

  constructor() {
    this.publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApo9rHpoGBkBPnq5UgCQX
pU1djrXuNKethCAp1Ce20c4pjEjZ2FTMYOKn3DOKdrBLGs7z31z7sBpZg/48XYPY
lg/Qw5qjrgdC7VC9dXoQvKMB3eltluDNgX10WFb3ZCpPnpe0NsckrdwwSZL4d7d/
62a/qUYGUfxzVy+Ne8cOgatgoVV7GckbL81a4PajuF6a0VZc0iS6aEYuVHRHClFz
5qUHVB6a6XpSX3sMUyDQL+xp5VyvkgRYO3LmNauQcmlqharmSfiUkhW0AevdiRA+
pTtsJMkgy17m8fObrjiJ6sQ/4r/NXLxTUidbhpKQ5yBRnuW6Adm/v7oxOiJqDZhC
kQIDAQAB
-----END PUBLIC KEY-----`;

    this.licenseFilePath = path.join(app.getPath('userData'), 'license.key');
    this.lastSeenFilePath = path.join(app.getPath('userData'), '.last_seen');
  }

  async getDeviceFingerprint(): Promise<string> {
    try {
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      
      // Get the first non-internal MAC address
      let macAddress = '';
      for (const name of Object.keys(networkInterfaces)) {
        for (const iface of networkInterfaces[name]!) {
          if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
            macAddress = iface.mac;
            break;
          }
        }
        if (macAddress) break;
      }

      // Get machine info
      const machineInfo = [
        os.platform(),
        os.arch(),
        os.hostname(),
        macAddress,
        process.env.USER || process.env.USERNAME || 'unknown',
        'VERSOLL_BOOKS_SALT_V1'
      ].join('|');

      const hash = createHash('sha256').update(machineInfo).digest('hex');
      return hash.substring(0, 16).toUpperCase();
    } catch (error) {
      // Fallback: generate a random but consistent ID based on available info
      const fallbackInfo = [
        process.platform,
        process.arch,
        Date.now().toString(),
        'VERSOLL_BOOKS_SALT_V1'
      ].join('|');
      
      const hash = createHash('sha256').update(fallbackInfo).digest('hex');
      return hash.substring(0, 16).toUpperCase();
    }
  }

  async getLastSeenTimestamp(): Promise<Date | null> {
    try {
      if (await fs.pathExists(this.lastSeenFilePath)) {
        const content = await fs.readFile(this.lastSeenFilePath, 'utf-8');
        const timestamp = parseInt(content, 10);
        if (!isNaN(timestamp)) {
          return new Date(timestamp);
        }
      }
    } catch (error) {
      console.error('Error reading last seen timestamp:', error);
    }
    return null;
  }

  async updateLastSeenTimestamp(): Promise<void> {
    try {
      const timestamp = Date.now();
      await fs.writeFile(this.lastSeenFilePath, timestamp.toString(), 'utf-8');
    } catch (error) {
      console.error('Error updating last seen timestamp:', error);
    }
  }

  async checkClockTampering(): Promise<boolean> {
    const lastSeen = await this.getLastSeenTimestamp();
    if (!lastSeen) {
      return false;
    }

    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // If current time is more than 24 hours before last seen, clock was turned back
    return diffHours < -24;
  }

  async getLicenseFile(): Promise<LicenseFile | null> {
    try {
      if (await fs.pathExists(this.licenseFilePath)) {
        const content = await fs.readFile(this.licenseFilePath, 'utf-8');
        return JSON.parse(content) as LicenseFile;
      }
    } catch (error) {
      console.error('Error reading license file:', error);
    }
    return null;
  }

  async validateLicense(): Promise<LicenseValidationResult> {
    const licenseFile = await this.getLicenseFile();

    if (!licenseFile) {
      return { status: LicenseStatus.NOT_FOUND, reason: 'No license file found' };
    }

    try {
      const { payload, signature } = licenseFile;

      // 1. Verify Signature
      const verify = createVerify('SHA256');
      verify.update(JSON.stringify(payload));
      verify.end();

      const isValidSignature = verify.verify(this.publicKey, signature, 'base64');
      if (!isValidSignature) {
        return { status: LicenseStatus.INVALID, reason: 'Invalid license signature' };
      }

      // 2. Verify Device Binding
      const currentDeviceId = await this.getDeviceFingerprint();
      if (payload.deviceId !== currentDeviceId) {
        return { status: LicenseStatus.INVALID, reason: 'License not valid for this device' };
      }

      // 3. Check Clock Tampering
      const isClockTampered = await this.checkClockTampering();
      if (isClockTampered) {
        return { status: LicenseStatus.INVALID, reason: 'System clock tampering detected' };
      }

      // 4. Verify Expiry
      const now = new Date();
      const expiry = new Date(payload.expiresAt);
      const gracePeriodEnd = new Date(expiry);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + payload.gracePeriodDays);

      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilGraceEnd = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (now > gracePeriodEnd) {
        return {
          status: LicenseStatus.EXPIRED,
          reason: 'License expired (including grace period)',
          expiryDate: expiry,
          issuedTo: payload.issuedTo,
        };
      }

      if (now > expiry) {
        return {
          status: LicenseStatus.GRACE_PERIOD,
          reason: 'License expired - grace period active',
          daysLeft: daysUntilGraceEnd,
          expiryDate: expiry,
          issuedTo: payload.issuedTo,
          gracePeriodEnd,
        };
      }

      return {
        status: LicenseStatus.ACTIVE,
        daysLeft: daysUntilExpiry,
        expiryDate: expiry,
        issuedTo: payload.issuedTo,
      };

    } catch (error) {
      console.error('License validation error:', error);
      return { status: LicenseStatus.INVALID, reason: 'Corrupt license file' };
    }
  }

  async importLicenseFile(filePath: string): Promise<{ success: boolean; message: string }> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const licenseData = JSON.parse(content) as LicenseFile;

      // Validate structure
      if (!licenseData.payload || !licenseData.signature) {
        return { success: false, message: 'Invalid license file format' };
      }

      const requiredFields = ['product', 'licenseType', 'issuedTo', 'deviceId', 'issuedAt', 'expiresAt', 'gracePeriodDays'];
      for (const field of requiredFields) {
        if (!(field in licenseData.payload)) {
          return { success: false, message: `Missing required field: ${field}` };
        }
      }

      // Verify device match (optional, can warn instead)
      const currentDeviceId = await this.getDeviceFingerprint();
      if (licenseData.payload.deviceId !== currentDeviceId) {
        return { 
          success: false, 
          message: `License is for a different device. Your Device ID: ${currentDeviceId}, License Device ID: ${licenseData.payload.deviceId}` 
        };
      }

      // Copy license file
      await fs.copy(filePath, this.licenseFilePath);

      return { success: true, message: 'License imported successfully' };
    } catch (error) {
      console.error('Error importing license:', error);
      return { success: false, message: `Failed to import license: ${(error as Error).message}` };
    }
  }

  async deleteLicenseFile(): Promise<void> {
    try {
      if (await fs.pathExists(this.licenseFilePath)) {
        await fs.unlink(this.licenseFilePath);
      }
    } catch (error) {
      console.error('Error deleting license file:', error);
    }
  }

  async cleanup(): Promise<void> {
    await this.updateLastSeenTimestamp();
  }
}
