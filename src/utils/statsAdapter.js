const PIE_COLORS = {
  EMISSION: "#4f46e5",
  SEX: "#0ea5a4",
  MASTURBATION: "#8b5cf6"
};

function seriesTotalCount(series) {
  return (series || []).reduce((s, x) => s + (Number(x.count) || 0), 0);
}

/** 将后端 GET /stats/overview 转为统计页图表/卡片所需结构 */
export function adaptStatsOverview(raw) {
  const barSeries = raw.barSeries || [];
  const trendSeries = raw.trendSeries || [];
  const pieIn = raw.pieSeries || [];

  const pieSeries = pieIn.map((p) => ({
    label: p.label,
    percent: Math.round((Number(p.ratio) || 0) * 100),
    color: PIE_COLORS[p.type] || "#6366f1"
  }));

  const c = raw.cards || {};
  const fmtNum = (v) => {
    if (v === null || v === undefined) return "-";
    return String(v);
  };
  const fmtDay = (v) => {
    if (v === null || v === undefined) return "-";
    if (typeof v === "number") return `${v}天`;
    return String(v);
  };

  const cards = {
    weeklyAvg: fmtNum(c.weeklyAvg),
    monthlyAvg: c.monthlyAvg === null || c.monthlyAvg === undefined ? "-" : fmtNum(c.monthlyAvg),
    maxIntervalDays: fmtDay(c.maxIntervalDays),
    minIntervalDays: fmtDay(c.minIntervalDays),
    peakTimeBucket: c.peakTimeBucket || "-"
  };

  const hasChartData =
    seriesTotalCount(barSeries) > 0 ||
    seriesTotalCount(trendSeries) > 0 ||
    pieSeries.length > 0;

  return { barSeries, trendSeries, pieSeries, cards, hasChartData };
}
