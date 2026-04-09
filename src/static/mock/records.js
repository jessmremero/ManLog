export const RECORD_TYPES = [
  { key: "ALL", label: "全部" },
  { key: "EMISSION", label: "生理现象" },
  { key: "SEX", label: "亲密互动" },
  { key: "MASTURBATION", label: "自我舒缓" }
];

export const MOCK_RECORDS = [
  {
    id: 1,
    type: "EMISSION",
    typeLabel: "生理现象",
    datetime: "2026-04-09 20:21",
    note: "无备注"
  },
  {
    id: 2,
    type: "SEX",
    typeLabel: "亲密互动",
    datetime: "2026-04-07 21:06",
    note: "无备注"
  },
  {
    id: 3,
    type: "MASTURBATION",
    typeLabel: "自我舒缓",
    datetime: "2026-04-05 11:32",
    note: "晚上休息一般"
  }
];
