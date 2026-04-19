import { pool } from "../db/pool.js";
import { config } from "../config.js";
import {
  buildEventTypeLookup,
  deriveUserDataKey,
  decryptUtf8,
  encryptUtf8
} from "../lib/recordCrypto.js";
import { dayjs, localDateTimeToUtcMysql } from "../lib/time.js";

const EVENT_TYPES = new Set(["EMISSION", "SEX", "MASTURBATION"]);

const TYPE_LABEL = {
  EMISSION: "生理现象",
  SEX: "亲密互动",
  MASTURBATION: "自我舒缓"
};

export function assertEventType(t) {
  if (!EVENT_TYPES.has(t)) {
    const err = new Error("INVALID_EVENT_TYPE");
    err.code = 40001;
    throw err;
  }
}

function userKey(userId) {
  return deriveUserDataKey(config.recordMasterKey, userId);
}

function utcWallClockFromRow(v) {
  if (v == null) return null;
  if (typeof v === "string") {
    return v.replace("T", " ").slice(0, 19);
  }
  if (v instanceof Date) {
    return dayjs.utc(v).format("YYYY-MM-DD HH:mm:ss");
  }
  return String(v).replace("T", " ").slice(0, 19);
}

function rowToClient(row, userId) {
  const tz = config.tz;
  const uk = userKey(userId);
  const eventType = decryptUtf8(row.event_type_enc, uk);
  const note = row.note_enc ? decryptUtf8(row.note_enc, uk) : "";
  const utcStr = utcWallClockFromRow(row.event_datetime_utc);
  const local = dayjs.utc(utcStr, "YYYY-MM-DD HH:mm:ss").tz(tz);
  const dateStr = local.format("YYYY-MM-DD");
  const timeStr = local.format("HH:mm:ss");
  const dtDisplay = `${dateStr} ${local.format("HH:mm")}`;
  return {
    id: Number(row.id),
    eventType,
    eventDate: dateStr,
    eventTime: timeStr,
    note,
    datetime: dtDisplay,
    type: eventType,
    typeLabel: TYPE_LABEL[eventType] || eventType
  };
}

function pickEventTime(body) {
  if (body.eventTime == null) return null;
  const s = String(body.eventTime).trim();
  return s === "" ? null : s;
}

export async function createRecord(userId, body) {
  assertEventType(body.eventType);
  const note = body.note != null ? String(body.note).slice(0, 200) : "";
  const utc = localDateTimeToUtcMysql(body.eventDate, pickEventTime(body), config.tz);
  const local = dayjs.utc(utc, "YYYY-MM-DD HH:mm:ss").tz(config.tz);
  const eventDate = local.format("YYYY-MM-DD");
  const eventTimeSql = pickEventTime(body) ? local.format("HH:mm:ss") : null;

  const uk = userKey(userId);
  const eventTypeEnc = encryptUtf8(body.eventType, uk);
  const eventTypeLookup = buildEventTypeLookup(uk, body.eventType);
  const noteEnc = note ? encryptUtf8(note, uk) : null;

  const [r] = await pool.execute(
    `INSERT INTO event_records (user_id, event_type_enc, event_type_lookup, event_date, event_time, event_datetime_utc, note_enc)
     VALUES (:userId, :eventTypeEnc, :eventTypeLookup, :eventDate, :eventTime, :utc, :noteEnc)`,
    {
      userId,
      eventTypeEnc,
      eventTypeLookup,
      eventDate,
      eventTime: eventTimeSql,
      utc,
      noteEnc
    }
  );
  return getRecordById(userId, r.insertId);
}

export async function getRecordById(userId, id) {
  const [rows] = await pool.execute(
    `SELECT id, event_type_enc, note_enc, event_date, event_time, event_datetime_utc, created_at, updated_at
     FROM event_records WHERE user_id = :userId AND id = :id AND is_deleted = 0`,
    { userId, id }
  );
  if (!rows.length) return null;
  return rowToClient(rows[0], userId);
}

