<template>
  <div class="w-full">
    <svg
      ref="chartSvg"
      :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
      xmlns="http://www.w3.org/2000/svg"
      @mousemove="update"
    >
      <!-- Grid -->
      <path
        v-if="drawXGrid"
        :d="xGrid"
        :stroke="gridColor"
        :stroke-width="gridThickness"
        fill="none"
      />

      <!-- Axis -->
      <path
        v-if="drawAxis"
        :d="axis"
        :stroke="axisColor"
        :stroke-width="axisThickness"
        fill="none"
      />

      <!-- X Labels -->
      <template v-if="drawLabels">
        <text
          v-for="(x, i) in xs"
          :key="'x-' + i"
          :x="x"
          :y="viewBoxHeight - bottom + fontSize"
          text-anchor="middle"
          :style="fontStyle"
        >
          {{ formatX(xLabels[i] ?? '') }}
        </text>
      </template>

      <!-- Y Labels -->
      <template v-if="drawLabels">
        <text
          v-for="i in yLabelDivisions + 1"
          :key="'y-' + i"
          :x="axisPadding + left - 8"
          :y="yScalerLocation(i - 1)"
          text-anchor="end"
          :style="fontStyleMuted"
        >
          {{ formatY(yScalerValue(i - 1)) }}
        </text>
      </template>

      <!-- Gradients -->
      <defs>
        <linearGradient id="idleGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#8B5CF6" stop-opacity="0.02" />
        </linearGradient>

        <linearGradient
          v-for="(c, i) in resolvedColors"
          :key="'grad-' + i"
          :id="`grad-${i}`"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" :stop-color="c" stop-opacity="0.2" />
          <stop offset="100%" :stop-color="c" stop-opacity="0.02" />
        </linearGradient>
      </defs>

      <!-- EMPTY STATE -->
      <g v-if="!hasData">
        <path :d="idleAreaPath" fill="url(#idleGrad)" />
        <path
          :d="idleLinePath"
          stroke="#8B5CF6"
          stroke-width="2"
          stroke-opacity="0.6"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>

      <!-- DATA STATE -->
      <g v-else v-for="(series, sIdx) in points" :key="'s-' + sIdx">
        <path :d="getAreaPath(sIdx)" :fill="`url(#grad-${sIdx})`" />
        <path
          :d="getLinePath(sIdx)"
          :stroke="resolvedColors[sIdx]"
          :stroke-width="getThickness(sIdx)"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </svg>

    <!-- Tooltip -->
    <Tooltip
      v-if="showTooltip && xi >= 0"
      ref="tooltip"
      placement="top"
      class="px-4 py-3 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 text-sm"
      :style="{ borderLeft: `4px solid ${resolvedColors[yi]}` }"
    >
      <div class="min-w-[140px]">
        <p class="text-xs text-gray-400 text-center mb-2">
          {{ formatX(xLabels[xi]) }}
        </p>

        <div v-if="showAllSeriesInTooltip" class="space-y-1">
          <div
            v-for="(label, i) in tooltipSeriesLabels"
            :key="label"
            class="flex items-center gap-2"
          >
            <span
              class="w-2 h-2 rounded-full"
              :style="{ background: resolvedColors[i] }"
            />
            <span class="text-gray-600 dark:text-gray-300">{{ label }}</span>
            <span class="ml-auto font-semibold">
              {{ format(points[i]?.[xi] ?? 0) }}
            </span>
          </div>
        </div>

        <p v-else class="text-lg font-semibold text-center">
          {{ format(points[yi][xi]) }}
        </p>
      </div>
    </Tooltip>
  </div>
</template>

<script>
import Tooltip from '../Tooltip.vue';
import { euclideanDistance, prefixFormat } from 'src/utils/chart';

