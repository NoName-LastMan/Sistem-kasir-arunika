import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react') || 
              id.includes('react-dom') || 
              id.includes('react-router-dom') || 
              id.includes('framer-motion')
            ) {
              return 'vendor-react'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            if (id.includes('zustand') || id.includes('axios')) {
              return 'vendor-utils'
            }
            return 'vendor-libs'
          }
        }
      }
    },
    chunkSizeWarningLimit: 800
  }
})
