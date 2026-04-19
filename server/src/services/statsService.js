import { dayjs } from "../lib/time.js";
import { config } from "../config.js";
import { loadAllForUser } from "./recordService.js";

const TYPE_LABEL = {
  EMISSION: "生理现象",
  SEX: "亲密互动",
  MASTURBATION: "自我舒缓"
};

const BUCKETS = [
  { label: "00:00-05:59", match: (h) => h >= 0 && h < 6 },
  { label: "06:00-11:59", match: (h) => h >= 6 && h < 12 },
  { label: "12:00-17:59", match: (h) => h >= 12 && h < 18 },
  { label: "18:00-23:59", match: (h) => h >= 18 && h <= 23 }
];

function weeksOverlappingRange(start, end) {
  const set = new Set();
  let d = start.startOf("day");
  const last = end.endOf("day");
  while (d.isSameOrBefore(last, "day")) {
    set.add(`${d.isoWeekYear()}-W${String(d.isoWeek()).padStart(2, "0")}`);
    d = d.add(1, "day");
  }
  return Math.max(1, set.size);
}

function monthsBetweenInclusive(start, end) {
  return Math.max(1, end.diff(start, "month") + 1);
}

function getInterval(dimension, anchorStr, tz) {
  const anchor = dayjs.tz(anchorStr, "YYYY-MM-DD", tz).startOf("day");
  switch (dimension) {
    case "week":
      return {
        start: anchor.startOf("isoWeek"),
        end: anchor.endOf("isoWeek")
      };
    case "month":
      return {
        start: anchor.startOf("month"),
        end: anchor.endOf("month")
      };
    case "year":
      return {
        start: anchor.startOf("year"),
        end: anchor.endOf("year")
      };
    case "total":
      return { start: null, end: anchor.endOf("day") };
    default:
      throw new Error("INVALID_DIMENSION");
  }
}

function inInterval(rec, start, end) {
  if (!start) return rec.at.isSameOrBefore(end, "second");
  return rec.at.isSameOrAfter(start, "second") && rec.at.isSameOrBefore(end, "second");
}

function filterRecords(records, start, end) {
  return records.filter((r) => inInterval(r, start, end));
}

function buildBarWeek(records, intervalStart, tz) {
  const out = [];
  for (let i = 0; i < 7; i += 1) {
    const day = intervalStart.add(i, "day");
    const label = day.format("MM-DD");
    const count = records.filter((r) => r.at.isSame(day, "day")).length;
    out.push({ label, count });
  }
  return out;
}

function buildBarMonth(records, intervalStart) {
  const start = intervalStart.startOf("month");
  const end = intervalStart.endOf("month");
  const out = [];
  let d = start;
  while (d.isSameOrBefore(end, "day")) {
    const label = d.format("DD");
    const count = records.filter((r) => r.at.isSame(d, "day")).length;
    out.push({ label, count });
    d = d.add(1, "day");
  }
  return out;
}

function buildBarYear(records, intervalStart) {
  const y = intervalStart.year();
  const out = [];
  for (let m = 1; m <= 12; m += 1) {
    const count = records.filter((r) => r.at.year() === y && r.at.month() + 1 === m).length;
    out.push({ label: String(m).padStart(2, "0"), count });
  }
  return out;
}

function buildBarTotal(records, anchorEnd) {
  if (!records.length) return [];
  const years = new Set();
  records.forEach((r) => years.add(r.at.year()));
  years.add(anchorEnd.year());
  const sorted = [...years].sort((a, b) => a - b);
  return sorted.map((year) => ({
    label: String(year),
    count: records.filter((r) => r.at.year() === year).length
  }));
}

function buildTrendWeek(records, anchorEnd, tz) {
  const out = [];
  const endWeekStart = anchorEnd.tz(tz).startOf("isoWeek");
  for (let i = 7; i >= 0; i -= 1) {
    const ws = endWeekStart.subtract(i, "week").startOf("isoWeek");
    const we = ws.endOf("isoWeek");
    const label = `W${String(ws.isoWeek()).padStart(2, "0")}`;
    const count = records.filter(
      (r) => r.at.isSameOrAfter(ws.startOf("day")) && r.at.isSameOrBefore(we.endOf("day"))
    ).length;
    out.push({ label, count });
  }
  return out;
}

