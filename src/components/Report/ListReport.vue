<template>
  <div class="overflow-hidden flex flex-col h-full">
    <!-- Report Outer Container -->
    <div v-if="dataSlice.length" class="overflow-hidden">
      <!--Title Row -->
      <div
        ref="titlerow"
        class="w-full overflow-x-hidden flex items-center dark:text-gray-25 border-b dark:border-gray-800 px-4"
        :style="{
          height: `${hconst}px`,
          paddingRight: 'calc(var(--w-scrollbar) + 1rem)',
        }"
      >
        <div
          v-for="(col, c) in report.columns"
          :key="c + '-col'"
          :style="getCellStyle(col, c)"
          class="text-base px-3 flex-shrink-0 overflow-x-auto whitespace-nowrap no-scrollbar"
        >
          {{ col.label }}
        </div>
      </div>

      <WithScroll
        class="overflow-auto w-full"
        style="height: calc(100% - 49px)"
        @scroll="scroll"
      >
        <!-- Report Rows -->
        <template v-for="(row, r) in dataSlice" :key="r + '-row'">
          <div
            v-if="!row.folded"
            class="flex items-center w-max px-4"
            :style="{
              height: `${hconst}px`,
              minWidth: `calc(var(--w-desk) - var(--w-scrollbar))`,
            }"
            :class="[
              r !== pageEnd - 1 ? 'border-b dark:border-gray-800' : '',
              row.isGroup
                ? 'hover:bg-gray-50 dark:hover:bg-gray-890 cursor-pointer'
                : '',
            ]"
            @click="() => onRowClick(row, r)"
          >
            <!-- Report Cell -->
            <div
              v-for="(cell, c) in row.cells"
              :key="`${c}-${r}-cell`"
              :style="getCellStyle(cell, c)"
              class="text-base px-3 flex-shrink-0 overflow-x-auto whitespace-nowrap no-scrollbar"
              :class="[
                getCellColorClass(cell),
                isInsightEligible(cell) ? 'cursor-context-menu' : '',
              ]"
              @contextmenu="(e) => onCellRightClick(e, cell, row)"
              @click="(e) => handleCellClick(e, cell, row)"
            >
              {{ cell.value }}
              <span
                v-if="isInsightEligible(cell)"
                class="insight-icon group-hover:opacity-100"
                title="Click to ask a question about this value"
                @click.stop="(e) => handleInsightIconClick(e, cell, row)"
              >
                <FeatherIcon name="help-circle" class="w-3 h-3" />
              </span>
            </div>
          </div>
        </template>
      </WithScroll>
      <!-- Report Rows Container -->
    </div>
    <p
      v-else
      class="w-full text-center mt-20 text-gray-800 dark:text-gray-100 text-base"
    >
      {{ report.loading ? t`Loading Report...` : t`No Values to be Displayed` }}
    </p>

    <!-- Pagination Footer -->
    <div v-if="report.usePagination" class="mt-auto flex-shrink-0">
      <Paginator
        :item-count="report?.reportData?.length ?? 0"
        class="px-4"
        @index-change="setPageIndices"
      />
    </div>
    <div v-else class="h-4" />

    <!-- Insight Context Menu -->
    <InsightContextMenu
      ref="contextMenu"
      @insight-requested="openInsightDialog"
    />

    <!-- Insight Dialog -->
    <InsightDialog
      :show="showInsightDialog"
      :context-type="insightContextType"
      :context-field="insightContextField"
      :context="insightContext"
      :context-info="insightContextInfo"
      @close="closeInsightDialog"
    />
  </div>
</template>
<script>
import { Report } from 'reports/Report';
import { isNumeric } from 'src/utils';
import { languageDirectionKey } from 'src/utils/injectionKeys';
import { defineComponent } from 'vue';
import Paginator from '../Paginator.vue';
import WithScroll from '../WithScroll.vue';
import { inject } from 'vue';
import InsightContextMenu from '../InsightContextMenu.vue';
import InsightDialog from '../InsightDialog.vue';
import {
  isInsightEligible as checkInsightEligible,
  buildReportCellContext,
  buildContextInfo,
} from 'src/utils/insightContext';

