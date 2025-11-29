import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // CRÍTICO: Garante que bibliotecas exclusivas do Node.js não sejam incluídas no bundle do navegador
      external: [
        'sequelize',
        'mysql2',
        'fs',
        'path',
        'os',
        'crypto',
        'dotenv',
        'express',
        'jsonwebtoken',
        'bcryptjs',
        'node-cron',
        'multer',
        'adm-zip',
        'helmet',
        'compression'
      ],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['recharts', 'framer-motion', 'lucide-react'],
          'utils-vendor': ['axios', 'date-fns', 'lodash', 'markdown-it']
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['sequelize', 'mysql2', 'express'] 
  }
});