function buildTrendMonth(records, anchorEnd, tz) {
  const out = [];
  const endM = anchorEnd.tz(tz).startOf("month");
  for (let i = 11; i >= 0; i -= 1) {
    const m = endM.subtract(i, "month");
    const label = m.format("YYYY-MM");
    const count = records.filter(
      (r) => r.at.year() === m.year() && r.at.month() === m.month()
    ).length;
    out.push({ label, count });
  }
  return out;
}

function buildTrendYear(records, anchorEnd, tz) {
  const out = [];
  const cy = anchorEnd.tz(tz).year();
  for (let i = 4; i >= 0; i -= 1) {
    const y = cy - i;
    const label = String(y);
    const count = records.filter((r) => r.at.year() === y).length;
    out.push({ label, count });
  }
  return out;
}

function buildTrendTotal(records) {
  const years = [...new Set(records.map((r) => r.at.year()))].sort((a, b) => a - b);
  return years.map((year) => ({
    label: String(year),
    count: records.filter((r) => r.at.year() === year).length
  }));
}

function buildPie(recordsInInterval) {
  const counts = { EMISSION: 0, SEX: 0, MASTURBATION: 0 };
  recordsInInterval.forEach((r) => {
    if (counts[r.eventType] !== undefined) counts[r.eventType] += 1;
  });
  const total = counts.EMISSION + counts.SEX + counts.MASTURBATION;
  if (total === 0) return [];
  return ["EMISSION", "SEX", "MASTURBATION"].map((type) => {
    const c = counts[type];
    if (c === 0) return null;
    return {
      type,
      label: TYPE_LABEL[type],
      count: c,
      ratio: Math.round((c / total) * 100) / 100
    };
  }).filter(Boolean);
}

function intervalsForCards(records, anchorStr, tz) {
  const anchor = dayjs.tz(anchorStr, "YYYY-MM-DD", tz);
  const weekStart = anchor.startOf("isoWeek");
  const weekEnd = anchor.endOf("isoWeek");
  const monthStart = anchor.startOf("month");
  const monthEnd = anchor.endOf("month");
  const yearStart = anchor.startOf("year");
  const yearEnd = anchor.endOf("year");

  const inWeek = records.filter((r) => inInterval(r, weekStart, weekEnd));
  const inMonth = records.filter((r) => inInterval(r, monthStart, monthEnd));
  const inYear = records.filter((r) => inInterval(r, yearStart, yearEnd));

  let first = null;
  let last = null;
  if (records.length) {
    first = records[0].at;
    last = records[records.length - 1].at;
    records.forEach((r) => {
      if (r.at.isBefore(first)) first = r.at;
      if (r.at.isAfter(last)) last = r.at;
    });
  }

  return {
    anchor,
    weekStart,
    weekEnd,
    monthStart,
    monthEnd,
    yearStart,
    yearEnd,
    inWeek,
    inMonth,
    inYear,
    all: records,
    first,
    last
  };
}

function peakBucket(records) {
  const tally = [0, 0, 0, 0];
  records.forEach((r) => {
    const h = r.at.hour();
    const idx = BUCKETS.findIndex((b) => b.match(h));
    if (idx >= 0) tally[idx] += 1;
  });
  let maxI = 0;
  for (let i = 1; i < tally.length; i += 1) {
    if (tally[i] > tally[maxI]) maxI = i;
  }
  if (tally[maxI] === 0) return null;
  return BUCKETS[maxI].label;
}

function intervalGaps(recordsSorted) {
  if (recordsSorted.length < 2) return { max: null, min: null };
  let maxGap = 0;
  let minGap = Infinity;
  for (let i = 1; i < recordsSorted.length; i += 1) {
    const diff = recordsSorted[i].at.diff(recordsSorted[i - 1].at, "day", true);
    const days = Math.floor(diff);
    maxGap = Math.max(maxGap, days);
    minGap = Math.min(minGap, days);
  }
  return { max: maxGap, min: minGap };
}

