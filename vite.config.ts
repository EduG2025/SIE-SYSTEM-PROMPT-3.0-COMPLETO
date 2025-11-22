import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false, // Desativa sourcemaps em produção para segurança/tamanho
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
        output: {
            // Code Splitting: Separa bibliotecas pesadas em arquivos diferentes
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
});