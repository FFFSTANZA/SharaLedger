import { Doc } from 'fyo/model/doc';
import { FiltersMap, HiddenMap } from 'fyo/model/types';
import { ipc } from 'src/renderer';

export interface LicenseStatus {
  status: string;
  reason?: string;
  daysLeft?: number;
  expiryDate?: Date;
  issuedTo?: string;
  gracePeriodEnd?: Date;
}

export class License extends Doc {
  deviceId?: string;
  licenseStatus?: string;
  licenseType?: string;
  issuedTo?: string;
  expiryDate?: Date;
  daysLeft?: number;
  gracePeriodEnd?: Date;

  static filters: FiltersMap = {};
  static createFilters: FiltersMap = {};

  hidden: HiddenMap = {};

  async validateLicense(): Promise<LicenseStatus> {
    try {
      const result = await ipc.invoke('LICENSE_VALIDATE');
      return result as LicenseStatus;
    } catch (error) {
      console.error('License validation error:', error);
      return {
        status: 'ERROR',
        reason: 'Failed to validate license',
      };
    }
  }

  async refreshLicenseStatus(): Promise<void> {
    const validation = await this.validateLicense();
    this.licenseStatus = validation.status;
    this.issuedTo = validation.issuedTo;
    this.expiryDate = validation.expiryDate;
    this.daysLeft = validation.daysLeft;
    this.gracePeriodEnd = validation.gracePeriodEnd;

    // Get device ID
    try {
      this.deviceId = await ipc.invoke('LICENSE_GET_DEVICE_ID');
    } catch (error) {
      console.error('Error getting device ID:', error);
    }

    // Sync to database
    await this.sync();
  }

  isReadOnly(): boolean {
    return this.licenseStatus === 'EXPIRED' || this.licenseStatus === 'INVALID';
  }

  isActive(): boolean {
    return this.licenseStatus === 'ACTIVE';
  }

  isGracePeriod(): boolean {
    return this.licenseStatus === 'GRACE_PERIOD';
  }

  getStatusMessage(): string {
    switch (this.licenseStatus) {
      case 'ACTIVE':
        return `License Active - ${this.daysLeft ?? 0} days remaining`;
      case 'GRACE_PERIOD':
        return `License Expired - Grace period ends on ${this.gracePeriodEnd?.toLocaleDateString() ?? 'N/A'}`;
      case 'EXPIRED':
        return 'License Expired - Read-Only Mode';
      case 'INVALID':
        return `Invalid License: ${this.fyo.singles.License?.licenseStatus || 'Unknown error'}`;
      case 'NOT_FOUND':
        return 'No License Found - Please contact support';
      case 'TRIAL':
        return 'Trial Mode - Limited features available';
      default:
        return 'Unknown License Status';
    }
  }

  getStatusColor(): string {
    switch (this.licenseStatus) {
      case 'ACTIVE':
        return '#10b981'; // Green
      case 'GRACE_PERIOD':
        return '#f59e0b'; // Amber
      case 'EXPIRED':
        return '#ef4444'; // Red
      case 'INVALID':
        return '#ef4444'; // Red
      case 'NOT_FOUND':
        return '#6b7280'; // Gray
      case 'TRIAL':
        return '#3b82f6'; // Blue
      default:
        return '#6b7280'; // Gray
    }
  }
}
