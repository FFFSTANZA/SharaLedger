<template>
  <div>
    <svg
      ref="chartSvg"
      :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
      xmlns="http://www.w3.org/2000/svg"
      @mousemove="update"
    >
      <!-- x Grid Lines -->
      <path
        v-if="drawXGrid"
        :d="xGrid"
        :stroke="gridColor"
        :stroke-width="gridThickness"
        stroke-linecap="round"
        fill="transparent"
      />

      <!-- Axis -->
      <path
        v-if="drawAxis"
        :d="axis"
        :stroke-width="axisThickness"
        :stroke="axisColor"
        fill="transparent"
      />

      <!-- x Labels -->
      <template v-if="drawLabels && xLabels.length > 0">
        <text
          v-for="(i, j) in count"
          :key="j + '-xlabels'"
          :style="fontStyle"
          :y="
            viewBoxHeight -
            axisPadding +
            yLabelOffset +
            fontStyle.fontSize / 2 -
            bottom
          "
          :x="xs[i - 1]"
          text-anchor="middle"
        >
          {{ formatX(xLabels[i - 1] || '') }}
        </text>
      </template>

      <!-- y Labels -->
      <template v-if="drawLabels && yLabelDivisions > 0">
        <text
          v-for="(i, j) in yLabelDivisions + 1"
          :key="j + '-ylabels'"
          :style="fontStyle"
          :y="yScalerLocation(i - 1)"
          :x="axisPadding - xLabelOffset + left"
          text-anchor="end"
        >
          {{ yScalerValue(i - 1) }}
        </text>
      </template>

      <!-- Gradient Definitions -->
      <defs>
        <linearGradient
          v-for="(color, idx) in colors"
          :id="'grad-' + idx"
          :key="'grad-' + idx"
          x1="0"
          y1="0"
          x2="0"
          y2="100%"
        >
          <stop offset="0%" :stop-color="color" stop-opacity="0.45" />
          <stop offset="50%" :stop-color="color" stop-opacity="0.2" />
          <stop offset="100%" :stop-color="color" stop-opacity="0.02" />
        </linearGradient>

        <!-- Drop shadow filter for lines -->
        <filter id="line-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="2"
            flood-color="rgba(0, 0, 0, 0.15)"
          />
        </filter>

        <!-- Glow filter for active points -->
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g v-for="(i, j) in num" :key="j + '-gpath'">
        <!-- Gradient Fill Areas -->
        <path
          stroke-linejoin="round"
          :d="getGradLine(i - 1)"
          fill="url('#grad-' + (i - 1))"
          fill-opacity="1"
          stroke="none"
        />

        <!-- Lines with shadow -->
        <path
          stroke-linejoin="round"
          :d="getLine(i - 1)"
          :stroke="colors[i - 1] || getRandomColor()"
          :stroke-width="getThickness(i - 1)"
          stroke-linecap="round"
          fill="none"
          filter="url('#line-shadow')"
          style="opacity: 0.95"
        />

        <!-- Data Point Markers -->
        <g v-if="showPoints">
          <circle
            v-for="(xVal, k) in xs"
            :key="'point-' + j + '-' + k"
            :cx="xVal"
            :cy="ys[i - 1]?.[k]"
            :r="getPointRadius(i - 1)"
            :fill="darkMode ? '#1f2937' : '#ffffff'"
            :stroke="colors[i - 1] || getRandomColor()"
            stroke-width="2.5"
            style="opacity: 0.8; transition: all 0.2s"
          />
        </g>
      </g>

      <!-- Tooltip Reference -->
      <g v-if="xi > -1 && yi > -1">
        <!-- Outer glow ring -->
        <circle
          r="16"
          :cx="cx"
          :cy="cy"
          :fill="colors[yi]"
          fill-opacity="0.25"
          filter="url('#glow')"
        />
        <!-- Inner solid circle -->
        <circle
          r="8"
          :cx="cx"
          :cy="cy"
          :fill="darkMode ? '#1f2937' : '#ffffff'"
          :stroke="colors[yi]"
          stroke-width="3"
        />
      </g>
    </svg>
    <Tooltip
      v-if="showTooltip"
      ref="tooltip"
      :offset="15"
      placement="top"
      class="text-[13px] shadow-2xl px-4 py-3.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md text-gray-800 dark:text-gray-100 rounded-2xl border border-gray-100/50 dark:border-gray-700/50 transition-all duration-300"
      :style="{
        borderTop: `3px solid ${colors[yi] || colors[0] || '#d1d5db'}`,
      }"
    >
      <div class="min-w-[180px]">
        <p
          class="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wider text-center"
        >
          {{ xi > -1 ? formatX(xLabels[xi]) : '' }}
        </p>

        <div v-if="showAllSeriesInTooltip" class="space-y-2 tabular-nums">
          <div
            v-for="(label, sIdx) in tooltipSeriesLabels"
            :key="label + sIdx"
            class="flex items-center gap-2.5 px-1 py-0.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <span
              class="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
              :style="{
                backgroundColor: colors[sIdx],
                boxShadow: `0 0 8px ${colors[sIdx]}40`,
              }"
            />
            <span class="text-gray-600 dark:text-gray-300 font-medium">{{
              label
            }}</span>
            <span class="ms-auto font-bold text-gray-900 dark:text-gray-100">
              {{ xi > -1 ? format(points[sIdx]?.[xi] ?? 0) : '' }}
            </span>
          </div>

          <p
            v-if="tooltipExtraText"
            class="mt-3 pt-2.5 text-xs text-gray-600 dark:text-gray-300 text-center border-t border-gray-200 dark:border-gray-700/50"
          >
            {{ tooltipExtraText }}
          </p>
        </div>

        <p
          v-else
          class="text-xl font-bold tracking-tight text-center tabular-nums"
        >
          {{ yi > -1 ? format(points[yi][xi]) : '' }}
        </p>
      </div>
    </Tooltip>
  </div>
