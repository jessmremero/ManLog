<template>
  <view class="bar-chart">
    <view class="plot-area">
      <view class="y-axis">
        <text v-for="tick in ticks" :key="tick" class="tick-label">{{ tick }}</text>
      </view>
      <view class="bars-area">
        <view class="bars-row">
          <view v-for="item in series" :key="item.label" class="bar-item">
            <view class="bar-wrap">
              <view class="bar" :style="{ height: barHeight(item.count) }"></view>
            </view>
            <text class="x-label">{{ item.label }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: "SimpleBarChart",
  props: {
    series: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    maxValue() {
      const m = Math.max(...this.series.map((x) => Number(x.count || 0)), 1);
      return m;
    },
    ticks() {
      const m = this.maxValue;
      return [m, Math.round(m * 0.66), Math.round(m * 0.33), 0];
    }
  },
  methods: {
    barHeight(value) {
      const n = Number(value || 0);
      const pct = Math.max(0, Math.min(100, (n / this.maxValue) * 100));
      return `${Math.max(2, pct)}%`;
    }
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";

.bar-chart {
  height: 220px;
}

.plot-area {
  height: 100%;
  display: flex;
}

.y-axis {
  width: 26px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: 4px 0 20px;
}

.tick-label {
  font-size: 10px;
  color: $text-secondary;
}

.bars-area {
  flex: 1;
  border-left: 1px solid $border;
  border-bottom: 1px solid $border;
  padding: 4px 6px 0;
}

.bars-row {
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.bar-item {
  width: 28px;
  max-width: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
}

.bar-wrap {
  width: 100%;
  height: 160px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 100%;
  max-width: 28px;
  border-radius: 6px 6px 0 0;
  background: linear-gradient(180deg, #6366f1 0%, #4f46e5 100%);
}

.x-label {
  margin-top: 6px;
  font-size: 10px;
  color: $text-secondary;
}
</style>
