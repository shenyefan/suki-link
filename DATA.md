# SUKI Link 数据契约

本文件定义数据库表、KV 键与值、二者的同步规则，以及导入导出格式。架构背景见 [CLAUDE.md](CLAUDE.md) §3。

## 1. 数据库

表由 Better Auth 管理：核心表（`user`、`session`、`account`、`verification`、`rateLimit`）与自有表（经 schema 插件声明，写法同 suki-auth `src/lib/schema.ts`）。迁移由 Better Auth CLI 生成，SQLite 系列与 PostgreSQL 各一份：`migrations/0001_initial.sql`、`migrations/postgres/0001_initial.sql`。

### 1.1 `link`

| 列             | 类型    | 约束             | 说明                                                                     |
| -------------- | ------- | ---------------- | ------------------------------------------------------------------------ |
| `id`           | string  | 主键             | 随机 ID；slug 可改，ID 不变                                              |
| `slug`         | string  | 唯一、非空       | 已规范化（小写），规则见 CLAUDE.md §6.1                                  |
| `url`          | string  | 非空             | 目标地址                                                                 |
| `comment`      | string  | 可空             | 备注                                                                     |
| `passwordHash` | string  | 可空             | `pbkdf2-sha256$<迭代次数>$<盐 base64url>$<摘要 base64url>`；空表示无密码 |
| `forwardQuery` | boolean | 非空，默认 false | 透传访问时的查询参数                                                     |
| `cloaking`     | boolean | 非空，默认 false | 遮蔽跳转（iframe）                                                       |
| `confirm`      | boolean | 非空，默认 false | 跳转前显示确认页                                                         |
| `expiresAt`    | date    | 可空             | 过期时间                                                                 |
| `createdAt`    | date    | 非空、索引       | 列表默认按它倒序                                                         |
| `updatedAt`    | date    | 非空             |                                                                          |

- 列表搜索：`slug`、`url`、`comment` 任一包含关键字（Better Auth 适配器 `contains`，`OR` 连接）。
- 分页：按排序键的游标分页（最新 / 最早用 `createdAt` + `id`，slug 排序用 `slug`），每页 50 条。

### 1.2 `setting`

键值表，缺行取默认值。

| 列          | 类型   | 说明 |
| ----------- | ------ | ---- |
| `key`       | string | 主键 |
| `value`     | string | JSON |
| `updatedAt` | date   |      |

| `key`        | `value`                                                                                                                                 | 默认值                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `redirect`   | `{ status: 301 \| 302 \| 307 \| 308, homeUrl: string \| null }`                                                                         | `{ status: 302, homeUrl: null }`                                  |
| `link`       | `{ slugLength: number (4–32), reservedSlugs: string[], passwordTtl: number (秒, 60–2592000) }`                                          | `{ slugLength: 6, reservedSlugs: [], passwordTtl: 3600 }`         |
| `teo`        | `{ secretId: string, secretKey: string (symmetricEncrypt 密文), region: string, zoneId: string \| null, functionName: string \| null }` | 缺行即未配置；`region` 默认 `ap-guangzhou`；只在 EdgeOne 部署使用 |
| `cloudflare` | `{ zoneId: string, apiToken: string (symmetricEncrypt 密文) }`                                                                          | 缺行即未配置；只在 Cloudflare 部署使用                            |

`redirect` 变化时同步 KV `c_site`；`link`、`teo`、`cloudflare` 只在服务端使用，不进入 KV。`teo.secretKey` 与 `cloudflare.apiToken` 只写不读：读取设置的接口只返回是否已设置，保存时留空即保留原值；更换 `BETTER_AUTH_SECRET` 后无法解密，按未配置处理。

### 1.3 `visitHour` / `visitDay`（仅 Vercel / Node）

数据库计数（CLAUDE.md §6.4）。EdgeOne 与 Cloudflare 部署同样建表（迁移统一），但从不写入。

`visitHour`：

| 列       | 类型    | 约束                     | 说明                      |
| -------- | ------- | ------------------------ | ------------------------- |
| `linkId` | string  | 主键之一，引用 `link.id` | 删除链接时一并删除        |
| `hour`   | string  | 主键之一                 | UTC 小时，`2026-11-23T08` |
| `count`  | integer | 非空                     | 该小时的访问次数          |

`visitDay`：

| 列          | 类型    | 约束                     | 说明                                                                                                                             |
| ----------- | ------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `linkId`    | string  | 主键之一，引用 `link.id` | 删除链接时一并删除                                                                                                               |
| `day`       | string  | 主键之一                 | UTC 日期，`2026-11-23`                                                                                                           |
| `dimension` | string  | 主键之一                 | `country`、`referrer`、`device`、`browser`、`os`                                                                                 |
| `value`     | string  | 主键之一                 | 国家为 ISO 3166-1 两位代码（取不到为空串）；来源为 Referer 主机（直接访问为空串）；设备为 `desktop`、`mobile`、`tablet`、`other` |
| `count`     | integer | 非空                     | 该日该维度取值的访问次数                                                                                                         |

- 写入：每次计数一条 `visitHour` 与一条五行的 `visitDay`，均为 `INSERT … ON CONFLICT (主键) DO UPDATE SET count = count + excluded.count`。
- 查询：24 小时视图读 `visitHour`；7 天、30 天的时序按 `day` 汇总 `visitHour`；Top 维度读 `visitDay`。
- 不设清理；查询只读最近 30 天。

## 2. KV

### 2.1 键

