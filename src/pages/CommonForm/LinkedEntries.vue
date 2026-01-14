<template>
  <div
    class="w-quick-edit bg-white dark:bg-gray-850 border-l dark:border-gray-800 overflow-y-auto custom-scroll custom-scroll-thumb2"
  >
    <!-- Page Header -->
    <div
      class="flex items-center justify-between px-4 h-row-largest sticky top-0 bg-white dark:bg-gray-850 border-b dark:border-gray-800"
      style="z-index: 1"
    >
      <div class="flex items-center gap-3 flex-1">
        <Button :icon="true" @click="$emit('close')">
          <feather-icon name="x" class="w-4 h-4" />
        </Button>
        <p class="text-xl font-semibold text-gray-600 dark:text-gray-400">
          {{ t`Business Event` }}
        </p>
      </div>
      <!-- View Toggle -->
      <div v-show="!isLoading && !hasError" class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded p-1">
        <button
          @click="viewMode = 'grouped'"
          :class="[
            'px-3 py-1 rounded text-xs font-medium transition-colors',
            viewMode === 'grouped'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          ]"
        >
          <feather-icon name="list" class="w-3 h-3 inline-block mr-1" />
          {{ t`Grouped` }}
        </button>
        <button
          @click="viewMode = 'timeline'"
          :class="[
            'px-3 py-1 rounded text-xs font-medium transition-colors',
            viewMode === 'timeline'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          ]"
        >
          <feather-icon name="clock" class="w-3 h-3 inline-block mr-1" />
          {{ t`Timeline` }}
        </button>
      </div>
    </div>

    <!-- Search & Filters -->
    <div
      v-show="!isLoading && !hasError"
      class="px-4 py-3 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
    >
      <!-- Search Bar -->
      <div class="relative mb-3">
        <feather-icon
          name="search"
          class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t`Search by name, party, or reason...`"
          class="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <feather-icon name="x" class="w-4 h-4" />
        </button>
      </div>

      <!-- Filter Chips -->
      <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Filter options">
        <button
          v-for="filter in availableFilters"
          :key="filter.id"
          @click="toggleFilter(filter.id)"
          :aria-pressed="activeFilters.includes(filter.id)"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1',
            activeFilters.includes(filter.id)
              ? `${filter.bgClass} ${filter.textClass} ${filter.borderClass} ring-${filter.color}-500`
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 ring-gray-400 dark:ring-gray-600'
          ]"
        >
          <feather-icon :name="filter.icon" class="w-3 h-3" />
          <span>{{ filter.label }}</span>
          <span
            v-if="filter.count > 0"
            :class="[
              'ml-1 px-1.5 py-0.5 rounded-full text-[10px]',
              activeFilters.includes(filter.id)
                ? 'bg-white dark:bg-gray-800 text-current'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
            ]"
            :aria-label="`${filter.count} ${filter.label}`"
          >
            {{ filter.count }}
          </span>
        </button>

        <!-- Clear Filters Button -->
        <button
          v-if="searchQuery || activeFilters.length"
          @click="clearFilters"
          class="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
        >
          <feather-icon name="x-circle" class="w-3 h-3" />
          <span>{{ t`Clear` }}</span>
        </button>
      </div>
    </div>

    <!-- Impact Summary -->
    <div
      v-if="showImpactSummary"
      v-show="!isLoading && !hasError"
      class="px-4 py-3 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
    >
      <p class="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2">
        {{ t`Document Impact` }}
      </p>
      <div class="flex flex-wrap gap-2">
        <div
          v-if="impactSummary.totalPayments"
          class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"
        >
          <feather-icon name="check-circle" class="w-3 h-3" />
          <span
            >{{ t`Paid` }}
            {{ fyo.format(impactSummary.totalPayments, 'Currency') }}</span
          >
        </div>
        <div
          v-if="impactSummary.hasReturns"
          class="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400"
        >
          <feather-icon name="corner-up-left" class="w-3 h-3" />
          <span>{{ t`Has Returns` }}</span>
        </div>
        <div
          v-if="impactSummary.itemsTransferred > 0"
          class="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400"
        >
          <feather-icon name="truck" class="w-3 h-3" />
          <span
            >{{ impactSummary.itemsTransferred }} {{ t`items transferred` }}</span
          >
        </div>
      </div>
    </div>

    <!-- Timeline View -->
    <div
      v-if="viewMode === 'timeline' && filteredTimelineEntries.length"
      v-show="!isLoading && !hasError"
      class="w-full overflow-y-auto custom-scroll custom-scroll-thumb2"
    >
      <div class="relative px-4 py-6">
        <!-- Timeline vertical line -->
        <div
          class="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"
        ></div>

        <!-- Timeline entries -->
        <div
          v-for="(entry, index) of filteredTimelineEntries"
          :key="entry.name + entry.schemaName"
          class="relative mb-6 pl-8"
        >
          <!-- Timeline dot -->
          <div
            class="absolute left-6 w-4 h-4 rounded-full border-2 border-white dark:border-gray-850 shadow-sm"
            :class="`bg-${entry.reason.color}-500`"
          ></div>

          <!-- Timeline content -->
          <div
            class="ml-6 p-3 bg-white dark:bg-gray-875 rounded-lg border dark:border-gray-800 cursor-pointer hover:shadow-md transition-shadow"
            @click="routeTo(entry.schemaName, entry.name)"
          >
            <!-- Date header -->
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-500">
                {{ fyo.format(entry.date, 'Date') }}
              </span>
              <span class="text-xs text-gray-400 dark:text-gray-600">
                {{ getSchemaLabel(entry.schemaName) }}
              </span>
            </div>

            <!-- Reason & Icon -->
            <div class="flex items-start gap-2 mb-2">
              <div
                class="flex-shrink-0 mt-0.5"
                :class="`text-${entry.reason.color}-600 dark:text-${entry.reason.color}-400`"
              >
                <feather-icon :name="entry.reason.icon" class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <p
                  class="font-medium text-gray-900 dark:text-gray-100 leading-tight"
                >
                  {{ entry.reason.reason }}
                </p>
                <p
                  v-if="entry.reason.impact"
                  class="text-xs text-gray-600 dark:text-gray-400 mt-0.5"
                >
                  {{ entry.reason.impact }}
                </p>
              </div>
            </div>

            <!-- Document name -->
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {{ entry.name }}
              </span>
              <feather-icon
                name="chevron-right"
                class="w-3 h-3 text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Related Documents (entries without dates) -->
    <div
      v-if="viewMode === 'timeline' && filteredRelatedDocuments.length"
      v-show="!isLoading && !hasError"
      class="w-full border-t dark:border-gray-800"
    >
      <div class="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-800">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-500">
          {{ t`Related Documents` }}
        </p>
      </div>
      <div class="p-4 grid grid-cols-1 gap-2">
        <div
          v-for="doc in filteredRelatedDocuments"
          :key="doc.name + doc.schemaName"
          class="flex items-center gap-3 p-3 bg-white dark:bg-gray-875 rounded-lg border dark:border-gray-800 cursor-pointer hover:shadow-md transition-shadow"
          @click="routeTo(doc.schemaName, doc.name)"
        >
          <!-- Icon -->
          <div
            class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            :class="`bg-${doc.reason.color}-100 dark:bg-${doc.reason.color}-900/30`"
          >
            <feather-icon
              :name="doc.reason.icon"
              :class="`text-${doc.reason.color}-600 dark:text-${doc.reason.color}-400`"
              class="w-5 h-5"
            />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {{ doc.name }}
              </p>
              <span class="text-xs text-gray-400 dark:text-gray-600 flex-shrink-0 ml-2">
                {{ getSchemaLabel(doc.schemaName) }}
              </span>
            </div>
            <p
              v-if="doc.reason.reason"
              class="text-xs text-gray-600 dark:text-gray-400 truncate"
            >
              {{ doc.reason.reason }}
            </p>
          </div>

          <!-- Chevron -->
          <feather-icon name="chevron-right" class="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>
      </div>
    </div>

    <!-- Grouped Entry List -->
    <div
      v-if="viewMode === 'grouped' && filteredSequence.length"
      v-show="!isLoading && !hasError"
      class="w-full overflow-y-auto custom-scroll custom-scroll-thumb2 border-t dark:border-gray-800"
    >
      <div
        v-for="sn of filteredSequence"
        :key="sn"
        class="border-b dark:border-gray-800 p-4 overflow-auto"
      >
        <!-- Header with count and schema label -->
        <div
          class="flex justify-between cursor-pointer"
          :class="entries[sn].collapsed ? '' : 'pb-4'"
          @click="entries[sn].collapsed = !entries[sn].collapsed"
        >
          <h2
            class="text-base text-gray-600 dark:text-gray-400 font-semibold select-none"
          >
            {{ fyo.schemaMap[sn]?.label ?? sn
            }}<span class="font-normal">{{
              ` – ${getFilteredDetails(sn).length}`
            }}</span>
          </h2>
          <feather-icon
            :name="entries[sn].collapsed ? 'chevron-up' : 'chevron-down'"
            class="w-4 h-4 text-gray-600 dark:text-gray-400"
          />
        </div>

        <!-- Entry list -->
        <div
          v-show="!entries[sn].collapsed"
          class="entry-container rounded-md border dark:border-gray-800 overflow-hidden"
        >
          <!-- Entry -->
          <div
            v-for="e of getFilteredDetails(sn)"
            :key="String(e.name) + sn"
            class="p-3 text-sm cursor-pointer border-b last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-875"
            @click="routeTo(sn, String(e.name))"
          >
            <!-- Reason & Icon -->
            <div
              v-if="e.reason"
              class="flex items-start gap-2 mb-2"
            >
              <div
                class="flex-shrink-0 mt-0.5"
                :class="`text-${e.reason.color}-600 dark:text-${e.reason.color}-400`"
              >
                <feather-icon :name="e.reason.icon" class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <p
                  class="font-medium text-gray-900 dark:text-gray-100 leading-tight"
                >
                  {{ e.reason.reason }}
                </p>
                <p
                  v-if="e.reason.impact"
                  class="text-xs text-gray-600 dark:text-gray-400 mt-0.5"
                >
                  {{ e.reason.impact }}
                </p>
              </div>
            </div>

            <div class="flex justify-between items-center">
              <!-- Name -->
              <p class="font-semibold dark:text-gray-25 text-xs">
                {{ e.name }}
              </p>

              <!-- Date -->
              <p v-if="e.date" class="text-xs text-gray-600 dark:text-gray-400">
                {{ fyo.format(e.date, 'Date') }}
              </p>
            </div>
            <div class="flex gap-2 mt-1 pill-container flex-wrap">
              <!-- Credit or Debit (GLE) -->
              <p
                v-if="isPesa(e.credit) && e.credit.isPositive()"
                class="pill"
                :class="colorClass('gray')"
              >
                {{ t`Cr. ${fyo.format(e.credit, 'Currency')}` }}
              </p>
              <p
                v-else-if="isPesa(e.debit) && e.debit.isPositive()"
                class="pill"
                :class="colorClass('gray')"
              >
                {{ t`Dr. ${fyo.format(e.debit, 'Currency')}` }}
              </p>

              <!-- Party or EntryType or Account -->
              <p
                v-if="e.party || e.entryType || e.account"
                class="pill"
                :class="colorClass('gray')"
              >
                {{ e.party || e.entryType || e.account }}
              </p>

              <p v-if="e.item" class="pill" :class="colorClass('gray')">
                {{ e.item }}
              </p>
              <p v-if="e.location" class="pill" :class="colorClass('gray')">
                {{ e.location }}
              </p>

              <!-- Amounts -->
              <p
                v-if="
                  isPesa(e.outstandingAmount) &&
                  e.outstandingAmount.isPositive()
                "
                class="pill no-scrollbar"
                :class="colorClass('orange')"
              >
                {{ t`Unpaid ${fyo.format(e.outstandingAmount, 'Currency')}` }}
              </p>
              <p
                v-else-if="isPesa(e.grandTotal) && e.grandTotal.isPositive()"
                class="pill no-scrollbar"
                :class="colorClass('green')"
              >
                {{ fyo.format(e.grandTotal, 'Currency') }}
              </p>
              <p
                v-else-if="isPesa(e.amount) && e.amount.isPositive()"
                class="pill no-scrollbar"
                :class="colorClass('green')"
              >
                {{ fyo.format(e.amount, 'Currency') }}
              </p>

              <!-- Quantities -->
              <p
                v-if="e.stockNotTransferred"
                class="pill no-scrollbar"
                :class="colorClass('orange')"
              >
                {{
                  t`Pending qty. ${fyo.format(e.stockNotTransferred, 'Float')}`
                }}
              </p>
              <p
                v-else-if="typeof e.quantity === 'number' && e.quantity"
                class="pill no-scrollbar"
                :class="colorClass('gray')"
              >
                {{ t`Qty. ${fyo.format(e.quantity, 'Float')}` }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 dark:border-gray-600"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="hasError" class="p-4 text-center py-12">
      <feather-icon name="alert-circle" class="w-12 h-12 mx-auto mb-3 text-red-400" />
      <p class="font-medium mb-2 text-gray-900 dark:text-gray-100">{{ t`Failed to load business events` }}</p>
      <p class="text-xs text-gray-600 dark:text-gray-400 mb-4">{{ t`Please try again later` }}</p>
      <button
        @click="isLoading = true; hasError = false; setLinkedEntries().finally(() => isLoading = false)"
        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        {{ t`Retry` }}
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="
        (viewMode === 'grouped' && !filteredSequence.length) ||
        (viewMode === 'timeline' && !filteredTimelineEntries.length && !filteredRelatedDocuments.length)
      "
      class="p-4 text-sm text-gray-600 dark:text-gray-400"
    >
      <div v-if="searchQuery || activeFilters.length" class="text-center py-8">
        <feather-icon name="search" class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p class="font-medium mb-2">{{ t`No matching business events` }}</p>
        <p class="text-xs">{{ t`Try adjusting your filters or search query` }}</p>
      </div>
      <div v-else class="text-center py-8">
        <feather-icon name="link" class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p class="font-medium mb-2">{{ t`No business events found` }}</p>
        <p class="text-xs">{{ t`This document has no related entries` }}</p>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { isPesa } from 'fyo/utils';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import { getBgTextColorClass } from 'src/utils/colors';
import { getLinkedEntries } from 'src/utils/doc';
import { shortcutsKey } from 'src/utils/injectionKeys';
import { getFormRoute, routeTo } from 'src/utils/ui';
import {
  getLinkedEntryReason,
  getLinkedEntriesImpactSummary,
  LinkedEntryReason,
  LinkedEntryRelationship,
} from 'src/utils/linkedEntriesReason';
import { PropType, defineComponent, inject } from 'vue';

const COMPONENT_NAME = 'BusinessEvent';

interface EntryDetail extends Record<string, unknown> {
  name: string;
  date?: Date;
  reason?: LinkedEntryReason;
}

interface TimelineEntry extends EntryDetail {
  schemaName: string;
}

export default defineComponent({
  components: { Button },
  props: { doc: { type: Object as PropType<Doc>, required: true } },
  emits: ['close'],
  setup() {
    return { shortcuts: inject(shortcutsKey) };
  },
  data() {
    return {
      entries: {},
      allReasons: [] as LinkedEntryReason[],
      viewMode: 'grouped' as 'grouped' | 'timeline',
      searchQuery: '',
      activeFilters: [] as LinkedEntryRelationship[],
      isLoading: true,
      hasError: false,
    } as {
      entries: Record<
        string,
        { collapsed: boolean; details: EntryDetail[] }
      >;
      allReasons: LinkedEntryReason[];
      viewMode: 'grouped' | 'timeline';
      searchQuery: string;
      activeFilters: LinkedEntryRelationship[];
      isLoading: boolean;
      hasError: boolean;
    };
  },
  computed: {
    sequence(): string[] {
      const seq: string[] = linkSequence.filter(
        (s) => !!this.entries[s]?.details?.length
      );

      for (const s in this.entries) {
        if (seq.includes(s)) {
          continue;
        }
        seq.push(s);
      }

      return seq;
    },
    filteredSequence(): string[] {
      return this.sequence.filter((schemaName) => {
        return this.getFilteredDetails(schemaName).length > 0;
      });
    },
    timelineEntries(): TimelineEntry[] {
      const allEntries: TimelineEntry[] = [];

      // Collect all entries with their schema names
      for (const schemaName in this.entries) {
        const entryGroup = this.entries[schemaName];
        if (!entryGroup?.details) continue;

        for (const detail of entryGroup.details) {
          if (detail.date) {
            allEntries.push({
              ...detail,
              schemaName,
            });
          }
        }
      }

      // Sort by date in descending order (most recent first)
      return allEntries.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
    },
    filteredTimelineEntries(): TimelineEntry[] {
      return this.timelineEntries.filter((entry) => this.passesFilters(entry));
    },
    relatedDocuments(): TimelineEntry[] {
      const allDocs: TimelineEntry[] = [];

      // Collect all entries WITHOUT dates
      for (const schemaName in this.entries) {
        const entryGroup = this.entries[schemaName];
        if (!entryGroup?.details) continue;

        for (const detail of entryGroup.details) {
          if (!detail.date) {
            allDocs.push({
              ...detail,
              schemaName,
            });
          }
        }
      }

      return allDocs;
    },
    filteredRelatedDocuments(): TimelineEntry[] {
      return this.relatedDocuments.filter((doc) => this.passesFilters(doc));
    },
    availableFilters() {
      const filterConfigs = [
        { id: 'payment', label: 'Payments', icon: 'arrow-down-circle', color: 'green' },
        { id: 'return', label: 'Returns', icon: 'corner-up-left', color: 'orange' },
        { id: 'stock_transfer', label: 'Stock', icon: 'truck', color: 'blue' },
        { id: 'journal_entry', label: 'Journal Entries', icon: 'book', color: 'purple' },
        { id: 'ledger_entry', label: 'Ledger Entries', icon: 'layers', color: 'gray' },
        { id: 'reference', label: 'References', icon: 'link', color: 'gray' },
        { id: 'child_table', label: 'Details', icon: 'list', color: 'blue' },
        { id: 'other', label: 'Other', icon: 'more-horizontal', color: 'gray' },
      ] as const;

      return filterConfigs.map((config) => ({
        ...config,
        count: this.getFilterCount(config.id),
        bgClass: `bg-${config.color}-100 dark:bg-${config.color}-900/30`,
        textClass: `text-${config.color}-700 dark:text-${config.color}-300`,
        borderClass: `border-${config.color}-300 dark:border-${config.color}-700`,
      }));
    },
    impactSummary() {
      return getLinkedEntriesImpactSummary(this.allReasons);
    },
    showImpactSummary(): boolean {
      const summary = this.impactSummary;
      return !!(
        summary.totalPayments ||
        summary.hasReturns ||
        summary.itemsTransferred > 0
      );
    },
  },
  async mounted() {
    this.shortcuts?.set(COMPONENT_NAME, ['Escape'], () => this.$emit('close'));
    try {
      await this.setLinkedEntries();
    } catch (error) {
      console.error('Failed to load linked entries:', error);
      this.hasError = true;
    } finally {
      this.isLoading = false;
    }
  },
  unmounted() {
    this.shortcuts?.delete(COMPONENT_NAME);
  },
  methods: {
    isPesa,
    colorClass: getBgTextColorClass,
    async routeTo(schemaName: string, name: string) {
      const route = getFormRoute(schemaName, name);
      await routeTo(route);
    },
    getSchemaLabel(schemaName: string): string {
      return this.fyo.schemaMap[schemaName]?.label || schemaName;
    },
    async setLinkedEntries() {
      const linkedEntries = await getLinkedEntries(this.doc);
      const allReasons: LinkedEntryReason[] = [];

      for (const key in linkedEntries) {
        const collapsed = false;
        const entryNames = linkedEntries[key];
        if (!entryNames.length) {
          continue;
        }

        const fields = linkEntryDisplayFields[key] ?? ['name'];
        const details = await this.fyo.db.getAll(key, {
          fields,
          filters: { name: ['in', entryNames] },
        });

        // Add business reason to each entry
        const detailsWithReasons = await Promise.all(
          details.map(async (detail) => {
            const reason = await getLinkedEntryReason(this.doc, {
              name: detail.name as string,
              schemaName: key,
              ...detail,
            });
            allReasons.push(reason);
            return {
              ...detail,
              reason,
            };
          })
        );

        this.entries[key] = {
          collapsed,
          details: detailsWithReasons,
        };
      }

      this.allReasons = allReasons;
    },
    getFilteredDetails(schemaName: string): EntryDetail[] {
      const details = this.entries[schemaName]?.details || [];
      return details.filter((detail) => this.passesFilters({ ...detail, schemaName }));
    },
    passesFilters(entry: EntryDetail & { schemaName: string }): boolean {
      const { reason, name, party, account, item } = entry;

      // Check relationship filter
      if (this.activeFilters.length > 0 && reason?.relationship) {
        if (!this.activeFilters.includes(reason.relationship)) {
          return false;
        }
      }

      // Check search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const searchableText = [
          name,
          party,
          account,
          item,
          reason?.reason,
          reason?.impact,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    },
    getFilterCount(filterId: LinkedEntryRelationship): number {
      let count = 0;

      for (const schemaName in this.entries) {
        const details = this.entries[schemaName]?.details || [];
        for (const detail of details) {
          if (detail.reason?.relationship === filterId) {
            count++;
          }
        }
      }

      return count;
    },
    toggleFilter(filterId: LinkedEntryRelationship) {
      const index = this.activeFilters.indexOf(filterId);
      if (index > -1) {
        this.activeFilters.splice(index, 1);
      } else {
        this.activeFilters.push(filterId);
      }
    },
    clearFilters() {
      this.searchQuery = '';
      this.activeFilters = [];
    },
  },
});

const linkSequence = [
  // Payments first (most important for cash flow)
  ModelNameEnum.Payment,
  // Invoices
  ModelNameEnum.SalesInvoice,
  ModelNameEnum.PurchaseInvoice,
  // Quotes (pre-sales)
  'SalesQuote',
  // Stock Transfers (important for fulfillment)
  ModelNameEnum.Shipment,
  ModelNameEnum.PurchaseReceipt,
  // Other Transactional
  ModelNameEnum.JournalEntry,
  ModelNameEnum.StockMovement,
  // Non Transfers
  ModelNameEnum.Party,
  ModelNameEnum.Item,
  ModelNameEnum.Account,
  ModelNameEnum.Location,
  // Ledgers (technical details, less important)
  ModelNameEnum.AccountingLedgerEntry,
  ModelNameEnum.StockLedgerEntry,
];

const linkEntryDisplayFields: Record<string, string[]> = {
  // Invoices
  [ModelNameEnum.SalesInvoice]: [
    'name',
    'date',
    'party',
    'grandTotal',
    'outstandingAmount',
    'stockNotTransferred',
    'returnAgainst',
  ],
  [ModelNameEnum.PurchaseInvoice]: [
    'name',
    'date',
    'party',
    'grandTotal',
    'outstandingAmount',
    'stockNotTransferred',
    'returnAgainst',
  ],
  // Quotes
  SalesQuote: ['name', 'date', 'party', 'grandTotal'],
  // Stock Transfers
  [ModelNameEnum.Shipment]: [
    'name',
    'date',
    'party',
    'grandTotal',
    'returnAgainst',
  ],
  [ModelNameEnum.PurchaseReceipt]: [
    'name',
    'date',
    'party',
    'grandTotal',
    'returnAgainst',
  ],
  // Other Transactional
  [ModelNameEnum.Payment]: [
    'name',
    'date',
    'party',
    'amount',
    'paymentType',
  ],
  [ModelNameEnum.JournalEntry]: ['name', 'date', 'entryType'],
  [ModelNameEnum.StockMovement]: ['name', 'date', 'amount'],
  // Ledgers
  [ModelNameEnum.AccountingLedgerEntry]: [
    'name',
    'date',
    'account',
    'credit',
    'debit',
  ],
  [ModelNameEnum.StockLedgerEntry]: [
    'name',
    'date',
    'item',
    'location',
    'quantity',
  ],
  // Reference Documents (no dates)
  [ModelNameEnum.Party]: ['name', 'role'],
  [ModelNameEnum.Item]: ['name', 'itemType'],
  [ModelNameEnum.Account]: ['name', 'rootType'],
  [ModelNameEnum.Location]: ['name'],
};
</script>
<style scoped>
.pill-container:empty {
  display: none;
}
</style>
