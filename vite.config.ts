import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

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
    alias: {
      '@': path.resolve('./src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});