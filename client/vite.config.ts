import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: (import.meta as any).env?.BACKEND_API_URL || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})