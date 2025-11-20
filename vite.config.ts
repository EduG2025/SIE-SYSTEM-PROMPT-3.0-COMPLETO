import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/', // Garante caminhos absolutos para evitar erros de carregamento em subrotas
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Limpa a pasta dist antes de construir para remover arquivos velhos (cache bust)
    sourcemap: false
  },
  resolve: {
    alias: {
      '@': path.resolve('./'),
    },
  },
});