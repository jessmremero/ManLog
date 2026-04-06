# ManLog v1 技术方案文档

> 面向版本：v1  
> 平台：微信小程序 + 云端 API + 云数据库  
> 目标：支持登录、记录、编辑删除、周月年统计报表、加密与权限隔离。

## 1. 架构设计

## 1.1 总体架构
- 客户端：微信小程序（页面、图表、会话管理）。
- 服务端：REST API（鉴权、业务逻辑、统计聚合）。
- 数据层：关系型数据库（用户、记录、审计日志）。
- 安全层：HTTPS 传输加密 + 字段加密 + `userId` 级权限校验。

## 1.2 模块划分
- `auth`：微信登录、token 签发、会话校验。
- `record`：记录增删改查、列表查询。
- `stats`：周/月/年聚合、图表数据组装。
- `security`：加密解密、权限校验、审计日志。
- `profile`：我的页（登录状态、协议入口、主题设置、版本信息）。

## 1.3 时区与时间标准
- 服务端统一存储 UTC 时间戳。
- 统计时按用户本地时区进行自然日/周/月/年计算。
- 自然周固定为周一到周日。

---

## 2. 数据库设计

## 2.1 表：`users`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | bigint | PK | 用户主键（业务 `userId`） |
| `openid` | varchar(64) | UNIQUE, NOT NULL | 微信用户标识 |
| `created_at` | datetime | NOT NULL | 创建时间 |
| `updated_at` | datetime | NOT NULL | 更新时间 |
| `status` | tinyint | NOT NULL, default 1 | 状态（1 正常） |

索引：
- `uk_users_openid (openid)`

## 2.2 表：`event_records`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | bigint | PK | 记录主键 |
| `user_id` | bigint | NOT NULL | 归属用户 |
| `event_type` | varbinary(256) | NOT NULL | 事件类型（加密存储） |
| `event_date` | date | NOT NULL | 事件日期 |
| `event_time` | time | NULL | 事件时间（可空） |
| `event_datetime_utc` | datetime | NOT NULL | 事件 UTC 时间（排序/统计） |
| `note` | varbinary(2048) | NULL | 备注（加密存储，<=200 字） |
| `is_deleted` | tinyint | NOT NULL, default 0 | 软删标记 |
| `created_at` | datetime | NOT NULL | 创建时间 |
| `updated_at` | datetime | NOT NULL | 更新时间 |

索引：
- `idx_record_user_time (user_id, event_datetime_utc desc)`
- `idx_record_user_date (user_id, event_date)`
- `idx_record_user_deleted (user_id, is_deleted)`

说明：
- `event_type` 建议采用枚举值加密后存储，读取时解密映射。
- 删除采用软删，便于审计和恢复。
- 展示术语映射（前端统一文案）：
  - `EMISSION` -> 生理现象
  - `SEX` -> 亲密互动
  - `MASTURBATION` -> 自我舒缓

## 2.3 表：`audit_logs`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | bigint | PK | 日志主键 |
| `user_id` | bigint | NOT NULL | 操作用户 |
| `action` | varchar(32) | NOT NULL | CREATE/UPDATE/DELETE/LOGIN |
| `target_id` | bigint | NULL | 关联记录 ID |
| `meta` | json | NULL | 扩展信息 |
| `created_at` | datetime | NOT NULL | 操作时间 |

---

## 3. 接口设计（v1）

统一约定：
- Base URL：`/api/v1`
- 鉴权：`Authorization: Bearer <token>`
- 返回结构：
  - 成功：`{ code: 0, message: "ok", data: ... }`
  - 失败：`{ code: <non-zero>, message: "...", data: null }`

## 3.1 鉴权接口

### 3.1.1 微信登录
- `POST /auth/wx-login`
- 请求体：
```json
{
  "code": "wx_code"
}
```
- 响应体：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "jwt-token",
    "expiresIn": 7200,
    "userId": 10001
  }
}
```

### 3.1.2 登出
- `POST /auth/logout`
- 说明：服务端可选黑名单策略；前端必须清理本地会话。

### 3.1.3 匿名态访问策略（前端路由守卫）
- 允许匿名访问：示例统计页、产品说明、隐私协议、用户协议、我的页（未登录态）。
- 需要登录后访问：新增记录、编辑记录、删除记录、个人真实历史、个人真实统计。
- 触发受限操作时前端统一拉起登录弹窗，登录成功后回跳原操作页面。

## 3.2 记录接口

### 3.2.1 新增记录
- `POST /records`
- 请求体：
```json
{
  "eventType": "MASTURBATION",
  "eventDate": "2026-04-06",
  "eventTime": "22:30:00",
  "note": "可选备注"
}
```
- 规则：
  - `eventType` 必填，取值：`EMISSION` / `SEX` / `MASTURBATION`
  - `eventDate` 必填
  - `eventTime` 可空，空则服务端用当前时间补齐
  - `note` 可空，长度 <= 200 字
  - 新增页默认时间：前端默认展示当前时间；若用户不改则按该值提交

### 3.2.2 记录列表
- `GET /records`
- 查询参数：
  - `page`（默认 1）
  - `pageSize`（默认 20，最大 100）
  - `eventType`（可选）
  - `startDate`（可选）
  - `endDate`（可选）

### 3.2.3 记录详情
- `GET /records/{id}`

### 3.2.4 更新记录
- `PUT /records/{id}`
- 请求体同新增接口（允许部分更新或全量更新，v1 建议全量）。
- 编辑页时间回显：前端进入编辑态时，时间控件必须回显该记录的已保存时间。

### 3.2.5 删除记录
- `DELETE /records/{id}`
- 行为：软删 `is_deleted=1`。

## 3.3 统计接口

### 3.3.1 统计总览
- `GET /stats/overview`
- 查询参数：
  - `dimension`：`week` / `month` / `year`
  - `anchorDate`：如 `2026-04-06`（定位当前统计周期）
  - `eventType`：可选，默认全部
- 返回：
  - `barSeries`（柱状图）
  - `pieSeries`（饼图）
  - `trendSeries`（折线图）
  - `cards`（指标卡）

返回示例：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "barSeries": [
      { "label": "04-01", "count": 1 },
      { "label": "04-02", "count": 3 }
    ],
    "pieSeries": [
      { "type": "EMISSION", "label": "生理现象", "count": 2, "ratio": 0.2 },
      { "type": "SEX", "label": "亲密互动", "count": 3, "ratio": 0.3 },
      { "type": "MASTURBATION", "label": "自我舒缓", "count": 5, "ratio": 0.5 }
    ],
    "trendSeries": [
      { "label": "W1", "count": 4 },
      { "label": "W2", "count": 7 }
    ],
    "cards": {
      "weeklyAvg": 3.5,
      "monthlyAvg": 13.2,
      "maxIntervalDays": 6,
      "minIntervalDays": 1,
      "peakTimeBucket": "18:00-23:59"
    }
  }
}
```

