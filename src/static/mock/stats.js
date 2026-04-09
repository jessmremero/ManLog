export const DIMENSIONS = [
  { key: "week", label: "周" },
  { key: "month", label: "月" },
  { key: "year", label: "年" },
  { key: "total", label: "总" }
];

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
