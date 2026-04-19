import crypto from "crypto";

const GCM_IV_LEN = 12;
const GCM_TAG_LEN = 16;
const VERSION = 1;

/**
 * 记录字段加密（v1）
 * - AES-256-GCM，随机 IV，认证标签与密文一并落库
 * - 每用户数据密钥：HKDF-SHA256(master, salt=userId, info=manlog-record-v1)
 * - event_type 筛选：HMAC-SHA256(userKey, 固定前缀 + eventType)，等值查询（不暴露明文枚举，但同一用户下同类型可关联）
 */

export function deriveUserDataKey(masterKey, userId) {
  const salt = Buffer.from(`uid:${userId}`, "utf8");
  const info = Buffer.from("manlog-record-v1", "utf8");
  return crypto.hkdfSync("sha256", masterKey, salt, info, 32);
}

export function buildEventTypeLookup(userKey, eventType) {
  return crypto.createHmac("sha256", userKey).update(`type|${eventType}`, "utf8").digest();
}

export function encryptUtf8(plaintext, userKey) {
  const iv = crypto.randomBytes(GCM_IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", userKey, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([VERSION]), iv, tag, enc]);
}

export function decryptUtf8(blob, userKey) {
  if (blob == null) return "";
  const buf = Buffer.isBuffer(blob) ? blob : Buffer.from(blob);
  if (buf.length < 1 + GCM_IV_LEN + GCM_TAG_LEN + 1) {
    const err = new Error("DECRYPT_BAD_PAYLOAD");
    err.code = 50001;
    throw err;
  }
  if (buf[0] !== VERSION) {
    const err = new Error("DECRYPT_UNSUPPORTED_VERSION");
    err.code = 50002;
    throw err;
  }
  const iv = buf.subarray(1, 1 + GCM_IV_LEN);
  const tag = buf.subarray(1 + GCM_IV_LEN, 1 + GCM_IV_LEN + GCM_TAG_LEN);
  const data = buf.subarray(1 + GCM_IV_LEN + GCM_TAG_LEN);
  const decipher = crypto.createDecipheriv("aes-256-gcm", userKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