export default defineComponent({
  components: { Paginator, WithScroll, InsightContextMenu, InsightDialog },
  props: {
    report: Report,
  },
  setup() {
    return {
      languageDirection: inject(languageDirectionKey),
    };
  },
  data() {
    return {
      wconst: 8,
      hconst: 48,
      pageStart: 0,
      pageEnd: 0,
      showInsightDialog: false,
      insightContextType: null,
      insightContextField: null,
      insightContext: null,
      insightContextInfo: null,
    };
  },
  computed: {
    dataSlice() {
      if (this.report?.usePagination) {
        return this.report.reportData.slice(this.pageStart, this.pageEnd);
      }

      return this.report.reportData;
    },
  },
  methods: {
    scroll({ scrollLeft }) {
      this.$refs.titlerow.scrollLeft = scrollLeft;
    },
    setPageIndices({ start, end }) {
      this.pageStart = start;
      this.pageEnd = end;
    },
    onRowClick(clickedRow, r) {
      if (!clickedRow.isGroup) {
        return;
      }

      r += 1;
      clickedRow.foldedBelow = !clickedRow.foldedBelow;
      const folded = clickedRow.foldedBelow;
      let row = this.dataSlice[r];

      while (row && row.level > clickedRow.level) {
        row.folded = folded;
        r += 1;
        row = this.dataSlice[r];
      }
    },
    getCellStyle(cell, i) {
      const styles = {};
      const width = cell.width ?? 1;

      let align = cell.align ?? 'left';
      if (this.languageDirection === 'rtl') {
        align = this.languageDirection === 'rtl' ? 'right' : 'left';
      }

      styles['width'] = `${width * this.wconst}rem`;
      styles['text-align'] = align;

      if (cell.bold) {
        styles['font-weight'] = 'bold';
      }

      if (cell.italics) {
        styles['font-style'] = 'oblique 15deg';
      }

      if (i === 0) {
        if (this.languageDirection === 'rtl') {
          styles['padding-right'] = '0px';
        } else {
          styles['padding-left'] = '0px';
        }
      }

      if (!cell.align && isNumeric(cell.fieldtype)) {
        styles['text-align'] = 'right';
      }

      if (i === this.report.columns.length - 1) {
        if (this.languageDirection === 'rtl') {
          styles['padding-left'] = '0px';
        } else {
          styles['padding-right'] = '0px';
        }
      }

      if (cell.indent) {
        if (this.languageDirection === 'rtl') {
          styles['padding-right'] = `${cell.indent * 2}rem`;
        } else {
          styles['padding-left'] = `${cell.indent * 2}rem`;
        }
      }

      return styles;
    },
    getCellColorClass(cell) {
      if (cell.color === 'red') {
        return 'text-red-600';
      } else if (cell.color === 'green') {
        return 'text-green-600';
      }

      if (!cell.rawValue) {
        return 'text-gray-600 dark:text-gray-400';
      }

      if (typeof cell.rawValue !== 'number') {
        return 'text-gray-900 dark:text-gray-100';
      }

      if (cell.rawValue === 0) {
        return 'text-gray-600 dark:text-gray-400';
      }

      const prec = this.fyo?.singles?.displayPrecision ?? 2;
      if (Number(cell.rawValue.toFixed(prec)) === 0) {
        return 'text-gray-600 dark:text-gray-500';
      }

      return 'text-gray-900 dark:text-gray-300';
    },
    isInsightEligible(cell) {
      return checkInsightEligible(cell.fieldtype, cell.rawValue);
    },
    onCellRightClick(event, cell, row) {
      // Build context for the cell
      const context = buildReportCellContext(cell, row, this.report?.title);

      if (!context) {
        return;
      }

      // Prevent default context menu
      event.preventDefault();
      event.stopPropagation();

      // Store context for the dialog
      this.insightContext = context;
      this.insightContextType = context.contextType;
      this.insightContextField = context.contextField;
      this.insightContextInfo = buildContextInfo(context);

      // Show context menu
      this.$refs.contextMenu.open(event);
    },
    openInsightDialog() {
      this.showInsightDialog = true;
    },
    closeInsightDialog() {
      this.showInsightDialog = false;
      this.insightContext = null;
      this.insightContextType = null;
      this.insightContextField = null;
      this.insightContextInfo = null;
    },
    hasInsightIcon() {
      // Show insight icon on hover to improve discoverability
      return true;
    },
  },
});
</script>
</script>
