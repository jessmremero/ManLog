<template>
  <view class="page-container">
    <text class="page-title">统计分析</text>

    <view v-if="useApiMode && !isLoggedInState" class="empty-block card section-gap login-hint">
      <text class="empty-title">登录后查看统计</text>
      <text class="empty-desc">已接入云端接口时，个人统计数据需登录后获取。</text>
      <view class="primary-button hint-btn" @click="goLogin">去登录</view>
    </view>

    <template v-else>
      <view class="chips section-gap">
        <view
          v-for="d in dimensions"
          :key="d.key"
          class="chip dim-chip"
          :class="{ active: dimension === d.key }"
          @click="onPickDimension(d.key)"
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
          @click="onPickType(item.key)"
        >
          {{ item.label }}
        </view>
      </view>

      <view v-if="pageLoading" class="skeleton-block section-gap">
        <view class="sk-line sk-line--lg"></view>
        <view class="sk-line"></view>
        <view class="sk-line sk-line--sm"></view>
      </view>

      <template v-else>
        <view v-if="!hasChartData" class="empty-block card section-gap">
          <text class="empty-title">暂无统计数据</text>
          <text class="empty-desc">当前维度或类型下没有可汇总的事件，先去记录页新增一条吧。</text>
        </view>

        <template v-else>
          <view class="card chart-card section-gap" :key="'bar-' + chartKey">
            <view class="chart-title">频次柱状图</view>
            <EChartBox :option="barOption" :height="240" />
          </view>

          <view class="card chart-card section-gap" :key="'trend-' + chartKey">
            <view class="chart-title">频率趋势图</view>
            <EChartBox :option="trendOption" :height="240" />
          </view>

          <view v-if="pieSeries.length" class="card chart-card section-gap" :key="'pie-' + chartKey">
            <view class="chart-title">类型占比</view>
            <EChartBox :option="pieOption" :height="220" />
          </view>
        </template>
      </template>

      <view class="stat-grid section-gap">
        <StatCard label="周均次数" :value="cards.weeklyAvg" />
        <StatCard label="月均次数" :value="cards.monthlyAvg" />
        <StatCard label="最长间隔" :value="cards.maxIntervalDays" />
        <StatCard label="最短间隔" :value="cards.minIntervalDays" />
        <StatCard label="高频时间段" :value="cards.peakTimeBucket" />
      </view>
    </template>
  </view>
</template>

