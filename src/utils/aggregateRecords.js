const BUCKETS = [
  { key: "00-06", label: "00:00-05:59", start: 0, end: 6 },
  { key: "06-12", label: "06:00-11:59", start: 6, end: 12 },
  { key: "12-18", label: "12:00-17:59", start: 12, end: 18 },
  { key: "18-24", label: "18:00-23:59", start: 18, end: 24 }
];

function parseRecordDate(str) {
  if (!str) return null;
  const [datePart, timePart = "12:00"] = String(str).trim().split(/\s+/);
  const dm = datePart.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (!dm) return null;
  const y = Number(dm[1]);
  const mo = Number(dm[2]);
  const d = Number(dm[3]);
  const tm = timePart.match(/^(\d{1,2}):(\d{2})$/);
  const hh = tm ? Number(tm[1]) : 12;
  const mm = tm ? Number(tm[2]) : 0;
  const dt = new Date(y, mo - 1, d, hh, mm, 0, 0);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

function startOfWeekMonday(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function filterByType(records, typeKey) {
  if (!typeKey || typeKey === "ALL") return records;
  return records.filter((r) => r.type === typeKey);
}

function hourBucket(h) {
  if (h >= 0 && h < 6) return BUCKETS[0].key;
  if (h < 12) return BUCKETS[1].key;
  if (h < 18) return BUCKETS[2].key;
  return BUCKETS[3].key;
}

function buildBarWeek(records, now) {
  const mon = startOfWeekMonday(now);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(mon);
    day.setDate(mon.getDate() + i);
    const label = `${String(day.getMonth() + 1).padStart(2, "0")}.${String(day.getDate()).padStart(2, "0")}`;
    const count = records.filter((r) => {
      const dt = parseRecordDate(r.datetime);
      return dt && sameDay(dt, day);
    }).length;
    out.push({ label, count });
  }
  return out;
}

function buildBarMonth(records, now) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  const segments = 6;
  const segLen = Math.ceil(last / segments);
  const out = [];
  for (let s = 0; s < segments; s += 1) {
    const d0 = s * segLen + 1;
    const d1 = Math.min((s + 1) * segLen, last);
    if (d0 > last) break;
    let count = 0;
    for (let d = d0; d <= d1; d += 1) {
      const day = new Date(y, m, d);
      count += records.filter((r) => {
        const dt = parseRecordDate(r.datetime);
        return dt && sameDay(dt, day);
      }).length;
    }
    const label = d0 === d1 ? String(d0) : `${d0}-${d1}`;
    out.push({ label, count });
  }
  return out.length ? out : [{ label: "1", count: 0 }];
}

function buildBarYear(records, now) {
  const y = now.getFullYear();
  const out = [];
  for (let mo = 1; mo <= 12; mo += 1) {
    const count = records.filter((r) => {
      const dt = parseRecordDate(r.datetime);
      return dt && dt.getFullYear() === y && dt.getMonth() + 1 === mo;
    }).length;
    out.push({ label: `${String(mo).padStart(2, "0")}月`, count });
  }
  return out;
}

function buildBarTotal(records) {
  const years = new Set();
  records.forEach((r) => {
    const dt = parseRecordDate(r.datetime);
    if (dt) years.add(dt.getFullYear());
  });
  const sorted = [...years].sort((a, b) => a - b);
  if (!sorted.length) return [{ label: String(new Date().getFullYear()), count: 0 }];
  return sorted.map((year) => ({
    label: String(year),
    count: records.filter((r) => {
      const dt = parseRecordDate(r.datetime);
      return dt && dt.getFullYear() === year;
    }).length
  }));
}