| 键         | 值                   | 写入时机                                 |
| ---------- | -------------------- | ---------------------------------------- |
| `l_<slug>` | 链接跳转记录（§2.2） | 链接创建、编辑、重命名、删除、导入、重建 |
| `c_site`   | 站点跳转设置（§2.3） | `redirect` 设置保存、重建                |

slug 只含小写字母与数字（≤ 64 位），直接作为键的一部分，无需编码，且满足最严格的平台约束（EdgeOne：键只能含字母、数字、下划线，≤ 512 字节）。示例：`abc123` → `l_abc123`。

- 不同记录类型用单字母前缀区分（`l_`、`c_`），`list({ prefix: 'l_' })` 只枚举链接键。
- 四个平台使用完全相同的键，同一套测试覆盖。
- 每个部署使用独立的 KV 命名空间（Cloudflare namespace、EdgeOne namespace、Upstash 数据库），不加部署前缀。

### 2.2 链接跳转记录 `l_<slug>`

```json
{
  "v": 1,
  "id": "k3m9x2p7q4w8r1t5",
  "url": "https://example.com/page?a=1",
  "expiresAt": 1798761600000,
  "passwordRev": "9f86d081",
  "forwardQuery": true,
  "cloaking": true,
  "confirm": true
}
```

| 字段           | 必有 | 说明                                                                                                     |
| -------------- | ---- | -------------------------------------------------------------------------------------------------------- |
| `v`            | 是   | 记录格式版本                                                                                             |
| `id`           | 是   | 链接 ID；Vercel / Node 的访问计数用它记录（CLAUDE.md §6.4）                                              |
| `url`          | 是   | 目标地址                                                                                                 |
| `expiresAt`    | 否   | Unix 毫秒；缺省为永不过期                                                                                |
| `passwordRev`  | 否   | `SHA-256(passwordHash)` 前 8 个十六进制字符；缺省为无密码。只用于签名与失效访问 Cookie，不能用来校验密码 |
| `forwardQuery` | 否   | 只在为 true 时写出，下同                                                                                 |
| `cloaking`     | 否   |                                                                                                          |
| `confirm`      | 否   |                                                                                                          |

不含 `comment`、`passwordHash`、时间戳等跳转用不到的字段。

### 2.3 站点跳转设置 `c_site`

```json
{ "v": 1, "status": 302, "homeUrl": "https://blog.example.com" }
```

`homeUrl` 缺省时根路径渲染站点首页。`c_site` 不存在时按默认值（`302`、无主页）处理。

### 2.4 版本

跳转解析遇到不认识的 `v` 时按记录不存在处理。格式升级时：新代码同时能写新版本，部署后在设置页执行“重建边缘数据”。

## 3. 同步规则

数据库先写，成功后再写 KV。KV 写失败不回滚数据库，返回 `{ error: 'kv_sync_failed' }`。

| 操作         | 数据库                                              | KV                                                                    |
| ------------ | --------------------------------------------------- | --------------------------------------------------------------------- |
| 创建         | insert                                              | `put l_<new>`                                                         |
| 编辑         | update                                              | `put l_<slug>`                                                        |
| 重命名 slug  | update                                              | `put l_<new>`，再 `delete l_<old>`                                    |
| 删除         | delete（连同 `visitHour`、`visitDay` 中该链接的行） | `delete l_<slug>`                                                     |
| 导入（每块） | 逐条 insert（已存在跳过）                           | 对成功插入的逐条 `put`                                                |
| 保存跳转设置 | upsert `setting.redirect`                           | `put c_site`                                                          |
| 重建边缘数据 | 只读                                                | 分页重写全部 `l_*` 与 `c_site`；再分页 `list l_` 删除数据库中没有的键 |

- **分块**：Cloudflare Workers 每次调用的 KV 操作数有上限（1000），导入与重建都由前端分块驱动（导入每块 ≤ 100 条；重建按游标每次处理 200 个键），服务端函数每次只处理一块。
- **EdgeOne 桥接**：桥接边缘函数接受批量操作 `{ ops: [{ op: 'put', key, value } | { op: 'delete', key } | { op: 'get', key } | { op: 'list', prefix, cursor }] }`，一块数据一次往返。
- **无 KV 的部署**：上表 KV 列全部跳过，跳转直接读数据库；“重建边缘数据”不显示。
- **一致性**：KV 为最终一致（约 60 秒全球可见）。重命名期间旧 slug 可能仍短暂可用、新 slug 可能短暂 404，不做补偿。

## 4. 导入导出（备份）

只认本项目自己的格式，不兼容 `old` 分支的导出文件。

### 4.1 导出

```json
{
  "format": "suki-link",
  "version": 1,
  "exportedAt": "2026-11-23T08:00:00.000Z",
  "links": [
    {
      "slug": "abc123",
      "url": "https://example.com",
      "comment": "备注",
      "passwordHash": "pbkdf2-sha256$600000$...$...",
      "forwardQuery": false,
      "cloaking": false,
      "confirm": false,
      "expiresAt": "2027-01-01T00:00:00.000Z",
      "createdAt": "2026-11-01T00:00:00.000Z",
      "updatedAt": "2026-11-01T00:00:00.000Z"
    }
  ]
}
```

可选字段缺省即为空 / false。密码摘要与签名密钥无关，导入到另一个部署后密码仍然有效。

### 4.2 导入

- 文件按上面的格式用同一份 Zod 定义校验，`format` 或 `version` 不符整体拒绝。
- 保留 slug、规则不符记为失败；已存在的 slug 跳过；结果返回成功、跳过、失败三组（各含序号、slug、地址，失败含原因）。
- 导入允许已过期的 `expiresAt`。
