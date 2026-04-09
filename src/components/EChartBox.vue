<template>
  <view class="echart-box">
    <view :id="chartId" class="chart-dom" :style="{ height: `${height}px` }"></view>
  </view>
</template>

<script>
let echarts = null;

export default {
  name: "EChartBox",
  props: {
    option: {
      type: Object,
      default: () => ({})
    },
    height: {
      type: Number,
      default: 220
    }
  },
  data() {
    return {
      chart: null,
      chartId: `chart_${Math.random().toString(36).slice(2, 10)}`
    };
  },
  watch: {
    option: {
      deep: true,
      handler() {
        this.renderChart();
      }
    }
  },
  mounted() {
    // #ifdef H5
    import("echarts").then((mod) => {
      echarts = mod;
      this.$nextTick(() => this.renderChart());
      window.addEventListener("resize", this.onResize);
    });
    // #endif
  },
  beforeUnmount() {
    // #ifdef H5
    window.removeEventListener("resize", this.onResize);
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
    // #endif
  },
  methods: {
    renderChart() {
      // #ifdef H5
      if (!echarts) return;
      const el = document.getElementById(this.chartId);
      if (!el) return;
      if (!this.chart) this.chart = echarts.init(el);
      this.chart.setOption(this.option || {}, true);
      // #endif
    },
    onResize() {
      if (this.chart) this.chart.resize();
    }
  }
};
</script>

<style scoped>
.echart-box {
  width: 100%;
}

.chart-dom {
  width: 100%;
}
</style>
