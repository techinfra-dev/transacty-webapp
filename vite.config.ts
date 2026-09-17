import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv (not import.meta.env) so the upstream origin stays server-side and
  // is never inlined into the client bundle.
  const env = loadEnv(mode, process.cwd(), '')
  const upstream = (env.API_UPSTREAM_ORIGIN ?? env.VITE_BASE_URL ?? '').replace(
    /\/+$/,
    '',
  )

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // Mirrors the production edge proxy in api/[...path].ts so relative
      // '/api/...' requests work identically in development.
      proxy: upstream
        ? {
            '/api': {
              target: upstream,
              changeOrigin: true,
              secure: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          }
        : undefined,
    },
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
  }
})
