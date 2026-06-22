import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173, // matches backend's FRONTEND_URL default in .env.example — required for CORS and OAuth redirect to work
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // real backend port, confirmed in cmd/server/main.go and docker-compose.yml
        changeOrigin: true,
      },
      // No /ws proxy: the real backend has no WebSocket endpoint at all
      // (confirmed — no route registered, no websocket dependency in
      // go.mod). Live updates are done via polling instead, see
      // utils/helpers.ts LIVE_POLL_INTERVAL_MS.
    },
  },
})
