import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('antd')) {
              return 'vendor-antd';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@tinymce')) {
              return 'vendor-editor';
            }
            // Other node_modules
            return 'vendor-other';
          }
          
          // Split by service layer
          if (id.includes('/src/services/customer/')) {
            return 'services-customer';
          }
          if (id.includes('/src/services/seller/')) {
            return 'services-seller';
          }
          if (id.includes('/src/services/admin/')) {
            return 'services-admin';
          }
          if (id.includes('/src/services/staff/')) {
            return 'services-staff';
          }
          
          // Split by page
          if (id.includes('/src/pages/Customer/')) {
            return 'pages-customer';
          }
          if (id.includes('/src/pages/Seller/')) {
            return 'pages-seller';
          }
          if (id.includes('/src/pages/Admin/')) {
            return 'pages-admin';
          }
          if (id.includes('/src/pages/StoreStaff/')) {
            return 'pages-staff';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'esbuild'
  }
})
