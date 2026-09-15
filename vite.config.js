import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  server: {
    port: 22222,
    proxy: {
      '/meshy-assets': {
        target: 'https://assets.meshy.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/meshy-assets/, ''),
      },
      '/api/meshy-assets': {
        target: 'https://assets.meshy.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/meshy-assets/, ''),
      },
      '/api/meshy': {
        target: 'https://api.meshy.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/meshy/, ''),
      },
    },
  },
})
