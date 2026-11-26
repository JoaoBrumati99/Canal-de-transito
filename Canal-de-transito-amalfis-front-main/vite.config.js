import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiProxyTarget = process.env.API_PROXY_TARGET || "http://localhost:3001";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: true,
    port: 3000, // ← Adicione esta linha
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
});
