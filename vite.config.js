import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
    open: false,
    host: true,
    allowedHosts: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      maxParallelFileOps: 2,
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react')) return 'vendor-react';
            return 'vendor';
          }
          if (id.includes('smartsupplyParts') || id.includes('grupoarmarParts') || id.includes('cellstoreParts') || id.includes('soulfixParts') || id.includes('supplierParts')) {
            return 'parts-catalog';
          }
        }
      }
    }
  },
  esbuild: {
    sourcemap: false,
    legalComments: 'none'
  }
})
