# SUKI Link 重建分支协作规范

本文件是重建分支（`master`）的唯一协作入口，面向 AI 编码代理与人类维护者。数据库表与 KV 键的契约见 [DATA.md](DATA.md)；待办与阶段进度见 [TODO.md](TODO.md)；部署操作见 [README.md](README.md)；视觉与交互规范见 [DESIGN.md](DESIGN.md)（Vercel Geist 设计语言与控制台结构，见 §11）。

## 1. 分支定位

本分支从空提交开始重建边缘短链系统，项目骨架由 TanStack 官方 CLI（`@tanstack/cli create`）生成，不继承 `old` 分支的代码与目录结构。

- **目标**：同一套代码可选择部署到 Node 服务器、Cloudflare、腾讯云 EdgeOne Pages 或 Vercel。每次部署只选一个目标，各部署的运行时数据互相独立；共用的是代码、表结构、迁移与 KV 键格式。
- **多平台写法参考**：同级仓库 `../suki-auth`（同为 TanStack Start 重建项目，四个目标已真实部署验证）。平台层、`DEPLOY_TARGET` 构建切换、远程数据库、Better Auth 接入、目录与前端规范都沿用它的做法；需要时直接读它的 `CLAUDE.md`、`vite.config.ts`、`src/server/platform/`。
- **业务参考**：`old` 分支（Next.js + EdgeOne KV）是业务规则的事实来源。需要时用 `git show old:<path>` 读取（重点：`src/app/[slug]/route.ts`、`src/server/link.ts`、`src/app/api/links/**`、`openapi.json`），不把旧实现原样复制进来。

### 1.1 阶段

顺序为先后端、再前端：

| 阶段        | 内容                                                                                                                                                 | 完成标志                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| P0 基础框架 | 官方 CLI add-on、四个部署目标与各自数据库 / KV、Better Auth + SUKI ID 登录、EdgeOne 跳转入口与 TEO SDK 实测、Vercel 后台写入实测、测试与格式化工具链 | 四个目标均可构建；能经 SUKI ID 登录；能经各平台 KV 读写一个键；EdgeOne 跳转入口方案定稿 |
| P1 后端     | 链接与设置的数据层、KV 投影同步、跳转解析、管理端服务端函数、导入导出、访问统计（TEO / Cloudflare / 数据库）、测试                                   | §5–§7 全部规则有实现与测试；四个目标构建通过                                            |
| P2 前端     | 按 DESIGN.md 从头实现后台与访客页面；数据只经 P1 的服务端函数读取                                                                                    | 页面覆盖 `old` 的全部用户可见功能（见 §9）                                              |

当前阶段以 [TODO.md](TODO.md) 为准。进入下一阶段前须由用户明确确认。

## 2. 技术栈

| 层次     | 技术                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------ |
| 全栈框架 | TanStack Start（React 19、TanStack Router 文件路由、Server Functions / Server Routes）                                   |
| 构建     | Vite 8；部署集成见 §4                                                                                                    |
| 认证     | Better Auth（只用 `genericOAuth` 接入 SUKI ID）；`tanstackStartCookies()` 必须是 `plugins` 数组的最后一项                |
| 数据库   | SQLite 系列（`node:sqlite`、D1、libSQL）及 PostgreSQL，经 Kysely（与 suki-auth 相同）                                    |
| 访问统计 | EdgeOne：TEO API（官方 SDK `tencentcloud-sdk-nodejs-teo`）；Cloudflare：GraphQL Analytics API；Vercel / Node：数据库计数 |
| KV       | Cloudflare Workers KV、EdgeOne Pages KV、Upstash Redis（Vercel / Node 可选），见 §4                                      |
| UI       | Tailwind CSS 4；shadcn 组件；图标 Lucide；字体 Geist 自托管（P2）                                                        |
| 校验     | Zod                                                                                                                      |
| 测试     | Vitest                                                                                                                   |
| 质量     | ESLint（`@tanstack/eslint-config`）、Prettier（无分号、单引号）、TypeScript                                              |
| 包管理   | **pnpm**（禁用 npm、npx、yarn；不生成 `package-lock.json` / `yarn.lock`）                                                |

**TypeScript**：必须开启 `strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`，以及 CLI 默认的 `verbatimModuleSyntax`、`noUnused*` 等选项。

**路径别名**：`#/*` → `src/*`；`#platform` → 当前部署目标的平台实现（见 §4.2）。

## 3. 数据分层

**数据库是唯一的事实来源，KV 只是跳转用的只读投影。**

| 数据                         | 存放                              | 读者                         |
| ---------------------------- | --------------------------------- | ---------------------------- |
| 链接完整记录（含密码摘要）   | 数据库 `link` 表                  | 后台、导出、密码校验、确认页 |
| 设置（含加密的统计凭据）     | 数据库 `setting` 表               | 后台、服务端函数             |
| 访问计数（仅 Vercel / Node） | 数据库 `visitHour`、`visitDay` 表 | 统计页                       |
| 管理员账户与会话             | 数据库（Better Auth）             | 认证                         |
| 跳转记录（每个 slug 一个键） | KV `l_<slug>`                     | 跳转入口                     |
| 跳转所需的站点设置           | KV `c_site`                       | 跳转入口                     |

