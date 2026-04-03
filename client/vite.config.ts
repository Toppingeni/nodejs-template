import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const envDir = path.resolve(__dirname, "..");

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, envDir);
    return {
        plugins: [react()],
        envDir,
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "."),
            },
        },
        server: {
            port: Number(env.VITE_PORT) || 8080,
            proxy: {
                "/api": {
                    target: `http://localhost:${env.VITE_API_PORT || 3000}`,
                    changeOrigin: true,
                },
            },
        },
        build: {
            outDir: "../dist/spa",
            emptyOutDir: true,
        },
    };
});