---

## 4. 统计口径实现细则

## 4.1 基础定义
- 单次事件 = 一条未删除记录。
- 周/月/年统计默认基于全部类型，若指定 `eventType` 则按单类型统计。
- 统计范围按 `anchorDate` 所在周期确定。

## 4.2 周统计（周一到周日）
- 周起点：`anchorDate` 所在周的周一 00:00:00（本地时区）。
- 周终点：该周周日 23:59:59（本地时区）。
- 柱状图：按“天”聚合 7 个桶。
- 横轴：本周 7 个日期标签（MM-DD）。
- 纵轴：当日总次数（记录条数聚合值）。

## 4.3 月统计
- 月起点：当月 1 日 00:00:00。
- 月终点：当月末日 23:59:59。
- 柱状图：按“天”聚合（28~31 桶），横轴为日期（01~月末）。

## 4.4 年统计
- 年起点：1 月 1 日 00:00:00。
- 年终点：12 月 31 日 23:59:59。
- 柱状图：按“月”聚合（12 桶），横轴为月份（01~12）。

## 4.5 饼图占比
- 分子：各类型记录数。
- 分母：统计区间内全部类型记录总数。
- `ratio = typeCount / totalCount`（保留 2 位小数用于展示）。

## 4.6 趋势图
- 周视图：可按最近 N 周聚合（v1 建议最近 8 周）。
- 月视图：按最近 12 个月聚合。
- 年视图：按最近 5 年聚合（数据不足按实际返回）。

## 4.7 指标卡
- `weeklyAvg`：统计区间总次数 / 周数（保留 1 位小数）。
- `monthlyAvg`：统计区间总次数 / 月数（保留 1 位小数）。
- `maxIntervalDays`：排序后相邻事件最大间隔天数（向下取整）。
- `minIntervalDays`：排序后相邻事件最小间隔天数（向下取整）。
- `peakTimeBucket`：按时间分桶计数取最大值，分桶固定：
  - 00:00-05:59
  - 06:00-11:59
  - 12:00-17:59
  - 18:00-23:59

边界规则：
- 当有效记录 < 2 时，`maxIntervalDays` 与 `minIntervalDays` 返回 `null`。
- 无数据时图表返回空数组，卡片返回 `0` 或 `null`（按字段语义）。

---

## 5. 安全与合规实现

## 5.1 鉴权与权限
- 所有业务接口必须经过 token 校验。
- `userId` 仅从 token 中解析，不信任前端传入。
- 所有查询条件自动追加 `user_id = currentUserId`。
- 对匿名可浏览内容，需使用独立“示例数据”接口或前端静态 mock，严禁返回任何真实用户数据。

## 5.2 加密方案
- 传输：全链路 HTTPS。
- 存储：`event_type`、`note` 字段应用层加密。
- 密钥：托管于云 KMS，服务端运行时拉取。

## 5.3 审计与风控
- 记录新增、编辑、删除、登录写入 `audit_logs`。
- 对异常请求频率做限流（IP + userId 维度）。

## 5.4 小程序审核准备
- 提供隐私政策与用户协议页面。
- 明确数据用途与保存策略。
- 提供注销/清理数据能力可作为后续版本增强项。

---

## 6. 非功能与性能目标（v1）

- 记录新增接口 P95 < 300ms（不含网络抖动）。
- 记录列表接口 P95 < 500ms（1 万条数据规模，分页读取）。
- 统计接口 P95 < 800ms（常规周期聚合）。
- 关键错误率 < 0.5%（按日观察）。

---

## 7. 开发约束与落地建议

- 先实现单一 `stats/overview` 聚合接口，减少前端拼装复杂度。
- 统计结果可增加短时缓存（如 30~60 秒）提升体验。
- 先使用软删，后续再补彻底删除与数据生命周期管理。
- 数据库字段保留扩展余量，避免 v2 频繁迁移。