- 后台的列表、搜索、排序、分页全部走 SQL，**不对 KV 做 list 查询**（KV 的 list 只在“重建边缘数据”时用来清理多余键）。
- 每次写入先写数据库，成功后再写 KV（`put` / `delete`）。KV 写失败时数据库不回滚，服务端函数返回 `{ error: 'kv_sync_failed' }`，界面提示后可在设置页执行“重建边缘数据”：按数据库全量重写 `l_*` 与 `c_site`，并删除数据库中已不存在的 `l_*` 键。
- 有 KV 的平台上，跳转只读 KV，KV 中没有即视为不存在，不回落查询数据库（避免随机 slug 扫描打到数据库）。没有 KV 的部署（Node 未配置 Upstash）跳转直接读数据库。
- KV 为最终一致（Cloudflare 与 EdgeOne 约 60 秒内全球可见）：新建、修改、删除在其他边缘节点生效有延迟，这是平台特性，不做补偿。
- 键名、值格式与同步规则的完整契约见 [DATA.md](DATA.md)。

## 4. 部署目标

### 4.1 各平台方案

构建目标由环境变量 `DEPLOY_TARGET` 选择（默认 `node`），`vite.config.ts` 据此加载该平台官方推荐的 TanStack Start 集成，并把 `#platform` 指向对应实现（写法同 suki-auth）：

| `DEPLOY_TARGET` | 构建集成                  | 数据库                            | KV                                                      | 跳转入口                                     |
| --------------- | ------------------------- | --------------------------------- | ------------------------------------------------------- | -------------------------------------------- |
| `node`          | Nitro `node-server`       | SQLite 文件 / libSQL / PostgreSQL | 可选 Upstash Redis；未配置时为 `null`（跳转读数据库）   | TanStack 服务端路由                          |
| `cloudflare`    | `@cloudflare/vite-plugin` | D1（绑定 `DB`）                   | Workers KV（绑定 `LINKS`）                              | TanStack 服务端路由（运行在 Worker，即边缘） |
| `edgeone`       | Nitro `edgeone-pages`     | libSQL / PostgreSQL               | EdgeOne KV（全局变量 `links_kv`，只能在边缘运行时访问） | 边缘运行时直接读 KV（方案见 §4.3）           |
| `vercel`        | Nitro `vercel`            | libSQL / PostgreSQL               | Upstash Redis（Vercel Marketplace 集成）                | TanStack 服务端路由                          |

- Cloudflare 不走 Nitro，原因同 suki-auth（Nitro 3 的 miniflare 开发运行时会加载两份 React）。
- Vercel 不用 Edge Config：它为读优化，但写入经管理 API、容量小，不适合随时增删的链接。
- 新增平台时：有官方 TanStack Start 集成就用官方的，否则用 Nitro preset；只改 `vite.config.ts` 的 `targets` 表，数据库与 KV 尽量复用已有实现。

### 4.2 平台接口

运行时差异集中在 `src/server/platform/`。接口只覆盖已识别的真实差异，每个成员都必须有当前消费者：

| 成员               | 用途                                   | node                 | cloudflare         | edgeone                    | vercel            |
| ------------------ | -------------------------------------- | -------------------- | ------------------ | -------------------------- | ----------------- |
| `database`         | Better Auth 与业务数据                 | 本地 SQLite 或远程库 | `env.DB`（D1）     | libSQL HTTP 或 pg 连接池   | 同 edgeone        |
| `secret`           | `BETTER_AUTH_SECRET`                   | `process.env`        | Worker env         | `process.env`              | `process.env`     |
| `ipAddressHeaders` | 取客户端 IP（限流、会话记录）          | `x-forwarded-for`    | `cf-connecting-ip` | `eo-connecting-ip`         | `x-forwarded-for` |
| `kv`               | 跳转投影的读写，或 `null`              | Upstash 或 `null`    | `env.LINKS`        | 经 KV 桥接边缘函数（§4.3） | Upstash           |
| `sukiId`           | SUKI ID 地址、Client ID、Client Secret | `process.env`        | Worker env         | `process.env`              | `process.env`     |
| `adminEmails`      | 允许登录后台的邮箱（§6.2）             | `process.env`        | Worker env         | `process.env`              | `process.env`     |
| `analytics`        | 访问统计来源（§6.4）                   | `database`           | `cloudflare`       | `teo`                      | `database`        |

`kv` 的接口只有 `get`、`put`、`delete`、`list`（只返回键名，供重建边缘数据使用），值一律为字符串（JSON）。

`analytics` 为 `{ kind: 'teo' }`、`{ kind: 'cloudflare' }` 或 `{ kind: 'database', countryHeader, defer }`：`countryHeader` 是取访客国家的请求头（Vercel `x-vercel-ip-country`；Node 为 `null`，国家维度记为空）；`defer(promise)` 让计数写入在响应之后完成（Vercel 用 `@vercel/functions` 的 `waitUntil`；Node 进程常驻，直接不等待并只记录失败日志）。

- 环境变量在平台实现中用 Zod 校验一次。服务端路由与服务端函数在首次请求时动态导入 `#platform`（结果缓存），不在路由模块顶层静态导入：环境变量校验失败只让相关接口返回 500 并在日志留下 Zod 明细，页面仍正常渲染并显示 404 / 500 错误页；顶层静态导入会让一处失败拖垮整个路由树，所有请求都变成服务器默认的 JSON 错误。
- 业务代码只依赖平台接口，不 import `cloudflare:workers`、平台 SDK 或任何平台专有模块；平台实现文件以 `import '@tanstack/react-start/server-only'` 标记（`edgeone-edge.ts` 除外，见 §12.1）。
- 接口新增成员前，先说明哪个功能需要它、各平台的实现方式。

### 4.3 EdgeOne 的跳转与 KV 写入

EdgeOne KV 只能在边缘运行时（Edge Functions / 中间件，V8）访问，而 Nitro 产物是云函数（Node）。因此：

