import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    sourcemap: false, // giảm size, tăng tốc
    chunkSizeWarningLimit: 1000, // tránh cảnh báo dư thừa

    rollupOptions: {
      output: {
        // Tách vendor an toàn – Vercel recommended
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor"; // Gom hết lib vào 1 vendor
          }
        },
      },
    },
  },

  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
