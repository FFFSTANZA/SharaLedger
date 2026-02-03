<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
    <div class="p-6 border-b dark:border-gray-800 bg-white dark:bg-gray-800">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
        {{ t`License Management` }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        {{ t`Manage your Versoll Books license` }}
      </p>
    </div>

    <div class="flex-1 overflow-auto p-6">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Status Card -->
        <div
          class="rounded-lg border-2 p-6"
          :style="{
            borderColor: statusColor,
            backgroundColor: `${statusColor}10`,
          }"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ t`License Status` }}
              </div>
              <div class="mt-2 flex items-center gap-2">
                <div
                  class="h-3 w-3 rounded-full"
                  :style="{ backgroundColor: statusColor }"
                ></div>
                <span class="text-xl font-bold" :style="{ color: statusColor }">
                  {{ statusMessage }}
                </span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ t`Device ID` }}
              </div>
              <div class="mt-2 font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                {{ deviceId || 'Loading...' }}
              </div>
            </div>
          </div>

          <!-- License Details -->
          <div v-if="licenseInfo" class="mt-6 grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ t`Issued To` }}
              </div>
              <div class="mt-1 font-medium text-gray-900 dark:text-white">
                {{ licenseInfo.issuedTo || 'N/A' }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ t`License Type` }}
              </div>
              <div class="mt-1 font-medium text-gray-900 dark:text-white">
                {{ licenseInfo.licenseType || 'N/A' }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ t`Expiry Date` }}
              </div>
              <div class="mt-1 font-medium text-gray-900 dark:text-white">
                {{ formatDate(licenseInfo.expiryDate) }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ t`Days Remaining` }}
              </div>
              <div class="mt-1 font-medium text-gray-900 dark:text-white">
                {{ licenseInfo.daysLeft ?? 0 }}
              </div>
            </div>
          </div>

          <!-- Grace Period Warning -->
          <div
            v-if="licenseInfo?.gracePeriodEnd && licenseInfo.daysLeft !== undefined && licenseInfo.daysLeft < 0"
            class="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3"
          >
            <div class="flex items-start gap-2">
              <span class="text-amber-600 dark:text-amber-400">⚠️</span>
              <div class="flex-1">
                <div class="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {{ t`Grace Period Active` }}
                </div>
                <div class="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  {{
                    t`Your license has expired but you can still use the app in read-only mode until {0}. Please renew to continue using all features.`,
                    formatDate(licenseInfo.gracePeriodEnd)
                  }}
                </div>
              </div>
            </div>
          </div>

          <!-- Warning for Expiring Soon -->
          <div
            v-if="licenseInfo?.daysLeft !== undefined && licenseInfo.daysLeft > 0 && licenseInfo.daysLeft <= 30"
            class="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3"
          >
            <div class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400">ℹ️</span>
              <div class="flex-1">
                <div class="text-sm font-medium text-blue-800 dark:text-blue-300">
                  {{ t`License Expiring Soon` }}
                </div>
                <div class="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  {{
                    t`Your license will expire in {0} days. Contact support to renew.`,
                    licenseInfo.daysLeft
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ t`Actions` }}
          </h3>
          <div class="flex flex-wrap gap-4">
            <Button
              type="primary"
              @click="importLicense"
              :disabled="isLoading"
            >
              {{ t`Import License` }}
            </Button>
            <Button
              @click="refreshLicense"
              :disabled="isLoading"
            >
              {{ t`Refresh Status` }}
            </Button>
            <Button
              v-if="licenseInfo"
              @click="deleteLicense"
              class="bg-red-600 hover:bg-red-700 text-white"
              :disabled="isLoading"
            >
              {{ t`Remove License` }}
            </Button>
          </div>
        </div>

        <!-- Info Cards -->
        <div class="grid md:grid-cols-2 gap-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {{ t`How to Get a License` }}
            </h3>
            <ol class="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>{{ t`Copy your Device ID from above` }}</li>
              <li>{{ t`Contact Versoll Books support` }}</li>
              <li>{{ t`Share your Device ID` }}</li>
              <li>{{ t`Receive license file via email` }}</li>
              <li>{{ t`Import the license file here` }}</li>
            </ol>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {{ t`License Types` }}
            </h3>
            <div class="space-y-3 text-sm">
              <div class="flex items-center gap-3">
                <div class="h-2 w-2 rounded-full bg-green-500"></div>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ t`Yearly License` }}
                  </div>
                  <div class="text-gray-600 dark:text-gray-400">
                    {{ t`Full access for 1 year` }}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="h-2 w-2 rounded-full bg-blue-500"></div>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ t`Trial License` }}
                  </div>
                  <div class="text-gray-600 dark:text-gray-400">
                    {{ t`30-day free trial` }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Read-Only Mode Info -->
        <div
          v-if="licenseInfo && ['EXPIRED', 'INVALID'].includes(licenseInfo.status)"
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
        >
          <div class="flex items-start gap-3">
            <span class="text-2xl">🔒</span>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
                {{ t`Read-Only Mode Active` }}
              </h3>
              <p class="text-sm text-red-700 dark:text-red-400">
                {{
                  t`Your license has expired. You can still view and export your data, but cannot create, edit, or delete records. Please renew your license to continue using all features.`
                }}
              </p>
              <div class="mt-4">
                <a
                  href="mailto:support@versoll.com"
                  class="text-sm font-medium text-red-700 dark:text-red-400 hover:underline"
                >
                  {{ t`Contact Support for Renewal` }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ipc } from 'src/renderer';
import { showDialog } from 'src/utils/interactive';
import { formatDate } from 'src/utils/filters';
import { defineComponent } from 'vue';
import Button from 'src/components/Button.vue';

interface LicenseInfo {
  status: string;
  reason?: string;
  daysLeft?: number;
  expiryDate?: Date;
  issuedTo?: string;
  gracePeriodEnd?: Date;
  licenseType?: string;
}

export default defineComponent({
  components: { Button },
  data() {
    return {
      deviceId: '',
      licenseInfo: null as LicenseInfo | null,
      isLoading: false,
    };
  },
  computed: {
    statusMessage(): string {
      if (!this.licenseInfo) {
        return this.t`Loading...`;
      }

      switch (this.licenseInfo.status) {
        case 'ACTIVE':
          return this.t`Active`;
        case 'GRACE_PERIOD':
          return this.t`Grace Period`;
        case 'EXPIRED':
          return this.t`Expired`;
        case 'INVALID':
          return this.t`Invalid`;
        case 'NOT_FOUND':
          return this.t`No License`;
        case 'TRIAL':
          return this.t`Trial`;
        default:
          return this.licenseInfo.status;
      }
    },
    statusColor(): string {
      if (!this.licenseInfo) {
        return '#6b7280';
      }

      switch (this.licenseInfo.status) {
        case 'ACTIVE':
          return '#10b981';
        case 'GRACE_PERIOD':
          return '#f59e0b';
        case 'EXPIRED':
          return '#ef4444';
        case 'INVALID':
          return '#ef4444';
        case 'NOT_FOUND':
          return '#6b7280';
        case 'TRIAL':
          return '#3b82f6';
        default:
          return '#6b7280';
      }
    },
  },
  async mounted() {
    await this.loadLicenseInfo();
  },
  methods: {
    formatDate(date: Date | string | undefined): string {
      if (!date) {
        return 'N/A';
      }
      return formatDate(date);
    },
    async loadLicenseInfo(): Promise<void> {
      this.isLoading = true;
      try {
        const [deviceIdResult, licenseResult] = await Promise.all([
          ipc.invoke('LICENSE_GET_DEVICE_ID'),
          ipc.invoke('LICENSE_VALIDATE'),
        ]);

        this.deviceId = deviceIdResult.data;
        this.licenseInfo = licenseResult.data as LicenseInfo;
      } catch (error) {
        console.error('Error loading license info:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async refreshLicense(): Promise<void> {
      await this.loadLicenseInfo();
      await showDialog({
        title: this.t`License Refreshed`,
        detail: this.t`License status has been updated.`,
        type: 'info',
      });
    },
    async importLicense(): Promise<void> {
      try {
        const result = await ipc.selectFile({
          title: this.t`Select License File`,
          filters: [
            { name: this.t`License Files`, extensions: ['key', 'json'] },
            { name: this.t`All Files`, extensions: ['*'] },
          ],
        });

        if (result.canceled || !result.filePath) {
          return;
        }

        const importResult = await ipc.invoke('LICENSE_IMPORT', result.filePath);

        if (importResult.success) {
          await showDialog({
            title: this.t`License Imported Successfully`,
            detail: this.t`Your license has been activated.`,
            type: 'info',
          });
          await this.loadLicenseInfo();
        } else {
          await showDialog({
            title: this.t`Import Failed`,
            detail: importResult.message || this.t`Unknown error occurred`,
            type: 'error',
          });
        }
      } catch (error) {
        await showDialog({
          title: this.t`Import Error`,
          detail: (error as Error).message || this.t`Unknown error occurred`,
          type: 'error',
        });
      }
    },
    async deleteLicense(): Promise<void> {
      const result = await showDialog({
        title: this.t`Remove License?`,
        detail: this.t`Are you sure you want to remove the license? The app will revert to trial mode.`,
        type: 'warning',
        buttons: [
          {
            label: this.t`Remove`,
            isPrimary: true,
          },
          {
            label: this.t`Cancel`,
            isEscape: true,
          },
        ],
      });

      if (result === 1) {
        return;
      }

      try {
        const deleteResult = await ipc.invoke('LICENSE_DELETE');
        if (deleteResult.success) {
          await showDialog({
            title: this.t`License Removed`,
            detail: this.t`Your license has been removed. The app is now in trial mode.`,
            type: 'info',
          });
          await this.loadLicenseInfo();
        }
      } catch (error) {
        await showDialog({
          title: this.t`Error`,
          detail: (error as Error).message || this.t`Unknown error occurred`,
          type: 'error',
        });
      }
    },
  },
});
</script>