- **写入**：云函数（`server/platform/edgeone.ts`）经 KV 桥接边缘函数（源码在 `server/platform/edgeone-edge.ts`，由构建脚本打包，对外路径为保留路径 `/api/edge-kv`）执行 `get` / `put` / `delete` / `list`。桥接地址取自 `BETTER_AUTH_URL`，不从请求头推断；鉴权为 `Authorization: Bearer <由 BETTER_AUTH_SECRET 经 HKDF 派生的令牌>`，不复用管理员凭据。
- **跳转**：跳转必须在边缘直接读 KV，不能绕经云函数再回桥接（两跳，违背 KV 加速的目的）。候选方案由 P0 实测定稿：
  1. 边缘中间件 `middleware.js`：`matcher` 只匹配单段路径，保留路径与非法 slug 调 `next()` 交给云函数，其余读 KV 后直接响应；前提是中间件内可访问 KV 全局变量。
  2. 边缘函数动态路由 `edge-functions/[slug].js`：前提是它不会截获 `/dashboard` 等云函数路由与静态资源。
- 两种方案都由构建脚本把 §5 的跳转解析模块（`src/server/redirect.ts`，只用 Web 标准 API）打包为边缘运行时产物，与 TanStack 服务端路由共用同一份逻辑，不手写第二份。
- 边缘运行时从 `context.env` 读取 `BETTER_AUTH_SECRET`（派生密码访问 Cookie 的签名密钥）。

## 5. 跳转规则

跳转解析是纯函数模块 `src/server/redirect.ts`：输入请求、KV 记录（或数据库行映射成的同一结构）、站点设置与签名密钥，输出 `Response`。它不依赖 React、TanStack 或 Node 模块，四个平台与 EdgeOne 边缘运行时共用。

1. 只处理单段路径 `GET` / `HEAD /{slug}`。`decodeURIComponent` 后转小写；不符合 slug 规则（§6.1）或属于保留路径时不处理（交给路由的其他部分 / 404）。
2. 读取 `l_<slug>` 与 `c_site`（并行）。记录不存在 → `302` 到 `/not-found`。
3. `expiresAt` 已过 → `302` 到 `/expired`。
4. 设有密码且请求没有有效的访问 Cookie → `302` 到 `/password?slug=<slug>&q=<原查询串>`。
5. 需要确认（`confirm`）→ `302` 到 `/confirm?slug=<slug>&q=<原查询串>`。确认页经服务端函数按 slug 从数据库取目标地址展示，**目标地址不经 URL 参数传递**（`old` 的 `/confirm?target=` 可被用来伪造任意目标）。
6. 计算目标地址：`forwardQuery` 开启时把请求查询参数合并进目标地址（同名参数以请求为准），否则原样。
7. `cloaking` 开启 → `200` 返回只含全屏 iframe 的 HTML（目标地址转义，`Cache-Control: no-store`）；目标站点禁止被嵌入时由浏览器决定，不做探测。
8. 否则按设置的状态码（默认 `302`，可选 `301` / `307` / `308`）跳转。
9. 状态页跳转与 2–5 步一律 `Cache-Control: no-store`。`HEAD` 与 `GET` 结果相同但无正文。

**密码访问**：密码以 PBKDF2-SHA256（WebCrypto，盐与迭代次数写在摘要字符串里）存在数据库；KV 只存 `passwordRev`（摘要的短指纹），不存摘要。`/password` 页经服务端函数校验密码（读数据库，响应补齐到至少 1 秒），通过后设置 Cookie：名称 `sl_<slug>`，值为 `<到期时间>.<HMAC(派生密钥, slug | passwordRev | 到期时间)>`，`Path=/<slug>`、`HttpOnly`、`Secure`（https 时）、`SameSite=Lax`，有效期取设置（默认 1 小时）。修改或移除密码会改变 `passwordRev`，旧 Cookie 随之失效。

**根路径 `/`**：设置了主页地址时 `302` 到该地址；否则渲染站点首页（P2）。

## 6. 管理端

### 6.1 链接规则

- **slug**：只含小写字母与数字（`^[a-z0-9]{1,64}$`）；输入一律转小写（访问时不区分大小写），其他字符一律拒绝。留空时随机生成，字母表沿用 `old`（`23456789abcdefghjkmnpqrstuvwxyz`，去掉易混字符），默认长度取设置（默认 6），冲突时重新生成。
- **保留 slug**：`src/features/links/link-input.ts` 的 `RESERVED_SLUGS` 覆盖所有只含字母数字的顶层路由段（`api`、`dashboard`、`login`、`password`、`confirm`、`expired` 等）与构建产物顶层目录（如 `assets`）；测试从 `routeTree.gen.ts` 取全部顶层路由段，断言符合 slug 规则的都在保留表中（含连字符的如 `not-found` 天然不会冲突）。设置中可再追加保留词。
- **目标地址**：`http` / `https` 绝对地址，≤ 2048 字符。
- **过期时间**：创建与编辑时必须晚于当前时间；导入备份时允许已过期的值。
- **重命名 slug**：数据库更新 slug 后，KV 先 `put` 新键、再 `delete` 旧键。

### 6.2 认证

后台**只能经 SUKI ID（suki-auth 的 OIDC Provider）登录**，没有密码、注册或初始化页。访客访问短链不需要登录。

