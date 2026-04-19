import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

function loadRecordMasterKey() {
  const raw = process.env.MANLOG_RECORD_MASTER_KEY;
  if (!raw || !String(raw).trim()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MANLOG_RECORD_MASTER_KEY is required in production (64 hex chars or 32-byte base64)");
    }
    console.warn(
      "[manlog] MANLOG_RECORD_MASTER_KEY unset — using dev-only derived key (never use in production)"
    );
    return crypto.createHash("sha256").update("dev-only-manlog-record-master").digest();
  }
  const t = String(raw).trim();
  if (/^[0-9a-fA-F]{64}$/.test(t)) {
    return Buffer.from(t, "hex");
  }
  const b = Buffer.from(t, "base64");
  if (b.length === 32) {
    return b;
  }
  throw new Error("MANLOG_RECORD_MASTER_KEY must be 64 hex chars or 32-byte base64");
}

export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  recordMasterKey: loadRecordMasterKey(),
  mysql: {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "manlog"
  },
  jwt: {
    secret: process.env.JWT_SECRET || "dev-insecure-secret-change-me",
    expiresInSec: Number(process.env.JWT_EXPIRES_IN_SEC || 7200)
  },
  tz: process.env.DEFAULT_TZ || "Asia/Shanghai"
};