</template>
<script>
import { euclideanDistance, prefixFormat } from 'src/utils/chart';
import Tooltip from '../Tooltip.vue';

export default {
  components: { Tooltip },
  props: {
    colors: { type: Array, default: () => [] },
    xLabels: { type: Array, default: () => [] },
    yLabelDivisions: { type: Number, default: 4 },
    points: { type: Array, default: () => [[]] },
    drawAxis: { type: Boolean, default: false },
    drawXGrid: { type: Boolean, default: true },
    drawLabels: { type: Boolean, default: true },
    viewBoxHeight: { type: Number, default: 500 },
    aspectRatio: { type: Number, default: 4 },
    axisPadding: { type: Number, default: 30 },
    pointsPadding: { type: Number, default: 24 },
    xLabelOffset: { type: Number, default: 20 },
    yLabelOffset: { type: Number, default: 5 },
    gridColor: { type: String, default: 'rgba(0, 0, 0, 0.2)' },
    axisColor: { type: String, default: 'rgba(0, 0, 0, 0.5)' },
    thickness: { type: Number, default: 5 },
    thicknesses: { type: Array, default: () => [] },
    axisThickness: { type: Number, default: 1 },
    gridThickness: { type: Number, default: 0.5 },
    yMin: { type: Number, default: null },
    yMax: { type: Number, default: null },
    format: { type: Function, default: (n) => n.toFixed(1) },
    formatY: { type: Function, default: prefixFormat },
    formatX: { type: Function, default: (v) => v },
    fontSize: { type: Number, default: 20 },
    fontColor: { type: String, default: '#415668' },
    bottom: { type: Number, default: 0 },
    left: { type: Number, default: 55 },
    extendGridX: { type: Number, default: -20 },
    tooltipDispDistThreshold: { type: Number, default: 40 },
    showAllSeriesInTooltip: { type: Boolean, default: false },
    seriesLabels: { type: Array, default: () => [] },
    tooltipExtra: { type: Function, default: null },
    showTooltip: { type: Boolean, default: true },
    showPoints: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return { cx: -1, cy: -1, xi: -1, yi: -1 };
  },
  computed: {
    fontStyle() {
      return { fontSize: this.fontSize, fill: this.fontColor };
    },
    viewBoxWidth() {
      return this.aspectRatio * this.viewBoxHeight;
    },
    num() {
      return this.points.length;
    },
    count() {
      return Math.max(...this.points.map((p) => p.length));
    },
    xs() {
      return Array(this.count)
        .fill()
        .map(
          (_, i) =>
            this.padding +
            this.left +
            (i * (this.viewBoxWidth - this.left - 2 * this.padding)) /
              (this.count - 1 || 1) // The "or" one (1) prevents accidentally dividing by 0
        );
    },
    ys() {
      const min = this.hMin;
      const max = this.hMax;
      return this.points.map((pp) =>
        pp.map(
          (p) =>
            this.padding +
            (1 - (p - min) / (max - min)) *
              (this.viewBoxHeight - 2 * this.padding - this.bottom)
        )
      );
    },
    xy() {
      return this.xs.map((x, i) => [x, this.ys.map((y) => y[i])]);
    },
    min() {
      return Math.min(...this.points.flat());
    },
    max() {
      return Math.max(...this.points.flat());
    },
    axis() {
      return `M ${this.axisPadding + this.left} ${this.axisPadding} V ${
        this.viewBoxHeight - this.axisPadding - this.bottom
      } H ${this.viewBoxWidth - this.axisPadding}`;
    },
    padding() {
      return this.axisPadding + this.pointsPadding;
    },
    xGrid() {
      const { l, r } = this.xLims;
      const lo = l + this.extendGridX;
      const ro = r - this.extendGridX;
      const ys = Array(this.yLabelDivisions + 1)
        .fill()
        .map((_, i) => this.yScalerLocation(i));
      return ys.map((y) => `M ${lo} ${y} H ${ro}`).join(' ');
    },
    yGrid() {
      return [];
    },
    xLims() {
      const l = this.padding + this.left;
      const r = this.viewBoxWidth - this.padding;
      return { l, r };
    },
    hMin() {
      return Math.min(this.yMin ?? this.min, 0);
    },
    hMax() {
      let hMax = Math.max(this.yMax ?? this.max, 0);
      if (hMax === this.hMin) {
        return hMax + 1000;
      }
      return hMax;
    },
    tooltipSeriesLabels() {
      if (this.seriesLabels?.length === this.num) {
        return this.seriesLabels;
      }

      if (this.seriesLabels?.length) {
        return this.seriesLabels;
      }

      return Array(this.num)
        .fill(null)
        .map((_, i) => `Series ${i + 1}`);
    },
    tooltipExtraText() {
      if (!this.tooltipExtra || this.xi < 0) {
        return '';
      }

      try {
        return this.tooltipExtra(this.xi, this.yi) ?? '';
      } catch {
        return '';
      }
    },
  },
  methods: {
    getThickness(seriesIndex) {
      const t = this.thicknesses?.[seriesIndex];
      return typeof t === 'number' ? t : this.thickness;
    },
    getPointRadius(seriesIndex) {
      // Smaller points for thicker lines, larger for thinner lines
      const thickness = this.getThickness(seriesIndex);
      return Math.max(3, 5 - thickness / 3);
    },
    gradY(i) {
      return Math.min(...this.ys[i]).toFixed();
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
      const min = this.hMin;
      const max = this.hMax;
      return this.formatY((i * (max - min)) / this.yLabelDivisions + min);
    },
    getLine(i) {
      const [x, y] = this.xy[0];
      let d = `M ${x} ${y[i]} `;
      this.xy.slice(1).forEach(([x, y]) => {
        d += `L ${x} ${y[i]} `;
      });
      return d;
    },
    getGradLine(i) {
      let bo = this.viewBoxHeight - this.padding - this.bottom;
      let d = `M ${this.padding + this.left} ${bo}`;
      this.xy.forEach(([x, y]) => {
        d += `L ${x} ${y[i]} `;
      });
      return d + ` V ${bo} Z`;
    },
    getRandomColor() {
      const rgb = Array(3)
        .fill()
        .map(() => parseInt(Math.random() * 255))
        .join(',');
      return `rgb(${rgb})`;
    },
    update(event) {
      if (!this.showTooltip) {
        return;
      }

      const { x, y } = this.getSvgXY(event);
      const { xi, yi, cx, cy, d } = this.getPointIndexAndCoords(x, y);

      if (d > this.tooltipDispDistThreshold) {
        this.xi = -1;
        this.yi = -1;
        this.cx = -1;
        this.cy = -1;
        this.$refs.tooltip.destroy();
        return;
      }
      this.$refs.tooltip.create();

      this.xi = xi;
      this.yi = yi;
      this.cx = cx;
      this.cy = cy;
      this.$refs.tooltip.update(event);
    },
    getSvgXY({ clientX, clientY }) {
      const inv = this.$refs.chartSvg.getScreenCTM().inverse();
      const point = new DOMPoint(clientX, clientY);
      const { x, y } = point.matrixTransform(inv);
      return { x, y };
    },
    getPointIndexAndCoords(x, y) {
      const { l, r } = this.xLims;
      const xi = Math.round((x - l) / ((r - l) / (this.count - 1)));
      if (xi < 0 || xi > this.count - 1) {
        return { d: this.tooltipDispDistThreshold + 1 };
      }
      const px = this.xs[xi];
      const pys = this.ys.map((yarr) => yarr[xi]);
      const dists = pys.map((py) => euclideanDistance(x, y, px, py));
      const minDist = Math.min(...dists);
      const yi = dists
        .map((j, i) => [j - minDist, i])
        .filter(([j, _]) => j === 0)
        .at(-1)[1];
      return { xi, yi, cx: px, cy: pys[yi], d: minDist };
    },
  },
};
</script>