- **服务端**：Better Auth 只启用 `genericOAuth`（`emailAndPassword` 关闭），提供商 `providerId: 'suki-id'`，`discoveryUrl` 为 `<SUKI_ID_URL>/api/auth/.well-known/openid-configuration`，`pkce: true`（suki-auth 强制 S256），`scopes: ['openid', 'profile', 'email']`。回调地址 `<BETTER_AUTH_URL>/api/auth/oauth2/callback/suki-id`，需在 SUKI ID 后台的 OIDC 客户端里登记。
- **浏览器端**：统一用 `src/lib/auth-client.ts` 的 `authClient`（`genericOAuthClient()` 插件），登录调用 `authClient.signIn.oauth2({ providerId: 'suki-id', callbackURL })`，退出调用 `authClient.signOut()`；不在组件里拼接 `/api/auth/*` 请求。
- **授权**：SUKI ID 上的任何用户都能完成认证，因此后台另设邮箱白名单 `ADMIN_EMAILS`（逗号分隔）：`databaseHooks.user.create.before` 拒绝白名单外的邮箱建号（回调经 `?error=` 回到登录页）；`adminMiddleware` 每次请求再核对会话用户邮箱仍在白名单内，移出白名单立即失效。
- **登录守卫**：`/dashboard` 的 `beforeLoad` 经 TanStack Query 读取会话（写法同 suki-auth `_workspace`），未登录时 `redirect({ to: '/login', search: { redirect } })`；回跳只接受站内相对路径。
- **挂载**：Handler 在文件路由 `src/routes/api/auth/$.ts`，GET/POST 都转发给 `auth.handler(request)`。`src/lib/auth.ts` 只导出 `createAuth(platform)`；共用的懒加载实例在 `src/server/auth.ts`（`getAuth`），认证路由与服务端函数都从这里取。
- **站点地址**：由 Better Auth 从 `BETTER_AUTH_URL` 读取，它决定回调地址，https 时启用 `__Secure-` 前缀与 `Secure` Cookie。每个部署都必须设置。
- **插件按需启用**：未被功能实际使用的插件不注册（当前只有 `genericOAuth` 与 `tanstackStartCookies`）。
- 会话、限流存数据库（`rateLimit` 表），不配置 `secondaryStorage`，**不把认证数据放进 KV**。

### 6.3 服务端函数

- 后台数据接口一律是 `createServerFn`（`src/features/<domain>/*.functions.ts`），挂 `adminMiddleware` 逐请求校验会话；共用的服务端逻辑放 `src/server/`。规则同 suki-auth §4：`*.functions.ts` 只放 `createServerFn`。
- 链接：列表（SQL 搜索 slug / 地址 / 备注，排序最新 / 最早 / slug，游标分页）、读取、创建、编辑、删除。
- 导入导出（备份）：格式见 DATA.md §4，只认本项目自己的格式；导入由前端分块提交（每块 ≤ 100 条），已存在的 slug 跳过并在结果中列出。
- 设置：读写 `setting` 表；影响跳转的设置写入后同步 `c_site`。
- 访问统计：见 §6.4。
- 重建边缘数据：见 §3。
- 业务错误由函数以 `{ error }` 返回，前端经 `serverCall` 统一处理（写法同 suki-auth）。
- 不提供对外的 REST API；后台数据只经服务端函数读写。

### 6.4 访问统计

每个部署只用一种统计来源，由平台决定（2026-11-23 用户决定）：EdgeOne 与 Cloudflare 只用平台原生统计，本项目不记录；Vercel 与 Node 由本项目写数据库计数。后台统计页对三种来源用同一套界面，服务端函数返回同一结构。

**共同口径**

- 时间范围：最近 24 小时（按小时）、7 天、30 天（按天）；最长 30 天（与平台原生统计的单次查询上限一致）。
- 内容：访问总数与时序；国家 / 地区、来源（Referer 主机，直接访问记为空）、设备类型、浏览器、操作系统的 Top 10；全站视图另有“访问最多的链接” Top 10（只保留数据库中存在的 slug，一次 SQL 查询，不扫 KV）。
- 可按 slug 查看单条链接（路径等于 `/<slug>`）；链接行菜单“统计”跳到统计页并带上该 slug。
- 统计服务端函数挂 `adminMiddleware`；上游报错以 `{ error }` 返回，不含凭据。
- 三种来源计的都是请求次数，包含爬虫，不区分独立访客；界面不做换算。

**EdgeOne：TEO**（沿用 `old` 的做法，参考 `git show old:src/server/monitoring.ts` 与 `old:src/app/api/monitoring/**`）

- 凭据：设置页填写 SecretId、SecretKey、地域（默认 `ap-guangzhou`）、站点 ZoneId（留空时自动选 Pages 默认站点 `default-pages-zone`）与云函数名（可选），存 `setting.teo`。
- 域名过滤固定为 `BETTER_AUTH_URL` 的主机名；单链接用 `url` 等于 `/<slug>` 过滤。
- 另有 EdgeOne 附加面板：七层流量与带宽、安全拦截、云函数请求与 CPU 耗时、Pages 构建次数与云函数月度统计。
- 官方 SDK 在 EdgeOne 云函数中运行；能否在其他目标运行不再需要（统计来源按平台固定）。

**Cloudflare：GraphQL Analytics API**

- 数据集 `httpRequestsAdaptiveGroups`（所有套餐可用，免费版至少保留 31 天、单次最多查 30 天；自适应采样，计数为估算值）。过滤 `clientRequestHTTPHost` 等于 `BETTER_AUTH_URL` 的主机名、`requestSource: "eyeball"`，单链接加 `clientRequestPath` 等于 `/<slug>`；分组维度 `datetimeHour` / `date`、`clientCountryName`、`clientRefererHost`、`clientDeviceType`、`userAgentBrowser`、`userAgentOS`、`clientRequestPath`。
- 前提：Worker 绑定在 Cloudflare 托管的自定义域名上（`workers.dev` 没有区域统计）。
- 凭据：设置页填写 Zone ID 与 API Token（只需 Zone Analytics Read 权限），存 `setting.cloudflare`。
- 请求用 `fetch` 直接调用 `https://api.cloudflare.com/client/v4/graphql`，不引入 SDK。

