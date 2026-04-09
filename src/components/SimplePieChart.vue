<template>
  <view class="pie-container">
    <view class="pie" :style="{ background: gradient }"></view>
    <view class="legend">
      <view v-for="(item, idx) in series" :key="item.label" class="legend-item">
        <view class="dot" :style="{ background: colors[idx % colors.length] }"></view>
        <text class="legend-text">{{ item.label }} {{ item.percent }}%</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: "SimplePieChart",
  props: {
    series: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      colors: ["#4f46e5", "#0ea5a4", "#8b5cf6"]
    };
  },
  computed: {
    gradient() {
      let acc = 0;
      const parts = this.series.map((item, idx) => {
        const start = acc;
        acc += Number(item.percent || 0);
        return `${this.colors[idx % this.colors.length]} ${start}% ${acc}%`;
      });
      return `conic-gradient(${parts.join(", ")})`;
    }
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";

.pie-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pie {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend {
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-text {
  font-size: 12px;
  color: $text-secondary;
}
</style>
