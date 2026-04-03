import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  server: {
    port: Number(process.env.VITE_PORT) || 8080,
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.PORT || 3000}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist/spa",
    emptyOutDir: true,
  },
});