export async function listRecords(userId, query) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  const offset = (page - 1) * pageSize;

  const cond = ["user_id = :userId", "is_deleted = 0"];
  const params = { userId };

  if (query.eventType) {
    assertEventType(query.eventType);
    const uk = userKey(userId);
    cond.push("event_type_lookup = :eventTypeLookup");
    params.eventTypeLookup = buildEventTypeLookup(uk, query.eventType);
  }
  if (query.startDate) {
    cond.push("event_date >= :startDate");
    params.startDate = query.startDate;
  }
  if (query.endDate) {
    cond.push("event_date <= :endDate");
    params.endDate = query.endDate;
  }

  const where = cond.join(" AND ");
  const lim = Number(pageSize);
  const off = Number(offset);
  const [rows] = await pool.execute(
    `SELECT id, event_type_enc, note_enc, event_date, event_time, event_datetime_utc
     FROM event_records WHERE ${where}
     ORDER BY event_datetime_utc DESC, id DESC
     LIMIT ${lim} OFFSET ${off}`,
    params
  );

  const [cnt] = await pool.execute(`SELECT COUNT(*) AS c FROM event_records WHERE ${where}`, params);

  return {
    list: rows.map((row) => rowToClient(row, userId)),
    page,
    pageSize,
    total: Number(cnt[0]?.c || 0)
  };
}

export async function updateRecord(userId, id, body) {
  const existing = await getRecordById(userId, id);
  if (!existing) return null;
  assertEventType(body.eventType);
  const note = body.note != null ? String(body.note).slice(0, 200) : "";
  const utc = localDateTimeToUtcMysql(body.eventDate, pickEventTime(body), config.tz);
  const local = dayjs.utc(utc, "YYYY-MM-DD HH:mm:ss").tz(config.tz);
  const eventDate = local.format("YYYY-MM-DD");
  const eventTimeSql = pickEventTime(body) ? local.format("HH:mm:ss") : null;

  const uk = userKey(userId);
  const eventTypeEnc = encryptUtf8(body.eventType, uk);
  const eventTypeLookup = buildEventTypeLookup(uk, body.eventType);
  const noteEnc = note ? encryptUtf8(note, uk) : null;

  await pool.execute(
    `UPDATE event_records SET
       event_type_enc = :eventTypeEnc,
       event_type_lookup = :eventTypeLookup,
       event_date = :eventDate,
       event_time = :eventTime,
       event_datetime_utc = :utc,
       note_enc = :noteEnc
     WHERE user_id = :userId AND id = :id AND is_deleted = 0`,
    {
      userId,
      id,
      eventTypeEnc,
      eventTypeLookup,
      eventDate,
      eventTime: eventTimeSql,
      utc,
      noteEnc
    }
  );
  return getRecordById(userId, id);
}

export async function softDeleteRecord(userId, id) {
  const [r] = await pool.execute(
    `UPDATE event_records SET is_deleted = 1 WHERE user_id = :userId AND id = :id AND is_deleted = 0`,
    { userId, id }
  );
  return r.affectedRows > 0;
}

export async function loadAllForUser(userId, eventTypeFilter) {
  const params = { userId };
  let extra = "";
  if (eventTypeFilter) {
    assertEventType(eventTypeFilter);
    const uk = userKey(userId);
    extra = " AND event_type_lookup = :eventTypeLookup ";
    params.eventTypeLookup = buildEventTypeLookup(uk, eventTypeFilter);
  }
  const [rows] = await pool.execute(
    `SELECT id, event_type_enc, event_datetime_utc
     FROM event_records WHERE user_id = :userId AND is_deleted = 0 ${extra}
     ORDER BY event_datetime_utc ASC, id ASC`,
    params
  );
  const uk = userKey(userId);
  return rows.map((row) => ({
    id: Number(row.id),
    eventType: decryptUtf8(row.event_type_enc, uk),
    at: dayjs.utc(row.event_datetime_utc, "YYYY-MM-DD HH:mm:ss").tz(config.tz)
  }));
}
