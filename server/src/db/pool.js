import mysql from "mysql2/promise";
import { config } from "../config.js";

export const pool = mysql.createPool({
  host: config.mysql.host,
  port: config.mysql.port,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  // DATETIME/TIME 以字符串返回，避免 mysql2 转成 Date 时按本机时区误解析（event_datetime_utc 存的是 UTC 墙钟）
  dateStrings: true
});
