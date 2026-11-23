# TODO

## 当前阶段：P0 基础框架

文档（CLAUDE.md、DATA.md、README.md）已建立，决策已由用户确认（2026-11-23）：只保留 SUKI ID 登录、访问统计按平台（EdgeOne 用 TEO、Cloudflare 用 GraphQL Analytics、Vercel / Node 用数据库计数）、不提供对外 REST API、slug 只含小写字母与数字、默认 302、不做 `old` 数据迁移。

## P0 基础框架

- [ ] 运行官方 CLI add-on：`better-auth`、`tanstack-query`；升级 Nitro、`@types/node` 与 suki-auth 对齐；补齐 `tsconfig` 严格选项与 `#platform` 别名
- [ ] `vite.config.ts` 的 `targets` 表与四个构建脚本（写法同 suki-auth）
- [ ] 平台层：`database`、`secret`、`ipAddressHeaders`、`kv`、`sukiId`、`adminEmails`；`remote-database.ts` 复用 suki-auth 实现；Upstash 实现（`@upstash/redis`）；Cloudflare `wrangler.jsonc`（D1 `DB`、KV `LINKS`）
- [ ] EdgeOne 边缘源码 `src/server/platform/edgeone-edge.ts` 与打包脚本 `scripts/build-edgeone-edge.mjs`：KV 桥接（批量操作、派生令牌鉴权）
- [ ] **EdgeOne 跳转入口实测**（CLAUDE.md §4.3）：中间件内能否访问 KV 全局变量；`edge-functions/[slug].js` 是否截获云函数路由与静态资源；选定方案后写回 CLAUDE.md
- [ ] **统计实测**：`tencentcloud-sdk-nodejs-teo` 在 EdgeOne 云函数中构建与调用；Vercel 上 `@vercel/functions` 的 `waitUntil` 在 TanStack Start 服务端路由中生效（响应先返回、写入随后完成）；结论写回 CLAUDE.md §6.4
- [ ] 平台层 `analytics` 成员（CLAUDE.md §4.2）
- [ ] Better Auth：`genericOAuth`（SUKI ID）、`ADMIN_EMAILS` 白名单（建号钩子 + `adminMiddleware`）、浏览器端 `authClient`（`genericOAuthClient`）、`/login` 与 `/dashboard` 守卫；在 SUKI ID 后台登记本地与线上回调地址
- [ ] Vitest、ESLint、Prettier；README 部署说明
- [ ] 完成标志：四个目标可构建；能经 SUKI ID 登录，白名单外邮箱被拒；各平台 KV 能读写一个键

## P1 后端

- [ ] `src/features/links/link-input.ts`：slug 规则、随机生成、保留表；保留表覆盖全部顶层路由段的测试
- [ ] 表结构：`link`、`setting`、`visitHour`、`visitDay`（Better Auth schema 插件 + 两份迁移）
- [ ] `src/server/redirect.ts`：跳转解析（CLAUDE.md §5 每一步）、PBKDF2 密码摘要、访问 Cookie 签名与校验
- [ ] 跳转服务端路由 `/$slug` 与 `/`；EdgeOne 跳转入口打包
- [ ] 链接数据层与 KV 同步（DATA.md §3）；服务端函数：列表 / 读取 / 创建 / 编辑 / 删除
- [ ] 访客服务端函数：密码校验（补齐 1 秒）、确认页目标
- [ ] 设置读写与 `c_site` 同步；统计凭据（TEO、Cloudflare）加密存储；重建边缘数据（分页）
- [ ] 导入（分块）与导出
- [ ] 访问统计（CLAUDE.md §6.4）：`server/analytics/` 的 teo / cloudflare / database 三种来源返回同一结构；数据库计数写入（跳转成功后经 `defer`）；EdgeOne 附加面板
- [ ] 测试：内存 KV + `node:sqlite`，验证数据库与 KV 的持久状态

## P2 前端

- [ ] 按 DESIGN.md（Vercel Geist 设计语言 + Vercel 控制台结构，2026-11-23 重写）建立 `styles.css` token 与 shadcn 映射；实现前用 `ui-ux-pro-max` 与 `dataviz` 技能复核
- [ ] 访客页、登录、后台（链接、导入导出、统计、设置），范围见 CLAUDE.md §9
- [ ] 390 / 820 / 1280 / 1600px × 浅 / 深色验收

## 已决定不做

- `old` 分支的数据迁移与导出格式兼容（2026-11-23 用户决定）
- SUKI ID 以外的登录方式（密码、注册、`/setup`）（2026-11-23 用户决定）
- 对外 REST API / API Key（2026-11-23 用户决定）
- 区分大小写、含连字符或其他字符的 slug（2026-11-23 用户决定）
- KV 索引、KV 计数、在 KV 中存认证数据（CLAUDE.md §16）
- Vercel Edge Config 作为 KV（写入经管理 API、容量小）
