-- ManLog v1 — MySQL 8+
-- event_type / note 应用层 AES-256-GCM 加密；event_type_lookup 为按类型筛选用 HMAC（见 server/src/lib/recordCrypto.js）

CREATE DATABASE IF NOT EXISTS manlog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE manlog;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  event_type_enc VARBINARY(768) NOT NULL,
  event_type_lookup BINARY(32) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NULL,
  event_datetime_utc DATETIME NOT NULL,
  note_enc VARBINARY(4096) NULL,
  is_deleted TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_record_user_time (user_id, event_datetime_utc DESC),
  KEY idx_record_user_date (user_id, event_date),
  KEY idx_record_user_deleted (user_id, is_deleted),
  KEY idx_record_user_type_lookup (user_id, event_type_lookup),
  CONSTRAINT fk_event_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
