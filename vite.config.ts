import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') }
    ],
  },
  server: {
    port: 5173,
    host: true, // Expor na rede (necessário para Docker/VPS checks)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false
      }
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // IMPORTANTE: Nunca inclua arquivos de backend no bundle do frontend
      external: [
        'sequelize',
        'mysql2',
        'fs',
        'path',
        'os',
        'crypto',
        'net',
        'tls',
        'stream',
        'dotenv',
        'express',
        'jsonwebtoken',
        'bcryptjs',
        'node-cron',
        'multer',
        'adm-zip',
        'helmet',
        'morgan',
        'compression'
      ],
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['recharts', 'framer-motion', 'lucide-react'],
          'vendor-utils': ['axios', 'date-fns', 'lodash', 'uuid', 'markdown-it'],
          'vendor-ai': ['@google/genai']
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['sequelize', 'mysql2'] // Garante que o Vite não tente pré-processar libs de backend
  }
});