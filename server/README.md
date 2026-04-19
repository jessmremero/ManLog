# ManLog API（Node.js + Fastify + MySQL）

与 `design.md` 对齐：`/api/v1` 前缀，统一响应 `{ code, message, data }`。

## 本地运行

1. 安装 MySQL 8，创建库并执行表结构：

   ```bash
   mysql -u root -p < sql/schema.sql
   ```

2. 配置环境变量：

   ```bash
   cp .env.example .env
   # 编辑 .env 中的 MYSQL_*、JWT_SECRET、MANLOG_RECORD_MASTER_KEY（生产必填，开发可留空则使用内置 dev 密钥）
   ```

3. 安装依赖并启动：

   ```bash
   npm install
   npm run dev
   ```

4. 健康检查：<http://localhost:3000/health>

## 开发期登录说明

`POST /api/v1/auth/wx-login` 使用请求体 `{ "code": "任意字符串" }`。服务端将 `code` 哈希为稳定 `openid` 并 **自动建用户**，再签发 JWT。接入真实微信后，在此用 `code` 调微信 `jscode2session` 换取 `openid` 即可，表结构无需改。

## 主要路由

| 方法 | 路径 | 鉴权 |
|------|------|------|
| POST | `/api/v1/auth/wx-login` | 否 |
| POST | `/api/v1/auth/logout` | 否 |
| GET | `/api/v1/records` | Bearer |
| POST | `/api/v1/records` | Bearer |
| GET | `/api/v1/records/:id` | Bearer |
| PUT | `/api/v1/records/:id` | Bearer |
| DELETE | `/api/v1/records/:id` | Bearer |
| GET | `/api/v1/stats/overview` | Bearer |

查询参数见 `design.md`（`page` / `pageSize` / `eventType` / `dimension` / `anchorDate` 等）。

## 敏感字段加密（v1）

- 落库字段：`event_type_enc`、`note_enc`（AES-256-GCM，随机 IV）；`event_type_lookup`（HMAC-SHA256，用于按类型筛选，**不暴露明文枚举**，但同一用户下同类型可关联）。
- 密钥：`MANLOG_RECORD_MASTER_KEY`（32 字节）；**生产环境必须配置**。开发环境未配置时使用控制台警告的 dev 派生密钥。
- 实现见 `src/lib/recordCrypto.js`；轮换主密钥需解密后重加密（可后续提供运维脚本）。
- **全新安装**：执行 `sql/schema.sql` 即可。
- **从旧版明文表升级**（曾有 `event_type` / `note` 列）：
  1. `mysql ... < sql/migrate_plain_to_encrypt_01_add_columns.sql`
  2. `npm run migrate:encrypt-records`
  3. 校验数据后 `mysql ... < sql/migrate_plain_to_encrypt_02_drop_plain.sql`

## v1 其它说明

- `audit_logs` 等可后续迭代。
- 统计口径按 `DEFAULT_TZ`（默认 `Asia/Shanghai`）与 `design.md` 第 4 章实现，细节可在联调时与前端再对齐。
