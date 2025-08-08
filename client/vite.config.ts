import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: ((import.meta as any).env?.HTTPS ? 'https://' : 'http://') + (import.meta as any).env?.HOST + ":" + (import.meta as any).env?.PORT,
        changeOrigin: true
      }
    }
  }
})