**Vercel / Node：数据库计数**

- 只在跳转成功（§5 第 7、8 步）且方法为 `GET` 时计一次；状态页跳转与 `HEAD` 不计。
- 跳转先返回响应，计数经 `platform.analytics.defer` 在响应之后写入，不阻塞跳转；写入失败只记日志。
- 一次访问写两条语句：`visitHour` 按（链接 ID、小时）累加，`visitDay` 按（链接 ID、日期、维度、值）累加国家、来源、设备、浏览器、系统五个维度；都用 `INSERT … ON CONFLICT DO UPDATE SET count = count + 1`（SQLite 系列与 PostgreSQL 通用）。设备、浏览器、系统由服务端解析 User-Agent 得到。表结构见 DATA.md §1.3。
- 计数按链接 ID 记录，重命名 slug 不影响历史；删除链接时一并删除其计数行。为此 KV 跳转记录带链接 `id`（DATA.md §2.2）。
- 不设定时清理；查询只读最近 30 天。

**凭据存储**（TEO SecretKey、Cloudflare API Token）：用 Better Auth 的 `symmetricEncrypt`（密钥派生自 `BETTER_AUTH_SECRET`）认证加密，只写不读（界面只显示“已设置”，留空即保留），写法同 suki-auth 的机密配置。设置页只显示当前平台对应的那组凭据；未配置时统计页显示空状态。

## 7. 必须保留的业务不变量

1. **数据库优先**：数据库是事实来源；任何 KV 内容都必须能由数据库完整重建。KV 中不存在数据库没有的信息。
2. **跳转只读 KV**：有 KV 的平台上跳转在返回响应前不访问数据库（密码校验与确认页除外，它们是低频的独立请求）；Vercel / Node 的访问计数在响应之后写入（§6.4）。
3. **凭据存储**：链接密码只存 PBKDF2 摘要，KV 中只有指纹；日志、错误响应、URL 中不出现明文密码。
4. **访客防护**：确认页的目标地址只来自数据库；跳转的状态页参数只有 slug 与原查询串；cloaking 页面对目标地址做 HTML 转义。
5. **权限**：所有后台读写由服务端逐请求校验管理员会话且邮箱在 `ADMIN_EMAILS` 内，前端隐藏不算防护。
6. **机密**：TEO SecretKey 与 Cloudflare API Token 只以认证加密形式存库，任何接口都不返回明文。

## 8. 简洁实现与代码审核

- 不为极低概率的边界或并发假设增加防御代码；确需增加时，先说明触发场景、发生概率及影响，取得用户确认后再实现。
- 外部数据在所属边界集中校验一次，内部传递已验证类型，不对同一数据逐层重复校验。
- 单次使用且没有独立职责的逻辑就近内联；不提前创建无实际复用的 helper、服务或抽象层。
- 以单函数清晰表达为优先，不添加非必要错误捕获、备用路径、状态或锁。保留真实外部协议要求及已有实际并发所有者所需的处理；修复前先说明证据。
- 审核旧代码时删除重复校验、无意义转发和无实际用途的结构，不把理论风险作为扩展范围的理由。
- 上述规则也适用于基础设施：仅为实际平台差异及已识别的资源职责设置接口，不构建推测性的插件框架或尚无消费者的服务体系。
- 优先使用官方 CLI、官方集成与官方技能给出的写法，不手写可由官方工具生成的骨架。
- 引入 CLI add-on 一律运行官方 CLI（`pnpm dlx @tanstack/cli add <add-on>`），即使它要改写很多文件也照常执行，不改为手写仿制或自行封装：先提交或暂存（CLI 要求工作区干净），执行后保留 add-on 新增的集成文件、依赖与 `.cta.json` 记录，把它的接入点（如 `router.tsx`、`__root.tsx`）合并进项目现有写法，其余被模板覆盖的文件（示例页面、`.gitignore`、配置等）恢复原样。

## 9. P2 前端范围

页面覆盖 `old` 的全部用户可见功能，交互与信息结构按 DESIGN.md 重新设计：

- **访客**：密码页 `/password`、确认页 `/confirm`、`/expired`、`/not-found`、站点首页 `/`
- **认证**：登录 `/login`（只有“使用 SUKI ID 登录”一个操作，回调失败经 `?error=` 提示一次）
- **后台**（`/dashboard`）：链接列表（搜索、排序、滚动加载）、创建 / 编辑弹窗（slug 随机生成、过期时间、密码、确认、遮蔽、查询参数透传）、复制短链与二维码、删除确认；导入导出；统计（§6.4，时间范围切换、按 slug 筛选、时序图、地区分布、Top 列表，EdgeOne 另有附加面板）；设置（跳转状态码、主页地址、默认 slug 长度、追加保留词、密码访问有效期、统计凭据、重建边缘数据）

## 10. 技能

修改前先加载匹配的技能，按其指导实现：

