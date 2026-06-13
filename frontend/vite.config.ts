import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  build: {
    // echarts is an intentionally large chunk, but it loads lazily behind the
    // splash (only the Dashboard imports it), so it never blocks first paint.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split heavy, rarely-changing code into cacheable chunks. ECharts and
        // the geo atlas are only reached through the lazy Dashboard, so they
        // stay in async chunks loaded after the first paint (behind the splash).
        manualChunks(id) {
          const path = id.replace(/\\/g, '/');
          if (path.includes('/assets/geo/')) return 'geo-atlas';
          if (!path.includes('/node_modules/')) return undefined;
          if (
            path.includes('/echarts') ||
            path.includes('/zrender') ||
            path.includes('/topojson')
          ) {
            return 'echarts';
          }
          if (path.includes('/motion/') || path.includes('/framer-motion/')) return 'motion';
          // Everything else (React, TanStack Query, Radix, Zustand, lucide…) in
          // one vendor chunk — splitting React out caused a vendor cycle.
          return 'vendor';
        },
      },
    },
  },
});
