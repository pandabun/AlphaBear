// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Generate sourcemap untuk debugging
    sourcemap: false,
    rollupOptions: {
      output: {
        // Code splitting untuk performa lebih baik
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  // Pastikan sw.js tidak di-bundle oleh Vite
  publicDir: 'public',
});