- **TanStack**（随 node_modules 版本锁定）：`pnpm exec intent list` 查看，`pnpm exec intent load <package>#<skill>` 加载。常用：`@tanstack/start-client-core#start-core/deployment`、`#start-core/server-routes`、`#start-core/execution-model`、`@tanstack/react-router#compositions/router-query`。
- **Better Auth**：`.claude/skills/better-auth-best-practices`、`create-auth`、`better-auth-security-best-practices`。
- **Cloudflare**：`.claude/skills/wrangler`、`workers-best-practices`、`frameworks-on-cloudflare`。
- **EdgeOne**：用户级技能 `edgeone-makers-tools`（KV、边缘函数、中间件、CLI）。
- **UI**：`.claude/skills/ui-ux-pro-max`（设计风格）、`.claude/skills/shadcn`（组件选用与组合）。
- 第三方技能的来源见 `.claude/skills/SOURCES.md`。技能与官方文档冲突时，以已安装版本的实际行为为准，并在 TODO.md 记录。

## 11. 前端任务额外要求

- 优先从 `ui-ux-pro-max` 选择最合适的设计风格，再根据该技能制作前端页面；未安装时先查找并安装，读取后再设计。
- 需要图标时统一使用 **Lucide**。品牌标识使用本地 SVG 资产，它是品牌资产，不算图标。
- 视觉风格为 Vercel 的 Geist 设计语言，后台结构对标 Vercel 控制台（2026-11-23 用户决定）：近白画布与近黑墨色、1px 细线承担全部结构、Geist Sans / Geist Mono、公开页的网格渐变是唯一装饰。设计品质对标 Vercel 官网与控制台本身，细节以 DESIGN.md 为准。
- 公开页（首页、登录、访客页）与后台是两种界面：公开页用居中大标题 + 胶囊按钮，后台是左侧可折叠侧边栏（shadcn `Sidebar`）+ 顶栏面包屑的控制台，用 6px 方角控件，二者不混用。
- 绝对禁止在前端页面填入任何描述性文本、解释性副标题、引导性小字。
- 绝对禁止在前端页面使用包含“不是”的转折句子。
- 页面仍须保留操作必要的准确名称、输入标签、状态和错误反馈，以及可访问性、键盘操作和减少动画支持；不得借此添加被禁止的说明文案。

补充约定：

- 不跳过 DESIGN.md；新增组件先在 DESIGN.md 定义 token 与尺寸，再实现。
- 组件一律优先使用 shadcn 官方组件，改动前加载 `.claude/skills/shadcn` 技能，按其组合规则实现（如菜单项包进 `DropdownMenuGroup`、按钮图标加 `data-icon`、破坏性确认用 `AlertDialog`）。风格为 `radix-luma`（`components.json`），组件按 DESIGN.md 就地改样式；`styles.css` 必须 `@import 'shadcn/tailwind.css'`，它提供 `data-open`、`data-active`、`data-horizontal` 等组件依赖的变体。
- 复用 `src/components/ui` 中的基础组件，不在页面中复制基础组件。新增组件用 `pnpm dlx shadcn@latest add <name>`；不要运行 `shadcn init`（它会按 RSC/Next 默认值改写配置）。当前 shadcn CLI 会把 `cn` 写成 `from "cn"`，添加后改为 `from '#/lib/utils'`，并确认未引入 `cn`、`next-themes` 等多余依赖。`src/lib/utils.ts` 保持官方原版，不向 tailwind-merge 注册自定义类。
- shadcn 语义类名与 DESIGN.md token 的映射见 DESIGN.md「Implementation mapping」；DESIGN.md 的 `muted` 是文字色，对应 `text-muted-foreground`。
- 字号用 `styles.css` 的 `type-*` 工具类（`type-title-lg`、`type-body-sm`、`type-label`、`type-mono` 等），不覆盖 `--text-*` 主题键；新增字号时同样定义为 `@utility type-*`。
- 表单字段一律用官方组合：`<Field data-invalid>` + `<FieldLabel htmlFor>` + `<Input id aria-invalid aria-describedby>` + `<FieldError id>`。标签位于输入框上方（不用浮动标签）；带前缀的输入（slug）与密码框用 InputGroup 组合。不另建字段包装组件。
- `src/components/` 只放 shadcn 的 `ui/`，项目组件按业务域放进 `src/features/`。弹窗的标题区与底部操作条按 DESIGN.md「dialog」写成共用组件；每屏只有一个主操作按钮。细线、阴影等样式直接写在组件类名里（`border-border`、`shadow-floating` 等），不另设类名常量文件。可复用的逻辑（会话、主题、`serverCall`、motion 写法）参照 suki-auth `src/features/` 的同职责实现，视觉按本项目 DESIGN.md 重做。
- 主题：默认跟随系统，`<html data-theme>` 固定浅 / 深色（选择存 localStorage，`ScriptOnce` 在首帧前应用）；`dark:` 变体在 `styles.css` 中按同一规则重定义。
- 动效克制：按钮与卡片悬停只改变颜色、边框与投影，不位移、不跟随指针。
- 动画一律用 `motion`（`motion/react`），通用写法在 `src/lib/motion.tsx`：入场 `rise()`；区域内容切换 `Crossfade`（骨架屏 / 错误 / 空状态 / 数据交叉淡入；传 `index` 时按选项顺序左右滑动）；多步切换 `StepSwap`（传全部步骤的 `order`，后退反向）；左右切换的移动距离用 `distance` 显式指定（取值见 DESIGN.md「Motion」），位移用弹簧走完整段、透明度 200ms 内到位，不要让位移与透明度共用一条前冲的缓动；就地展开 `Expand`。切换一律用 `AnimatePresence mode="popLayout"` + `custom` 方向，容器高度跟随新内容。分段控件面板（`ui/tabs.tsx`）由 `Tabs` 记录选中项与方向，`TabsContent` 按 Radix 官方 `forceMount` 用法交给 AnimatePresence。面板不能是 `flex-1`（纵向 flex 里会让高度过渡失效）。`rise()` 在路由 View Transition 进行中不播放。后台页面切换用路由原生 View Transitions（`router.tsx` 的 `defaultViewTransition`，150ms 淡入淡出，动画在 `styles.css`），这是 `styles.css` 中唯一自定义的 `@keyframes`；不要用克隆 DOM 等方式模拟退场。弹窗的流程状态（步骤、编辑态）放在 `DialogContent` 内的组件里，关闭后随内容卸载、下次打开从头开始，不在关闭时重置。CSS 只另外保留状态颜色过渡、按钮按压缩放与 shadcn 组件自带的动画。减少动画由根路由 `<MotionConfig reducedMotion="user">` 统一处理。跳过首屏动画用 `useFirstRender()`，不要用 `<AnimatePresence initial={false}>`：它会经上下文跳过首个子项内部所有之后挂载的 motion 入场动画。
- 页面导航用 Router 的 `Link` / `useNavigate`；每个页面是独立路由，不用查询参数切换页面内容。
- 服务端数据缓存用 TanStack Query（官方 CLI add-on `tanstack-query`：`getContext` 每次 `getRouter` 新建 `QueryClient`，`router.tsx` 调用 `setupRouterSsrQueryIntegration`），不手写缓存。带 loader 的页面在路由文件定义 `queryOptions`，loader 用 `ensureQueryData({ ..., revalidateIfStale: true })`（有缓存时立即切换、后台刷新，首次访问才等待并显示骨架），组件用 `useSuspenseQuery` 读取；写入后用 `queryClient.invalidateQueries({ queryKey })` 刷新，不用 `router.invalidate()`。
- 浏览器验收：`/tmp` 下的 Playwright 截图脚本不入库；验收矩阵为 390 / 820 / 1280 / 1600px × 浅色 / 深色，并检查横向溢出与减少动画。
- 错误展示：能映射到表单字段的错误在字段旁内联显示；其余错误只通过 toast 显示一次；同一错误不在多处重复出现。
- 输入校验：每个输入框提交前都在前端校验并在字段旁提示，规则与服务端一致。通用规则在 `src/lib/validation.ts`；某个表单与服务端共用的规则放在功能域的 `*-input.ts`，或直接用服务端同一份 Zod 定义 `safeParse`。
- 组件里调用写入类服务端函数一律经 `serverCall`（`src/lib/server-call.ts`）：业务错误由函数以 `{ error }` 返回；请求被拒绝（输入校验、权限、网络）时统一提示一次并返回 `null`，调用方据此复位忙碌状态。路由 loader 的调用交给路由错误页。
- 字体全部自托管，页面不请求第三方字体或 CDN（CSP 与中国大陆访问都需要）。
- 渲染外部内容前必须清洗，不渲染未清洗的 HTML。

