# Suki-Link

Suki-Link 是一个部署在 EdgeOne Pages 上的短链接管理工具。它使用 Next.js App Router 构建后台界面，通过 EdgeOne Pages Edge Functions 访问 KV 存储，并可接入腾讯云 EdgeOne TEO 监控数据。

## 功能

- 短链接创建、编辑、删除、搜索和自动分页加载
- 自定义 slug，数据键使用 `link_{slug}`，重复 slug 会自动冲突
- 访问密码、确认跳转、query 透传和遮蔽跳转
- JSON 导入导出，导出会自动分页读取全部短链，重复 slug 导入时跳过
- 后台管理页：`/dashboard`
- 短链状态页：`/not-found`、`/expired`、`/confirm`
- EdgeOne TEO 监控页，支持按短链 slug 筛选

## 技术栈

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- shadcn/ui 风格组件
- EdgeOne Pages KV
- Tencent Cloud EdgeOne TEO SDK

## 本地开发

安装依赖：

```bash
pnpm install
```

普通 Next.js 开发：

```bash
pnpm dev
```

EdgeOne Pages 本地开发：

```bash
pnpm run eo
```

EdgeOne 开发服务默认运行在：

```text
http://localhost:8088
```

## 环境变量

核心配置：

```env
SUKI_SITE_PASSWORD=your-password
SUKI_PUBLIC_ORIGIN=suki.icu
SUKI_HOME_URL=blog.suki.icu
SUKI_REDIRECT_STATUS_CODE=301
SUKI_KV_BINDING=link_kv
```

短链配置：

```env
SUKI_KV_BATCH_LIMIT=50
SUKI_KV_LIST_MAX=256
SUKI_LINK_CACHE_TTL=
SUKI_CASE_SENSITIVE_SLUG=
SUKI_SLUG_DEFAULT_LENGTH=6
SUKI_SLUG_REGEX=
SUKI_RESERVE_SLUGS=api,dashboard,password,not-found,expired,confirm,index,_next,robots.txt,favicon.ico,logo.svg,logo-dark.svg
```

监控配置：

```env
SUKI_TEO_SECRET_ID=
SUKI_TEO_SECRET_KEY=
SUKI_TEO_REGION=ap-guangzhou
SUKI_TEO_FUNCTION_NAME=
SUKI_TEO_FUNCTION_NAME_FILTER_KEY=functionName
```

## EdgeOne KV

EdgeOne Pages 的 KV 只能在 Edge Functions 中直接访问，所以项目使用：

```text
edge-functions/api/suki-kv.js
```

Next.js 服务端通过 `/api/suki-kv` 桥接 KV 操作。KV 绑定变量名由 `SUKI_KV_BINDING` 指定，默认是 `link_kv`。

短链数据存储键格式：

```text
link_{slug}
```

## API

OpenAPI 文档位于：

```text
openapi.json
```

后台 API 使用 Bearer Token：

```http
Authorization: Bearer <token>
```

登录接口：

```http
POST /api/auth/login
```

短链接口：

```http
GET    /api/links
POST   /api/links
GET    /api/links/{slug}
PUT    /api/links/{slug}
DELETE /api/links/{slug}
POST   /api/links/{slug}/password
GET    /api/links/export
POST   /api/links/import
```

监控接口：

```http
GET /api/monitoring/zones
GET /api/monitoring/traffic
GET /api/monitoring/pages/build-count
GET /api/monitoring/pages/cloud-function-requests
GET /api/monitoring/pages/cloud-function-monthly-stats
```

## 脚本

```bash
pnpm lint
pnpm build
pnpm start
```

## 项目结构

```text
src/app                 App Router 页面和 API
src/app/dashboard       后台页面
src/app/api             后台 API
src/components          UI 和业务组件
src/lib                 前端工具
src/server              服务端业务逻辑
edge-functions/api      EdgeOne Pages Edge Functions
openapi.json            API 文档
```