export default {
  components: { Tooltip },

  props: {
    points: { type: Array, default: () => [] },
    xLabels: { type: Array, default: () => [] },

    colors: { type: Array, default: () => [] },

    viewBoxHeight: { type: Number, default: 420 },
    aspectRatio: { type: Number, default: 4 },

    axisPadding: { type: Number, default: 28 },
    pointsPadding: { type: Number, default: 20 },
    left: { type: Number, default: 48 },
    bottom: { type: Number, default: 32 },

    drawAxis: { type: Boolean, default: false },
    drawXGrid: { type: Boolean, default: true },
    drawLabels: { type: Boolean, default: true },

    yLabelDivisions: { type: Number, default: 4 },

    thickness: { type: Number, default: 3 },
    thicknesses: { type: Array, default: () => [] },

    gridColor: { type: String, default: 'rgba(0,0,0, 0.04)' },
    axisColor: { type: String, default: 'rgba(0,0,0, 0.04)' },

    gridThickness: { type: Number, default: 1 },
    axisThickness: { type: Number, default: 1 },

    format: { type: Function, default: (n) => n.toFixed(0) },
    formatY: { type: Function, default: prefixFormat },
    formatX: { type: Function, default: (v) => v },

    fontSize: { type: Number, default: 12 },
    fontColor: { type: String, default: '#6B7280' },

    showTooltip: { type: Boolean, default: true },
    showAllSeriesInTooltip: { type: Boolean, default: false },
    seriesLabels: { type: Array, default: () => [] },
  },

  data() {
    return { xi: -1, yi: -1, cx: -1, cy: -1 };
  },

  computed: {
    hasData() {
      return this.points.some((p) => p && p.length);
    },

    resolvedColors() {
      return this.colors.length
        ? this.colors
        : ['#10B981', '#EF4444', '#8B5CF6'];
    },

    fontStyle() {
      return { fontSize: `${this.fontSize}px`, fill: this.fontColor };
    },

    fontStyleMuted() {
      return { fontSize: `${this.fontSize}px`, fill: '#9CA3AF' };
    },

    viewBoxWidth() {
      return this.viewBoxHeight * this.aspectRatio;
    },

    padding() {
      return this.axisPadding + this.pointsPadding;
    },

    xs() {
      const count = Math.max(
        ...this.points.map((p) => p.length),
        this.xLabels.length,
        12
      );
      return Array(count)
        .fill(0)
        .map(
          (_, i) =>
            this.padding +
            this.left +
            (i * (this.viewBoxWidth - this.left - this.padding * 2)) /
              Math.max(count - 1, 1)
        );
    },

    ys() {
      const flat = this.points
        .flat()
        .filter((v) => v !== undefined && v !== null && !isNaN(v));
      if (!flat.length) {
        flat.push(0);
      }

      const min = Math.min(...flat, 0);
      const max = Math.max(...flat, 1);

      if (!this.hasData) {
        const count = this.xs.length;
        const y = this.viewBoxHeight - this.padding - this.bottom;
        return this.resolvedColors.map(() => Array(count).fill(y));
      }

      return this.points.map((series) =>
        series.map((v) => {
          if (v === undefined || v === null || isNaN(v)) {
            return this.viewBoxHeight - this.padding - this.bottom;
          }
          return (
            this.padding +
            (1 - (v - min) / (max - min)) *
              (this.viewBoxHeight - this.padding * 2 - this.bottom)
          );
        })
      );
    },

    idleLinePath() {
      const y = this.viewBoxHeight - this.padding - this.bottom;
      return `M ${this.padding + this.left} ${y} L ${
        this.viewBoxWidth - this.padding
      } ${y}`;
    },

    idleAreaPath() {
      const base = this.viewBoxHeight - this.padding - this.bottom;
      const top = base - 60;
      const left = this.padding + this.left;
      const right = this.viewBoxWidth - this.padding;
      return `M ${left} ${base} L ${left} ${top} L ${right} ${top} L ${right} ${base} Z`;
    },

    axis() {
      return `M ${this.axisPadding + this.left} ${this.axisPadding}
              V ${this.viewBoxHeight - this.axisPadding - this.bottom}`;
    },

    xGrid() {
      const lines = [];
      for (let i = 0; i <= this.yLabelDivisions; i++) {
        lines.push(
          `M ${this.padding + this.left}
             ${this.yScalerLocation(i)}
           H ${this.viewBoxWidth - this.padding}`
        );
      }
      return lines.join(' ');
    },

    tooltipSeriesLabels() {
      return this.seriesLabels.length
        ? this.seriesLabels
        : this.points.map((_, i) => `Series ${i + 1}`);
    },
  },

  methods: {
    getThickness(i) {
      return this.thicknesses[i] ?? this.thickness;
    },

    yScalerLocation(i) {
      return (
        ((this.yLabelDivisions - i) *
          (this.viewBoxHeight - this.padding * 2 - this.bottom)) /
          this.yLabelDivisions +
        this.padding
      );
    },

    yScalerValue(i) {
      const flat = this.points.flat();
      const min = Math.min(...flat, 0);
      const max = Math.max(...flat, 1);
      return (i * (max - min)) / this.yLabelDivisions + min;
    },

    getLinePath(i) {
      if (!this.ys[i] || !this.xs.length) return '';

      return this.xs
        .map((x, idx) => {
          const y = this.ys[i][idx];
          if (y === undefined || y === null || isNaN(y)) {
            return '';
          }
          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .filter((path) => path !== '')
        .join(' ');
    },

    getAreaPath(i) {
      if (!this.ys[i] || !this.xs.length) return '';

      const linePath = this.getLinePath(i);
      if (!linePath) return '';

      const base = this.viewBoxHeight - this.padding - this.bottom;
      const lastX = this.xs.at(-1);
      const firstX = this.xs[0];

      if (lastX === undefined || firstX === undefined) return '';

      return `${linePath}
              L ${lastX} ${base}
              L ${firstX} ${base} Z`;
    },

    update(e) {
      const rect = this.$refs.chartSvg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const xi = Math.round((x / rect.width) * (this.xs.length - 1));
      if (xi < 0 || xi >= this.xs.length) return;

      // Ensure ys array exists and has data
      if (!this.ys || !this.ys.length) return;

      const dists = this.ys.map((s, i) => {
        // Check if series exists and has the xi-th element
        if (!s || !s[xi]) return Infinity;
        return euclideanDistance(x, y, this.xs[xi], s[xi]);
      });

      const minDist = Math.min(...dists);
      if (minDist === Infinity) return;

      const yi = dists.indexOf(minDist);
      this.xi = xi;
      this.yi = yi;
      this.cx = this.xs[xi];

      // Additional safety check for ys[yi] and ys[yi][xi]
      if (this.ys[yi] && this.ys[yi][xi] !== undefined) {
        this.cy = this.ys[yi][xi];
      }

      this.$refs.tooltip?.update(e);
    },
  },
};
</script>
