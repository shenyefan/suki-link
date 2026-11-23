# SUKI Link

边缘短链系统（重建分支，实现中）。基于 TanStack Start，同一套代码可部署到 Node 服务器、Cloudflare、EdgeOne Pages 或 Vercel：链接与设置存数据库，跳转只读 KV。协作规范见 [CLAUDE.md](CLAUDE.md)，设计规范见 [DESIGN.md](DESIGN.md)，数据契约见 [DATA.md](DATA.md)，进度见 [TODO.md](TODO.md)。

## 功能

- 短链创建、编辑、删除、搜索；自定义或随机 slug（小写字母与数字）
- 访问密码、跳转前确认、遮蔽跳转、查询参数透传、过期时间
- JSON 导入导出（备份）
- 访问统计（可按短链筛选）：EdgeOne 用 TEO、Cloudflare 用 GraphQL Analytics，Vercel / Node 由数据库计数
- 后台只能经 SUKI ID（OIDC）登录
- 跳转在边缘读取 KV；数据库为唯一事实来源，可随时重建边缘数据

## 部署目标

| 目标          | 构建命令                | 数据库              | KV                                       |
| ------------- | ----------------------- | ------------------- | ---------------------------------------- |
| Node 服务器   | `pnpm build:node`       | SQLite 文件或远程库 | 可选 Upstash Redis；不配置时跳转读数据库 |
| Cloudflare    | `pnpm build:cloudflare` | D1（绑定 `DB`）     | Workers KV（绑定 `LINKS`）               |
| EdgeOne Pages | `pnpm build:edgeone`    | libSQL / PostgreSQL | EdgeOne KV（变量名 `links_kv`）          |
| Vercel        | `pnpm build:vercel`     | libSQL / PostgreSQL | Upstash Redis（Vercel Marketplace）      |

## 环境变量

| 变量                                         | 说明                                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_URL`                            | 对外访问的完整地址，如 `https://s.example.com`                                                       |
| `BETTER_AUTH_SECRET`                         | 至少 32 个字符，`openssl rand -base64 32` 生成                                                       |
| `DATABASE_URL`                               | 远程库：`postgresql://…`、`libsql://…` 或 `https://…`                                                |
| `LIBSQL_AUTH_TOKEN`                          | libSQL 需要鉴权时填写                                                                                |
| `DATABASE_PATH`                              | Node 本地 SQLite 文件路径（未设置 `DATABASE_URL` 时使用）                                            |
| `KV_REST_API_URL`、`KV_REST_API_TOKEN`       | Upstash Redis（Vercel 必需，Node 可选）                                                              |
| `SUKI_ID_URL`                                | SUKI ID 站点地址，如 `https://id.example.com`                                                        |
| `SUKI_ID_CLIENT_ID`、`SUKI_ID_CLIENT_SECRET` | 在 SUKI ID 后台添加 OIDC 客户端取得；回调地址填 `<BETTER_AUTH_URL>/api/auth/oauth2/callback/suki-id` |
| `ADMIN_EMAILS`                               | 允许登录后台的 SUKI ID 邮箱，逗号分隔                                                                |

## 本地开发

需要 Node.js ≥ 24 与 pnpm。

```bash
pnpm install
pnpm dev
```

统计凭据（EdgeOne 的 TEO SecretId / SecretKey，Cloudflare 的 Zone ID / API Token，后者只需 Zone Analytics Read 权限）在后台设置页填写并加密存库，不使用环境变量。Cloudflare 统计要求 Worker 绑定在 Cloudflare 托管的自定义域名上。各平台的部署步骤在 P0 完成后补充。
