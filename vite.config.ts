import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (
            id.includes('@tanstack/react-router') ||
            id.includes('@tanstack/router-core') ||
            id.includes('@tanstack/history')
          ) {
            return 'vendor-tanstack-router'
          }
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-tanstack-query'
          }
          if (id.includes('@supabase')) {
            return 'vendor-supabase'
          }
          if (id.includes('react-dom') || /[/\\]react[/\\]/.test(id)) {
            return 'vendor-react'
          }
          if (id.includes('zod')) {
            return 'vendor-zod'
          }
          if (id.includes('axios')) {
            return 'vendor-axios'
          }
        },
      },
    },
  },
})
