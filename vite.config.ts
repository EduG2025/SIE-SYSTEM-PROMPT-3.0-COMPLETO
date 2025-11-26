import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    // Proxy para desenvolvimento local
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
        // Garante que arquivos de backend nunca sejam incluídos no bundle
        external: [
            'sequelize',
            'mysql2',
            'express',
            'fs',
            'path',
            'os',
            'crypto'
        ],
        output: {
            manualChunks: {
                'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                'vendor-ui': ['recharts', 'lucide-react', 'framer-motion'],
                'vendor-utils': ['axios', 'date-fns', 'lodash', 'uuid'],
                'vendor-ai': ['@google/genai']
            }
        }
    }
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') }
    ]
  }
});