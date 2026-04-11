export const DIMENSIONS = [
  { key: "week", label: "周" },
  { key: "month", label: "月" },
  { key: "year", label: "年" },
  { key: "total", label: "总" }
];

/** 与「全部」占比 mock 对齐，用于单类型筛选时缩放柱状/趋势数据 */
export const TYPE_STATS_WEIGHT = {
  ALL: 1,
  EMISSION: 0.37,
  SEX: 0.4,
  MASTURBATION: 0.23
};

const TYPE_PIE_STYLE = {
  EMISSION: { label: "生理现象", color: "#4f46e5" },
  SEX: { label: "亲密互动", color: "#0ea5a4" },
  MASTURBATION: { label: "自我舒缓", color: "#8b5cf6" }
};

export function scaleSeriesForType(series, typeKey) {
  const base = series || [];
  if (typeKey === "ALL") return base.map((x) => ({ ...x }));
  const w = TYPE_STATS_WEIGHT[typeKey] ?? 1;
  return base.map((x) => ({
    ...x,
    count: Math.max(0, Math.round(x.count * w))
  }));
}

export function pieSeriesForType(typeKey) {
  if (typeKey === "ALL") {
    return PIE_SERIES.map((x, i) => ({
      ...x,
      color: ["#4f46e5", "#0ea5a4", "#8b5cf6"][i]
    }));
  }
  const style = TYPE_PIE_STYLE[typeKey];
  if (!style) return PIE_SERIES;
  return [{ label: style.label, percent: 100, color: style.color }];
}

/** 指标卡：按维度基准 + 类型权重生成展示文案 */
export const CARDS_BY_DIMENSION = {
  week: {
    weeklyAvg: 5,
    monthlyAvg: null,
    maxIntervalDays: 9,
    minIntervalDays: 2,
    peakTimeBucket: "18:00-23:59"
  },
  month: {
    weeklyAvg: 1.8,
    monthlyAvg: 8,
    maxIntervalDays: 9,
    minIntervalDays: 2,
    peakTimeBucket: "18:00-23:59"
  },
  year: {
    weeklyAvg: 1.2,
    monthlyAvg: 5.3,
    maxIntervalDays: 14,
    minIntervalDays: 1,
    peakTimeBucket: "00:00-05:59"
  },
  total: {
    weeklyAvg: 1.1,
    monthlyAvg: 4.9,
    maxIntervalDays: 20,
    minIntervalDays: 1,
    peakTimeBucket: "18:00-23:59"
  }
};

export function statCardsFor(dimension, typeKey) {
  const base = CARDS_BY_DIMENSION[dimension] || CARDS_BY_DIMENSION.week;
  const w = typeKey === "ALL" ? 1 : TYPE_STATS_WEIGHT[typeKey] ?? 1;
  const stretch = 2 - w;
  const fmtAvg = (v) => {
    if (v == null || v === undefined) return "-";
    const n = Math.max(0, Math.round(v * w * 10) / 10);
    return n === 0 ? "0" : String(n);
  };
  return {
    weeklyAvg: fmtAvg(base.weeklyAvg),
    monthlyAvg: base.monthlyAvg == null ? "-" : fmtAvg(base.monthlyAvg),
    maxIntervalDays: `${Math.max(1, Math.round(base.maxIntervalDays * stretch))}天`,
    minIntervalDays: `${Math.max(1, Math.round(base.minIntervalDays * stretch))}天`,
    peakTimeBucket: base.peakTimeBucket
  };
}

export function seriesTotalCount(series) {
  return (series || []).reduce((s, x) => s + (Number(x.count) || 0), 0);
}

export const BAR_SERIES_BY_DIMENSION = {
  week: [
    { label: "04.06", count: 1 },
    { label: "04.07", count: 0 },
    { label: "04.08", count: 2 },
    { label: "04.09", count: 1 },
    { label: "04.10", count: 0 },
    { label: "04.11", count: 1 },
    { label: "04.12", count: 0 }
  ],
  month: [
    { label: "01", count: 0 },
    { label: "05", count: 1 },
    { label: "10", count: 1 },
    { label: "15", count: 2 },
    { label: "20", count: 1 },
    { label: "25", count: 0 },
    { label: "30", count: 1 }
  ],
  year: [
    { label: "01月", count: 1 },
    { label: "02月", count: 2 },
    { label: "03月", count: 4 },
    { label: "04月", count: 5 },
    { label: "05月", count: 2 },
    { label: "06月", count: 0 },
    { label: "07月", count: 0 },
    { label: "08月", count: 0 },
    { label: "09月", count: 0 },
    { label: "10月", count: 0 },
    { label: "11月", count: 0 },
    { label: "12月", count: 0 }
  ],
  total: [
    { label: "2024", count: 26 },
    { label: "2025", count: 42 },
    { label: "2026", count: 33 }
  ]
};

export const TREND_SERIES_BY_DIMENSION = {
  week: [
    { label: "W11", count: 4 },
    { label: "W12", count: 3 },
    { label: "W13", count: 5 },
    { label: "W14", count: 2 },
    { label: "W15", count: 5 }
  ],
  month: [
    { label: "2025-11", count: 10 },
    { label: "2025-12", count: 12 },
    { label: "2026-01", count: 7 },
    { label: "2026-02", count: 7 },
    { label: "2026-03", count: 16 }
  ],
  year: [
    { label: "2022", count: 40 },
    { label: "2023", count: 48 },
    { label: "2024", count: 55 },
    { label: "2025", count: 63 },
    { label: "2026", count: 33 }
  ],
  total: [
    { label: "2022", count: 40 },
    { label: "2023", count: 48 },
    { label: "2024", count: 55 },
    { label: "2025", count: 63 },
    { label: "2026", count: 33 }
  ]
};

export const PIE_SERIES = [
  { label: "生理现象", percent: 37 },
  { label: "亲密互动", percent: 40 },
  { label: "自我舒缓", percent: 23 }
];