## 12. 目录结构

与 suki-auth 相同的分层：`routes/` 只放路由，`features/<domain>/` 放业务域的组件与服务端函数，`lib/` 放前后端共用与配置，`server/` 放服务端逻辑与平台层。同名文件职责与 suki-auth 一致，实现时先读它的对应文件。

```
src/
  routes/
    __root.tsx              # 文档壳、404/500、Toaster、TooltipProvider（Devtools 仅开发显示，位于左下）
    index.tsx               # 根路径：设置了主页地址时跳转，否则站点首页
    $slug.ts                # 跳转服务端路由（调用 server/redirect.ts）
    password | confirm | expired | not-found.tsx   # 访客页
    login.tsx               # 只有 SUKI ID 登录
    dashboard.tsx           # 后台布局：会话校验 + ConsoleShell（对应 suki-auth 的 _workspace.tsx）
    dashboard/index.tsx     # 链接
    dashboard/analytics.tsx | settings.tsx
    api/auth/$.ts           # Better Auth handler
  components/ui/            # 只放 shadcn 组件（按 DESIGN.md 就地改样式）
  features/
    auth/                   # session.functions.ts（getSession、adminMiddleware）、redirect.ts（站内回跳）、error-view.tsx
    workspace/              # ConsoleShell（shadcn Sidebar 侧边栏 + 顶栏面包屑）、命令菜单、PageHeader、弹窗标题与操作条、theme、page-transition
    links/                  # links.functions.ts、link-input.ts（slug 规则、保留表、表单与服务端共用 Zod）、链接列表与弹窗、二维码、导入导出
    visitor/                # visitor.functions.ts（密码校验、确认页目标）、公开页组件、mesh-gradient.tsx（公开页共用）
    analytics/              # analytics.functions.ts、时序图、地图与 Top 列表、EdgeOne 附加面板
    settings/               # settings.functions.ts、settings-input.ts、settings-form.tsx
  lib/
    auth.ts                 # createAuth(platform)：Better Auth 配置（server-only）
    auth-client.ts          # Better Auth 浏览器 client（genericOAuthClient）
    schema.ts               # 自有表插件（link、setting）
    validation.ts           # 通用输入规则
    server-call.ts          # 写入类服务端函数的统一调用
    motion.tsx              # 动效 token、variants 与通用动效
    utils.ts                # shadcn 官方原版
  server/
    auth.ts                 # getAuth / getPlatform：懒加载 auth 实例与平台
    config.ts               # setting 读写、统计凭据加解密、c_site 同步
    links.ts                # 链接数据层 + KV 同步（DATA.md §3）
    redirect.ts             # 跳转解析、密码摘要、访问 Cookie 签名（只用 Web 标准 API，见 §12.1）
    analytics/              # teo.ts | cloudflare.ts | database.ts（三种统计来源，返回同一结构；database.ts 含计数写入）
    platform/
      types.ts              # Platform 接口
      node.ts | cloudflare.ts | remote.ts（Vercel）| edgeone.ts（远程库 + EdgeOne IP 头 + KV 桥接）
      remote-database.ts | libsql-dialect.ts   # 远程库（复用 suki-auth 实现）
      upstash.ts            # Upstash KV（node 可选、vercel）
      edgeone-edge.ts       # EdgeOne 边缘源码：KV 桥接与 §4.3 选定的跳转入口（构建脚本打包）
  integrations/             # 官方 CLI add-on 生成的集成（tanstack-query）
  styles.css                # Tailwind 入口与 DESIGN.md token
  router.tsx
  routeTree.gen.ts          # 自动生成，不手工编辑
public/favicon.svg          # 网站图标
migrations/0001_initial.sql # SQLite 系列初始表结构
migrations/postgres/0001_initial.sql # PostgreSQL 初始表结构
scripts/
  migrate.mjs               # 按 DATABASE_URL 或 DATABASE_PATH 初始化数据库（同 suki-auth）
  build-edgeone-edge.mjs    # 打包 edgeone-edge.ts 到 EdgeOne 要求的位置（P0 实测确定，生成物不入库）
test/                       # Vitest
.claude/skills/             # 第三方技能（来源见 SOURCES.md）
wrangler.jsonc | worker-configuration.d.ts   # Cloudflare（D1 DB、KV LINKS）
edgeone.json | vercel.json  # 各平台构建命令
.env.example | .dev.vars.example
components.json | vitest.config.ts | vite.config.ts | tsr.config.json
```

