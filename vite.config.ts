import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: '/kanna_connection/',
    server:{
      hmr: true,
      port: 3141,
      strictPort: true,
      proxy: {
        '/kanna_connection/api': {
          target: 'http://127.0.0.1:12139',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/kanna_connection\/api/, '')
        }
      }
    },
    plugins: [
      vue(),
      vueJsx(),
      AutoImport({
        resolvers: [ElementPlusResolver()]
      }),
      Components({
        resolvers: [ElementPlusResolver()]
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }
})
