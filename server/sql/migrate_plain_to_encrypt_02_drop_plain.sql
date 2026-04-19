-- 明文列回填并校验无误后执行：删除明文列并将密文列设为 NOT NULL
-- 注意：请先备份数据库

USE manlog;

ALTER TABLE event_records
  DROP COLUMN event_type,
  DROP COLUMN note,
  MODIFY COLUMN event_type_enc VARBINARY(768) NOT NULL,
  MODIFY COLUMN event_type_lookup BINARY(32) NOT NULL;