function buildCards(dimension, scoped, ctx) {
  const { inMonth, inYear, all, first, last } = ctx;
  const sorted = [...scoped].sort((a, b) => a.at.valueOf() - b.at.valueOf());
  const { max, min } = intervalGaps(sorted);
  const peak = peakBucket(scoped);

  let weeklyAvg = null;
  let monthlyAvg = null;

  switch (dimension) {
    case "week":
      weeklyAvg = scoped.length;
      monthlyAvg = null;
      break;
    case "month": {
      const wn = weeksOverlappingRange(ctx.monthStart, ctx.monthEnd);
      weeklyAvg = wn > 0 ? Math.round((inMonth.length / wn) * 10) / 10 : 0;
      monthlyAvg = inMonth.length;
      break;
    }
    case "year": {
      const wn = weeksOverlappingRange(ctx.yearStart, ctx.yearEnd);
      weeklyAvg = wn > 0 ? Math.round((inYear.length / wn) * 10) / 10 : 0;
      monthlyAvg = Math.round((inYear.length / 12) * 10) / 10;
      break;
    }
    case "total": {
      if (!first || !last) {
        weeklyAvg = 0;
        monthlyAvg = 0;
      } else {
        const wn = weeksOverlappingRange(first.startOf("day"), last.endOf("day"));
        const mn = monthsBetweenInclusive(first.startOf("month"), last.endOf("month"));
        weeklyAvg = wn > 0 ? Math.round((all.length / wn) * 10) / 10 : all.length;
        monthlyAvg = mn > 0 ? Math.round((all.length / mn) * 10) / 10 : all.length;
      }
      break;
    }
    default:
      break;
  }

  return {
    weeklyAvg,
    monthlyAvg,
    maxIntervalDays: max,
    minIntervalDays: min,
    peakTimeBucket: peak
  };
}

export async function overview(userId, query) {
  const tz = config.tz;
  const dimension = query.dimension || "week";
  if (!["week", "month", "year", "total"].includes(dimension)) {
    const err = new Error("INVALID_DIMENSION");
    err.code = 40002;
    throw err;
  }

  const anchorDate = query.anchorDate || dayjs().tz(tz).format("YYYY-MM-DD");
  const eventType = query.eventType || null;

  const allRaw = await loadAllForUser(userId, eventType);
  const interval = getInterval(dimension, anchorDate, tz);

  let rangeStart = interval.start;
  const rangeEnd = interval.end;
  if (dimension === "total" && allRaw.length) {
    rangeStart = allRaw.reduce((m, r) => (r.at.isBefore(m) ? r.at : m), allRaw[0].at).startOf("day");
  }

  const inRange = filterRecords(allRaw, rangeStart, rangeEnd);
  const anchorLocal = dayjs.tz(anchorDate, "YYYY-MM-DD", tz);

  let barSeries;
  if (dimension === "week") {
    const ws = anchorLocal.startOf("isoWeek");
    barSeries = buildBarWeek(inRange, ws, tz);
  } else if (dimension === "month") {
    barSeries = buildBarMonth(inRange, anchorLocal);
  } else if (dimension === "year") {
    barSeries = buildBarYear(inRange, anchorLocal);
  } else {
    const totalScoped = allRaw.filter((r) => r.at.isSameOrBefore(rangeEnd, "second"));
    barSeries = buildBarTotal(totalScoped, rangeEnd);
  }

  let trendSeries;
  if (dimension === "week") trendSeries = buildTrendWeek(allRaw, rangeEnd, tz);
  else if (dimension === "month") trendSeries = buildTrendMonth(allRaw, rangeEnd, tz);
  else if (dimension === "year") trendSeries = buildTrendYear(allRaw, rangeEnd, tz);
  else trendSeries = buildTrendTotal(allRaw);

  const pieSeries = buildPie(inRange);

  const ctx = intervalsForCards(allRaw, anchorDate, tz);
  const cards = buildCards(dimension, inRange, ctx);

  return {
    barSeries,
    pieSeries,
    trendSeries,
    cards,
    meta: { dimension, anchorDate, eventType }
  };
}
