import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: '/acidicswampooze.github.io/', // 根据你的仓库名称配置
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.tushare.pro',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
