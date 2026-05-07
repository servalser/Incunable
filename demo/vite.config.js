import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  // Les URLs des assets seront relatives → fonctionne en ouvrant index.html directement
  base: './',

  resolve: {
    alias: {
      // Remplace @inertiajs/react par notre shim React Router
      '@inertiajs/react': path.resolve(__dirname, 'src/inertia-shim.jsx'),
      // Alias vers les composants, pages et CSS originaux
      '@Components': path.resolve(__dirname, '../resources/js/Components'),
      '@Pages':      path.resolve(__dirname, '../resources/js/Pages'),
      '@css':        path.resolve(__dirname, '../resources/css'),
    },
  },

  // Dossier de sortie : public/demo/ → accessible via http://localhost:8001/demo/
  build: {
    outDir: path.resolve(__dirname, '../public/demo'),
    emptyOutDir: true,
  },

  // Vite devrait trouver node_modules dans le dossier parent
  server: {
    port: 5175,
  },
});
