import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  /* base = sous-chemin GitHub Pages (servalser.github.io/Incunable/) */
  base: '/Incunable/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    /* Force une seule instance React — nécessaire sur Windows (filesystem
       case-insensitive : components/ui/ et components/UI/ = même dossier
       mais 2 entrées de cache Vite différentes → double React) */
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
});
