import { MOCK_RECORDS } from "@/static/mock/records";

const STORAGE_KEY = "manlog_mock_records_v1";

function cloneSeed() {
  return JSON.parse(JSON.stringify(MOCK_RECORDS));
}

export function getTypeLabel(type) {
  const map = {
    EMISSION: "生理现象",
    SEX: "亲密互动",
    MASTURBATION: "自我舒缓"
  };
  return map[type] || type;
}

export function loadRecords() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    if (raw) {
      const list = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(list) && list.length) return list;
    }
  } catch (_) {
    /* ignore */
  }
  const seed = cloneSeed();
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

export function saveRecords(list) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(list));
}

export function nextId(list) {
  return list.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1;
}

export function findRecord(list, id) {
  return list.find((r) => r.id === id);
}

export function addRecord(list, row) {
  const next = [...list, row];
  saveRecords(next);
  return next;
}

export function updateRecord(list, id, patch) {
  const next = list.map((r) => (r.id === id ? { ...r, ...patch } : r));
  saveRecords(next);
  return next;
}

export function deleteRecord(list, id) {
  const next = list.filter((r) => r.id !== id);
  saveRecords(next);
  return next;
}

/** 日期输入 YYYY/MM/DD -> YYYY-MM-DD */
export function normalizeDateForStore(dateStr) {
  const m = (dateStr || "").trim().match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (!m) return "";
  const y = m[1];
  const mo = String(Number(m[2])).padStart(2, "0");
  const d = String(Number(m[3])).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

export function formatDisplayNote(note) {
  const s = (note || "").trim();
  return s ? s : "无备注";
}
