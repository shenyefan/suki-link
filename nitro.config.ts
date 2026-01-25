import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  // 输出预设：静态文件输出
  preset: 'static',
  
  output: {
    dir: './dist',
  },
  
  // 预渲染配置 - 自动预渲染所有路由为静态 HTML
  prerender: {
    // 自动爬取所有链接并预渲染
    crawlLinks: true,
    // 如果需要指定特定路由，可以在这里添加
    // routes: ['/'],
  },
  
  // 静态资源处理
  publicAssets: [
    {
      baseURL: '/',
      dir: './public',
      maxAge: 31536000, // 1年缓存
    },
  ],
  
  // 兼容性配置
  compatibilityDate: '2024-01-01',
})
