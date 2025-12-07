import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    port: 5173,
    open: false,
  },
  build: {
    sourcemap: false, // giảm size, tăng tốc
    chunkSizeWarningLimit: 1000, // tránh cảnh báo dư thừa
    outDir: "dist",
    rollupOptions: {
      output: {
        // Tách vendor an toàn – Vercel recommended
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Tách các thư viện lớn ra riêng để tối ưu
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            if (id.includes("firebase")) {
              return "vendor-firebase";
            }
            if (id.includes("three") || id.includes("@react-three")) {
              return "vendor-three";
            }
            return "vendor"; // Gom các lib còn lại vào vendor
          }
        },
      },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
