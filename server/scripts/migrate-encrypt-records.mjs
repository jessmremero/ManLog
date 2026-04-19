/**
 * 将旧表结构中明文 event_type / note 加密写入 event_type_enc / event_type_lookup / note_enc。
 * 前置：已执行 sql/migrate_plain_to_encrypt_01_add_columns.sql
 * 环境：与 server 相同 .env（含 MANLOG_RECORD_MASTER_KEY、MYSQL_*）
 */
import mysql from "mysql2/promise";
import { config } from "../src/config.js";
import {
  buildEventTypeLookup,
  deriveUserDataKey,
  encryptUtf8
} from "../src/lib/recordCrypto.js";

const pool = mysql.createPool({
  host: config.mysql.host,
  port: config.mysql.port,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  waitForConnections: true,
  connectionLimit: 2
});

async function main() {
  const [rows] = await pool.execute(
    `SELECT id, user_id, event_type, note     FROM event_records
     WHERE event_type_enc IS NULL AND event_type IS NOT NULL`
  );
  if (!rows.length) {
    console.log("No rows to migrate (already encrypted or empty table).");
    await pool.end();
    return;
  }
  console.log(`Migrating ${rows.length} row(s)...`);
  for (const row of rows) {
    const userKey = deriveUserDataKey(config.recordMasterKey, row.user_id);
    const encType = encryptUtf8(row.event_type, userKey);
    const lookup = buildEventTypeLookup(userKey, row.event_type);
    const noteEnc =
      row.note != null && String(row.note).length > 0 ? encryptUtf8(String(row.note), userKey) : null;
    await pool.execute(
      `UPDATE event_records SET event_type_enc = ?, event_type_lookup = ?, note_enc = ? WHERE id = ?`,
      [encType, lookup, noteEnc, row.id]
    );
  }
  console.log("Done. Run sql/migrate_plain_to_encrypt_02_drop_plain.sql when ready.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
