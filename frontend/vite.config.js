import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read configuration from root config.json
const configPath = path.resolve(__dirname, '../config.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

// Allow override via environment variable for e2e tests (uses different port)
const backendPort = process.env.VITE_BACKEND_PORT || config.development.backendPort;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: config.development.frontendPort,
    // Proxy API requests to backend during development
    proxy: {
      // Socket.IO needs its own proxy config
      '/api/v1/ws': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        ws: true,
      },
      // Regular API requests
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure paths work when served from root
    base: '/',
  },
});
