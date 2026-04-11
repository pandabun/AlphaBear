// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Ubah manualChunks menjadi fungsi
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase';
            }
          }
        },
      },
    },
  },
  publicDir: 'public',
});