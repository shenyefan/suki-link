# Suki Link

一个基于 EdgeOne Pages 构建的现代化短链接服务。

## 技术栈

- **前端框架**: React 19 + TanStack Router
- **构建工具**: Vite
- **UI 组件**: Radix UI + Tailwind CSS
- **后端**: EdgeOne Edge Functions
- **部署平台**: EdgeOne Pages

## 开发

### 安装依赖

```bash
pnpm install
```

### EO 开发

```bash
edgeone pages dev
```

## 环境变量

在 `.env` 文件中配置以下环境变量：

```env
SITE_TOKEN=SukiLinkToken              # 站点认证令牌
SLUG_DEFAULT_LENGTH=6                 # 短链接默认长度
VITE_REDIRECT_WITH_QUERY=true         # 是否在重定向时保留查询参数
VITE_HOME_URL=https://blog.suki.icu/  # 首页 URL
```
