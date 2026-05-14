import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  // Tauri dev server listens on a fixed port
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
  },
  // Build output into dist/ which Tauri will bundle
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
