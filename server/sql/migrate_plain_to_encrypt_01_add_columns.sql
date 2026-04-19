-- 从旧版「明文 event_type / note」升级到加密列（第一步）
-- 适用：已存在含 event_type VARCHAR、note VARCHAR 的 event_records 表
-- 执行后运行：npm run migrate:encrypt-records
-- 再执行：migrate_plain_to_encrypt_02_drop_plain.sql

USE manlog;

ALTER TABLE event_records
  ADD COLUMN event_type_enc VARBINARY(768) NULL AFTER event_type,
  ADD COLUMN event_type_lookup BINARY(32) NULL AFTER event_type_enc,
  ADD COLUMN note_enc VARBINARY(4096) NULL AFTER note;

ALTER TABLE event_records
  ADD KEY idx_record_user_type_lookup (user_id, event_type_lookup);
