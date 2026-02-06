import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const cesiumBaseUrl = "/cesium/";

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify(cesiumBaseUrl),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'public': fileURLToPath(new URL('./public', import.meta.url))
    },
  },
  server: {
    open: true,
    proxy: {
      '/map': {
        target: 'http://127.0.0.1:8085',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/map/, '')   // rewrite 函数用于重写请求路径，这里将请求路径中的 /api 前缀移除，确保请求能够正确地发送到后端服务器上的正确路由。
      },
      '/model': {
        target: 'http://127.0.0.1:8086',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/model/, '')   // rewrite 函数用于重写请求路径，这里将请求路径中的 /api 前缀移除，确保请求能够正确地发送到后端服务器上的正确路由。
      },
      '/fly_data': {
        target: 'http://127.0.0.1:8087',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fly_data/, '')   // rewrite 函数用于重写请求路径，这里将请求路径中的 /api 前缀移除，确保请求能够正确地发送到后端服务器上的正确路由。
      },
    },
  }
})