<script>
import StatCard from "@/components/StatCard.vue";
import EChartBox from "@/components/EChartBox.vue";
import { useApi } from "@/config/api.js";
import { RECORD_TYPES } from "@/static/mock/records";
import { DIMENSIONS } from "@/static/mock/stats";
import { fetchStatsOverview } from "@/services/statsApi.js";
import { aggregateStats } from "@/utils/aggregateRecords";
import { loadRecords } from "@/utils/recordStore";
import { adaptStatsOverview } from "@/utils/statsAdapter";
import { isLoggedIn } from "@/utils/auth";
import { track } from "@/utils/track";

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default {
  components: { StatCard, EChartBox },
  data() {
    return {
      dimension: "week",
      activeType: "ALL",
      dimensions: DIMENSIONS,
      typeOptions: RECORD_TYPES,
      rawRecords: [],
      serverStats: null,
      isLoggedInState: false,
      pageLoading: true,
      statsHydrated: false,
      chartKey: 0
    };
  },
  computed: {
    useApiMode() {
      return useApi();
    },
    aggregated() {
      return aggregateStats(this.rawRecords, this.dimension, this.activeType);
    },
    barSeries() {
      if (this.useApiMode && this.serverStats) return this.serverStats.barSeries;
      return this.aggregated.barSeries;
    },
    trendSeries() {
      if (this.useApiMode && this.serverStats) return this.serverStats.trendSeries;
      return this.aggregated.trendSeries;
    },
    pieSeries() {
      if (this.useApiMode && this.serverStats) return this.serverStats.pieSeries;
      return this.aggregated.pieSeries;
    },
    filteredCount() {
      if (this.useApiMode) {
        if (!this.serverStats) return 0;
        return this.serverStats.hasChartData ? 1 : 0;
      }
      if (this.activeType === "ALL") return this.rawRecords.length;
      return this.rawRecords.filter((r) => r.type === this.activeType).length;
    },
    hasChartData() {
      if (this.useApiMode && this.serverStats) return this.serverStats.hasChartData;
      if (this.activeType === "ALL") return this.rawRecords.length > 0;
      return this.rawRecords.some((r) => r.type === this.activeType);
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
      const data = this.pieSeries.map((p) => ({
        value: p.percent,
        name: p.label,
        itemStyle: { color: p.color }
      }));
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
            data
          }
        ]
      };
    },
    cards() {
      if (this.useApiMode && this.serverStats) {
        if (!this.serverStats.hasChartData) {
          return {
            weeklyAvg: "-",
            monthlyAvg: "-",
            maxIntervalDays: "-",
            minIntervalDays: "-",
            peakTimeBucket: "-"
          };
        }
        return this.serverStats.cards;
      }
      if (!this.hasChartData) {
        return {
          weeklyAvg: "-",
          monthlyAvg: "-",
          maxIntervalDays: "-",
          minIntervalDays: "-",
          peakTimeBucket: "-"
        };
      }
      return this.aggregated.cards;
    }
  },
  onShow() {
    this.refreshData();
  },
  methods: {
    goLogin() {
      uni.navigateTo({ url: "/pages/auth/login" });
    },
    async loadServerStats() {
      const raw = await fetchStatsOverview({
        dimension: this.dimension,
        anchorDate: todayYmd(),
        eventType: this.activeType
      });
      this.serverStats = adaptStatsOverview(raw);
    },
    async refreshData() {
      this.isLoggedInState = isLoggedIn();
      this.chartKey += 1;

      if (this.useApiMode) {
        if (!this.isLoggedInState) {
          this.serverStats = null;
          this.pageLoading = false;
          this.statsHydrated = true;
          return;
        }
        this.pageLoading = true;
        try {
          await this.loadServerStats();
        } catch (e) {
          this.serverStats = null;
          uni.showToast({ title: e.message || "统计加载失败", icon: "none" });
        } finally {
          this.pageLoading = false;
          this.statsHydrated = true;
        }
        track("stats_view", { dimension: this.dimension, type: this.activeType, source: "api" });
        return;
      }

      this.rawRecords = loadRecords();
      if (!this.statsHydrated) {
        this.pageLoading = true;
        this.$nextTick(() => {
          setTimeout(() => {
            this.pageLoading = false;
            this.statsHydrated = true;
          }, 220);
        });
      }
      track("stats_view", { dimension: this.dimension, type: this.activeType, source: "mock" });
    },
    async onPickDimension(key) {
      this.dimension = key;
      this.chartKey += 1;
      track("stats_dimension", { dimension: key });
      if (this.useApiMode && this.isLoggedInState) {
        this.pageLoading = true;
        try {
          await this.loadServerStats();
        } catch (e) {
          uni.showToast({ title: e.message || "加载失败", icon: "none" });
        } finally {
          this.pageLoading = false;
        }
      }
    },
    async onPickType(key) {
      this.activeType = key;
      this.chartKey += 1;
      track("stats_type_filter", { type: key });
      if (this.useApiMode && this.isLoggedInState) {
        this.pageLoading = true;
        try {
          await this.loadServerStats();
        } catch (e) {
          uni.showToast({ title: e.message || "加载失败", icon: "none" });
        } finally {
          this.pageLoading = false;
        }
      }
    }
  }
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

.empty-block {
  padding: 28px 20px;
  text-align: center;
}

.login-hint .hint-btn {
  margin: 8px auto 0;
  max-width: 200px;
}

.empty-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8px;
}

.empty-desc {
  display: block;
  font-size: 13px;
  color: $text-secondary;
  line-height: 1.5;
}

.skeleton-block {
  padding: 20px 16px;
  background: $bg-card;
  border-radius: 12px;
  border: 1px solid $border;
}

.sk-line {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #eef2ff 0%, #e5e7eb 50%, #eef2ff 100%);
  background-size: 200% 100%;
  animation: sk 1.1s ease-in-out infinite;
  margin-bottom: 12px;
}

.sk-line--lg {
  height: 160px;
}

.sk-line--sm {
  height: 10px;
  width: 55%;
  margin-bottom: 0;
}

@keyframes sk {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>
