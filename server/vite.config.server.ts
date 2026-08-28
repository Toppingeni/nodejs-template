import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            "@server": path.resolve(__dirname, "."),
            "@shared": path.resolve(__dirname, "../shared"),
        },
    },
    build: {
        lib: {
            // path ผูกกับที่อยู่ของ config ไม่ใช่ cwd — build ถูกเรียกจาก repo root
            entry: path.resolve(__dirname, "node-build.ts"),
            formats: ["es"],
            fileName: "node-build",
        },
        outDir: path.resolve(__dirname, "../dist/server"),
        emptyOutDir: true,
        target: "node22",
        ssr: true,
        rollupOptions: {
            external: [
                "fs",
                "path",
                "url",
                "http",
                "https",
                "os",
                "crypto",
                "stream",
                "util",
                "events",
                "buffer",
                "child_process",
                "async_hooks",
                "express",
                "cors",
                "oracledb",
                "helmet",
                "express-rate-limit",
                "dotenv",
                "keys-converter",
                "node-vault-client",
                "sequelize",
                "sequelize-oracle",
                "tns",
                "jsonwebtoken",
                "swagger-ui-express",
                "zod",
            ],
            output: {
                entryFileNames: "[name].mjs",
            },
        },
        minify: false,
        sourcemap: true,
    },
});
