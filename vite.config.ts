import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL: This sets relative paths for assets, fixing the GitHub Pages white screen
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  }
});