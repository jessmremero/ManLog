<template>
  <view class="line-chart">
    <svg class="svg" viewBox="0 0 320 180" preserveAspectRatio="none">
      <polyline class="line" :points="pointsString" />
      <circle
        v-for="(p, idx) in points"
        :key="idx"
        class="dot"
        :cx="p.x"
        :cy="p.y"
        r="4"
      />
    </svg>
    <view class="x-row">
      <text v-for="item in series" :key="item.label" class="x-label">{{ item.label }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: "SimpleLineChart",
  props: {
    series: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    maxValue() {
      return Math.max(...this.series.map((x) => Number(x.count || 0)), 1);
    },
    points() {
      const n = this.series.length || 1;
      return this.series.map((item, idx) => {
        const x = n === 1 ? 160 : (idx / (n - 1)) * 300 + 10;
        const y = 160 - (Number(item.count || 0) / this.maxValue) * 140;
        return { x, y };
      });
    },
    pointsString() {
      return this.points.map((p) => `${p.x},${p.y}`).join(" ");
    }
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";

.line-chart {
  height: 220px;
}

.svg {
  width: 100%;
  height: 170px;
  background: #fff;
  border-left: 1px solid $border;
  border-bottom: 1px solid $border;
}

.line {
  fill: none;
  stroke: #4f46e5;
  stroke-width: 2;
}

.dot {
  fill: #4f46e5;
}

.x-row {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
}

.x-label {
  font-size: 10px;
  color: $text-secondary;
}
</style>