function buildTrendWeeks(records, now, buckets = 5) {
  const mon = startOfWeekMonday(now);
  const out = [];
  for (let w = buckets - 1; w >= 0; w -= 1) {
    const start = new Date(mon);
    start.setDate(mon.getDate() - w * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const label = `${String(start.getMonth() + 1).padStart(2, "0")}.${String(start.getDate()).padStart(2, "0")}`;
    const count = records.filter((r) => {
      const dt = parseRecordDate(r.datetime);
      if (!dt) return false;
      return dt >= start && dt <= end;
    }).length;
    out.push({ label, count });
  }
  return out;
}

function buildTrendMonths(records, now, buckets = 5) {
  const out = [];
  for (let i = buckets - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const label = `${y}-${String(m + 1).padStart(2, "0")}`;
    const count = records.filter((r) => {
      const dt = parseRecordDate(r.datetime);
      return dt && dt.getFullYear() === y && dt.getMonth() === m;
    }).length;
    out.push({ label, count });
  }
  return out;
}

function buildTrendYears(records, now, buckets = 5) {
  const cy = now.getFullYear();
  const out = [];
  for (let i = buckets - 1; i >= 0; i -= 1) {
    const y = cy - i;
    const count = records.filter((r) => {
      const dt = parseRecordDate(r.datetime);
      return dt && dt.getFullYear() === y;
    }).length;
    out.push({ label: String(y), count });
  }
  return out;
}

function buildPieFromCounts(countsByType) {
  const types = [
    { key: "EMISSION", label: "生理现象", color: "#4f46e5" },
    { key: "SEX", label: "亲密互动", color: "#0ea5a4" },
    { key: "MASTURBATION", label: "自我舒缓", color: "#8b5cf6" }
  ];
  const total = types.reduce((s, t) => s + (countsByType[t.key] || 0), 0);
  if (total === 0) return [];
  return types
    .map((t) => ({
      label: t.label,
      count: countsByType[t.key] || 0,
      color: t.color
    }))
    .filter((x) => x.count > 0)
    .map((x, i, arr) => {
      let pct = Math.round((x.count / total) * 100);
      if (i === arr.length - 1) {
        const prev = arr.slice(0, -1).reduce((s, y) => s + Math.round((y.count / total) * 100), 0);
        pct = Math.max(0, 100 - prev);
      }
      return { label: x.label, percent: pct, color: x.color };
    });
}

function buildCards(records, now) {
  if (!records.length) {
    return {
      weeklyAvg: "-",
      monthlyAvg: "-",
      maxIntervalDays: "-",
      minIntervalDays: "-",
      peakTimeBucket: "-"
    };
  }

  const mon = startOfWeekMonday(now);
  const weekEnd = new Date(mon);
  weekEnd.setDate(mon.getDate() + 7);

  const inWeek = records.filter((r) => {
    const dt = parseRecordDate(r.datetime);
    return dt && dt >= mon && dt < weekEnd;
  }).length;

  const y = now.getFullYear();
  const m = now.getMonth();
  const monthStart = new Date(y, m, 1);
  const monthEnd = new Date(y, m + 1, 1);
  const inMonth = records.filter((r) => {
    const dt = parseRecordDate(r.datetime);
    return dt && dt >= monthStart && dt < monthEnd;
  }).length;

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const weeklyAvg = (inWeek / 7).toFixed(1);
  const monthlyAvg = (inMonth / daysInMonth).toFixed(1);

  const dts = records
    .map((r) => parseRecordDate(r.datetime))
    .filter(Boolean)
    .sort((a, b) => a - b);

  let maxIntervalDays = "-";
  let minIntervalDays = "-";
  if (dts.length >= 2) {
    let maxGap = 0;
    let minGap = Infinity;
    for (let i = 1; i < dts.length; i += 1) {
      const diff = (dts[i] - dts[i - 1]) / 86400000;
      const days = Math.floor(diff);
      maxGap = Math.max(maxGap, days);
      minGap = Math.min(minGap, days);
    }
    maxIntervalDays = `${maxGap}天`;
    minIntervalDays = `${minGap}天`;
  }

  const bucketCounts = {};
  BUCKETS.forEach((b) => {
    bucketCounts[b.key] = 0;
  });
  records.forEach((r) => {
    const dt = parseRecordDate(r.datetime);
    if (!dt) return;
    const k = hourBucket(dt.getHours());
    bucketCounts[k] = (bucketCounts[k] || 0) + 1;
  });
  let peakTimeBucket = "-";
  let peakN = 0;
  BUCKETS.forEach((b) => {
    const n = bucketCounts[b.key] || 0;
    if (n > peakN) {
      peakN = n;
      peakTimeBucket = b.label;
    }
  });
  if (peakN === 0) peakTimeBucket = "-";

  return {
    weeklyAvg,
    monthlyAvg,
    maxIntervalDays,
    minIntervalDays,
    peakTimeBucket
  };
}

/**
 * 从本地记录聚合统计（与维度、类型筛选对齐；类型非 ALL 时饼图为 100% 单类）
 */
export function aggregateStats(records, dimension, typeKey, now = new Date()) {
  const filtered = filterByType(records, typeKey);
  if (!filtered.length) {
    return {
      barSeries: [],
      trendSeries: [],
      pieSeries: [],
      cards: buildCards([], now)
    };
  }

  const baseForCharts = typeKey === "ALL" ? records : filtered;

  let barSeries = [];
  let trendSeries = [];

  if (dimension === "week") {
    barSeries = buildBarWeek(baseForCharts, now);
    trendSeries = buildTrendWeeks(baseForCharts, now);
  } else if (dimension === "month") {
    barSeries = buildBarMonth(baseForCharts, now);
    trendSeries = buildTrendMonths(baseForCharts, now);
  } else if (dimension === "year") {
    barSeries = buildBarYear(baseForCharts, now);
    trendSeries = buildTrendYears(baseForCharts, now);
  } else {
    barSeries = buildBarTotal(baseForCharts);
    trendSeries = buildTrendYears(baseForCharts, now);
  }

  const countsByType = { EMISSION: 0, SEX: 0, MASTURBATION: 0 };
  baseForCharts.forEach((r) => {
    if (countsByType[r.type] !== undefined) countsByType[r.type] += 1;
  });

  let pieSeries;
  if (typeKey === "ALL") {
    pieSeries = buildPieFromCounts(countsByType);
  } else {
    const style = {
      EMISSION: { label: "生理现象", color: "#4f46e5" },
      SEX: { label: "亲密互动", color: "#0ea5a4" },
      MASTURBATION: { label: "自我舒缓", color: "#8b5cf6" }
    }[typeKey];
    const n = filtered.length;
    pieSeries = n > 0 && style ? [{ label: style.label, percent: 100, color: style.color }] : [];
  }

  const cards = buildCards(filtered, now);

  return { barSeries, trendSeries, pieSeries, cards };
}

export function seriesTotalCount(series) {
  return (series || []).reduce((s, x) => s + (Number(x.count) || 0), 0);
}
