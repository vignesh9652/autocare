import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      // Vehicle photos are served from /uploads/** by the vehicle-service itself
      // (the gateway only routes /api/**).
      '/uploads': { target: 'http://localhost:8082', changeOrigin: true },
    },
  },
});
