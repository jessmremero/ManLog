<template>
  <view class="page-container">
    <text class="page-title">统计分析</text>

    <view class="chips section-gap">
      <view
        v-for="d in dimensions"
        :key="d.key"
        class="chip dim-chip"
        :class="{ active: dimension === d.key }"
        @click="dimension = d.key"
      >
        {{ d.label }}
      </view>
    </view>

    <view class="chips">
      <view
        v-for="item in typeOptions"
        :key="item.key"
        class="chip"
        :class="{ active: activeType === item.key }"
        @click="activeType = item.key"
      >
        {{ item.label }}
      </view>
    </view>

    <view class="card chart-card section-gap">
      <view class="chart-title">频次柱状图</view>
      <EChartBox :option="barOption" :height="240" />
    </view>

    <view class="card chart-card section-gap">
      <view class="chart-title">频率趋势图</view>
      <EChartBox :option="trendOption" :height="240" />
    </view>

    <view class="card chart-card section-gap">
      <view class="chart-title">类型占比</view>
      <EChartBox :option="pieOption" :height="220" />
    </view>

    <view class="stat-grid section-gap">
      <StatCard label="周均次数" :value="cards.weeklyAvg" />
      <StatCard label="月均次数" :value="cards.monthlyAvg" />
      <StatCard label="最长间隔" :value="cards.maxIntervalDays" />
      <StatCard label="最短间隔" :value="cards.minIntervalDays" />
      <StatCard label="高频时间段" :value="cards.peakTimeBucket" />
    </view>
  </view>
</template>

<script>
import StatCard from "@/components/StatCard.vue";
import EChartBox from "@/components/EChartBox.vue";
import { RECORD_TYPES } from "@/static/mock/records";
import { BAR_SERIES_BY_DIMENSION, DIMENSIONS, PIE_SERIES, TREND_SERIES_BY_DIMENSION } from "@/static/mock/stats";

export default {
  components: { StatCard, EChartBox },
  data() {
    return {
      dimension: "week",
      activeType: "ALL",
      dimensions: DIMENSIONS,
      typeOptions: RECORD_TYPES
    };
  },
  computed: {
    barSeries() {
      return BAR_SERIES_BY_DIMENSION[this.dimension] || [];
    },
    trendSeries() {
      return TREND_SERIES_BY_DIMENSION[this.dimension] || [];
    },
    pieSeries() {
      return PIE_SERIES;
    },
    barOption() {
      return {
        grid: { left: 24, right: 10, top: 20, bottom: 28 },
        xAxis: {
          type: "category",
          data: this.barSeries.map((x) => x.label),
          axisTick: { show: false },
          axisLine: { lineStyle: { color: "#d1d5db" } },
          axisLabel: { color: "#6b7280", fontSize: 10 }
        },
        yAxis: {
          type: "value",
          splitLine: { lineStyle: { color: "#eef2ff" } },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: "#6b7280", fontSize: 10 }
        },
        tooltip: { trigger: "axis" },
        series: [
          {
            type: "bar",
            data: this.barSeries.map((x) => x.count),
            barMaxWidth: 28,
            itemStyle: {
              borderRadius: [6, 6, 0, 0],
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "#6366f1" },
                  { offset: 1, color: "#4f46e5" }
                ]
              }
            }
          }
        ]
      };
    },
    trendOption() {
      return {
        grid: { left: 24, right: 10, top: 20, bottom: 28 },
        xAxis: {
          type: "category",
          data: this.trendSeries.map((x) => x.label),
          axisTick: { show: false },
          axisLine: { lineStyle: { color: "#d1d5db" } },
          axisLabel: { color: "#6b7280", fontSize: 10 }
        },
        yAxis: {
          type: "value",
          splitLine: { lineStyle: { color: "#eef2ff" } },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: "#6b7280", fontSize: 10 }
        },
        tooltip: { trigger: "axis" },
        series: [
          {
            type: "line",
            data: this.trendSeries.map((x) => x.count),
            smooth: true,
            lineStyle: { color: "#4f46e5", width: 2 },
            itemStyle: { color: "#4f46e5" },
            areaStyle: { color: "rgba(79,70,229,0.12)" }
          }
        ]
      };
    },
    pieOption() {
      return {
        tooltip: { trigger: "item" },
        legend: {
          bottom: 0,
          left: "center",
          textStyle: { color: "#6b7280", fontSize: 12 }
        },
        series: [
          {
            type: "pie",
            radius: ["45%", "70%"],
            center: ["50%", "45%"],
            itemStyle: { borderColor: "#fff", borderWidth: 2 },
            label: { formatter: "{b} {d}%" },
            data: [
              { value: this.pieSeries[0]?.percent || 0, name: this.pieSeries[0]?.label || "生理现象", itemStyle: { color: "#4f46e5" } },
              { value: this.pieSeries[1]?.percent || 0, name: this.pieSeries[1]?.label || "亲密互动", itemStyle: { color: "#0ea5a4" } },
              { value: this.pieSeries[2]?.percent || 0, name: this.pieSeries[2]?.label || "自我舒缓", itemStyle: { color: "#8b5cf6" } }
            ]
          }
        ]
      };
    },
    cards() {
      if (this.dimension === "week") {
        return { weeklyAvg: "5", monthlyAvg: "-", maxIntervalDays: "9天", minIntervalDays: "2天", peakTimeBucket: "18:00-23:59" };
      }
      if (this.dimension === "month") {
        return { weeklyAvg: "1.8", monthlyAvg: "8", maxIntervalDays: "9天", minIntervalDays: "2天", peakTimeBucket: "18:00-23:59" };
      }
      if (this.dimension === "year") {
        return { weeklyAvg: "1.2", monthlyAvg: "5.3", maxIntervalDays: "14天", minIntervalDays: "1天", peakTimeBucket: "00:00-05:59" };
      }
      return { weeklyAvg: "1.1", monthlyAvg: "4.9", maxIntervalDays: "20天", minIntervalDays: "1天", peakTimeBucket: "18:00-23:59" };
    }
  },
  methods: {}
};
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";

.section-gap {
  margin-top: 12px;
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.dim-chip {
  min-width: 54px;
  text-align: center;
}

.chart-card {
  padding: 12px;
}

.chart-title {
  font-weight: 600;
  margin-bottom: 10px;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
</style>
