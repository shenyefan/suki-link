import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath, URL } from 'url'

import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    devtools(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      prerender: {
        // 启用静态预渲染
        enabled: true,
        // 启用自动发现静态路由
        autoStaticPathsDiscovery: true,
        // 从 HTML 中提取链接并预渲染
        crawlLinks: true,
        // 页面输出为 /page/index.html 而不是 /page.html
        autoSubfolderIndex: true,
      },
    }),
    viteReact(),
  ],
})

export default config
