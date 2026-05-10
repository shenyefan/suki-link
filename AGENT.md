# Suki-Link Agent Notes

这份文档给后续维护项目的代码助手使用。

## 基本规则

- 这是 Next.js 16 项目。动 App Router、Route Handler、Proxy、动态路由前，先看 `node_modules/next/dist/docs/` 里的对应文档。
- 优先用 `rg` 查文件和文本。
- 手工改文件用 `apply_patch`。
- 不要改 `.env` 里的真实密钥，不要在文档里写入真实密钥。
- 不要随便改后端 API 和 server 逻辑，除非任务明确要求。
- 项目主要部署在 EdgeOne Pages，本地完整调试优先使用 `pnpm run eo`。

## 路由约定

- 后台页面统一使用 `/dashboard`，不要再引入 `/manage`。
- 后台登录页是 `/dashboard/login`。
- 短链访问密码页是 `/password`。
- 短链状态页统一使用 `/status/[kind]`。
- 不要恢复旧的 `/link-status/[kind]`。

## KV 约定

- EdgeOne KV 只能在 Edge Functions 中直接操作。
- KV 桥接文件是 `edge-functions/api/suki-kv.js`。
- Next.js 侧通过 `src/server/kv.ts` 调用 `/api/suki-kv`。
- KV 绑定名称通过 `SUKI_KV_BINDING` 指定，默认 `link_kv`。
- 短链数据键格式是 `link_{slug}`。
- 列表接口读取 KV list 的 value，列表页不应该再逐条 get。
- 单个短链查询、跳转和密码校验仍然需要 get。

## API 约定

- 所有业务响应都走 `src/server/response.ts`：
  - 成功：`{ code: 200, data, message }`
  - 失败：`{ code, data, message }`
- 错误提示使用中文，不要加无意义空格。
- 后台 API 使用 `Authorization: Bearer <token>`。
- 登录 token 是基于管理密码生成的 bcrypt hash，不是 JWT。
- 密码短链验证接口是 `/api/links/{slug}/password`，不要写成 `/verify-password`。
- 创建和编辑短链时，`expiration` 必须是未来时间。
- 导入短链时允许历史 `expiration`，用于兼容旧导出数据。

## 前端约定

- 后台整体风格跟 shadcn-admin 保持一致。
- 侧边栏、header、主内容区域要使用现有布局组件，不要另起一套视觉系统。
- 短链卡片布局要紧凑，状态只显示图标并配 tooltip。
- 监控地图滚轮缩放时不要带动页面滚动。
- 没有数据时显示“暂无数据”，不要一直显示骨架屏。

## 文档约定

- API 变动后同步更新 `openapi.json`。
- README 写项目真实用法，不要保留 create-next-app 默认说明。
- 如果新增重要维护规则，同步更新本文件。

## 校验

常规改动后运行：

```bash
pnpm lint
pnpm build
```
