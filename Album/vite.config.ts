import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/azure-blob': {
        target: 'https://bipul.blob.core.windows.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/azure-blob/, ''),
        configure: (proxy) => {
          // Prevent http-proxy from re-encoding the URL
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.url) {
              const rawPath = req.url.replace(/^\/azure-blob/, '');
              proxyReq.path = rawPath;
            }
          });
        },
      },
    },
  },
})