### 12.1 代码组织

- 服务端函数文件（`*.functions.ts`）只放 `createServerFn`：它会被客户端代码导入，构建时只剥离处理函数体；在其中再定义引用服务端模块的普通函数会把 `server-only` 模块带进客户端包而构建失败，共用的服务端逻辑放 `src/server/`。
- `src/server/` 与 `src/lib/auth.ts` 的文件以 `import '@tanstack/react-start/server-only'` 标记。例外是 `server/redirect.ts` 与 `server/platform/edgeone-edge.ts`：它们还要打包进 EdgeOne 边缘运行时，只能依赖 Web 标准 API 与彼此，不 import TanStack、Better Auth、Node 模块或其他 `server/` 文件。
- 按功能域组织（`src/features/<domain>/`、`src/components/ui/`），不设 `admin` 命名空间目录；权限在服务端逐请求校验。
- 表结构变更：用 Better Auth CLI 生成 SQL 并更新 `0001_initial.sql`，同步生成 PostgreSQL 迁移；SQLite 迁移必须能在 `node:sqlite`、D1、libSQL 上执行。

## 13. 常用命令

```bash
pnpm install
pnpm dev                      # Node 目标开发（读取 .env.local）
pnpm dev:cloudflare           # Cloudflare 目标开发（workerd + 本地 D1 / KV）
pnpm dev:edgeone              # EdgeOne 本地开发（edgeone makers dev）
pnpm db:migrate:node
pnpm db:migrate:cloudflare --local   # 或 --remote
pnpm build:node | build:cloudflare | build:edgeone | build:vercel
pnpm typecheck && pnpm test && pnpm lint && pnpm check
```

## 14. 完成标准

任何代码变更至少执行 `pnpm typecheck`、`pnpm test`、`pnpm lint`、`pnpm check`，并构建受影响的部署目标（涉及平台层、跳转模块或依赖时四个目标全部构建）。

- 测试实际调用目标操作，并验证结果及持久状态（数据库与 KV 内存实现）。
- 跳转解析对 §5 每一步都有测试。
- 没有调试日志、临时密钥或跳过的校验。
- 汇报时写清实际验证了什么、没有验证什么；本地模拟的平台运行不等同于真实平台部署验证；未在浏览器中核对的视觉效果，不得声称已完成视觉验证。
- 响应式验收宽度固定为 390 / 820 / 1280 / 1600px。
- 不修改与任务无关的文件。

## 15. 文档规则

- 文档只描述当前标准，不内嵌待办与变更记录；待办统一放在 `TODO.md`。
- 代码、接口或数据结构变更时，同步更新本文件、DATA.md、README.md 及 DESIGN.md。
- 用户做出的决定在对应条目后注明日期（如“2026-11-23 用户决定”）。

## 16. 禁止事项

- 使用 npm、npx、yarn。
- 业务代码直接依赖平台专有模块。
- 把 KV 当作事实来源，或在 KV 中保存数据库没有的信息；在 KV 中做计数、索引或认证数据；配置 Better Auth `secondaryStorage`。
- 跳转路径在有 KV 的平台上查询数据库。
- 引入 Cron / 定时任务、队列或后台写入；唯一例外是 Vercel / Node 的访问计数经 `platform.analytics.defer` 在响应后写入（§6.4）。
- 擅自替换 §4.1 约定的平台构建集成。
- 写只能在 `node:sqlite`、D1、libSQL 其中一方运行的 SQL；引入带原生模块的数据库驱动。
- 为“方便”削弱 §7 的任一不变量；遇到这种情况必须停止并向用户说明风险。
- 手写 OAuth / OIDC 客户端、JWT 签名或校验来替代 Better Auth。
- 明文存储链接密码、TEO SecretKey 或 Cloudflare API Token；经 URL 参数传递跳转目标。
- 在 EdgeOne / Cloudflare 上自行记录访问。
- 增加 SUKI ID 以外的登录方式；提供对外 REST API。
- 提交 `.env.local`、`.dev.vars` 或任何真实密钥。
- 未经用户确认就进入下一阶段。
- 部署前未验证；声称已通过真实回调或生产验证但实际没有做。
