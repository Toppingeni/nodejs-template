import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        include: ["**/*.test.ts", "**/*.spec.ts"],
        exclude: ["node_modules", "dist"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: ["node_modules/", "tsoa/", "**/*.d.ts", "vitest.config.ts"],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "."),
        },
    },
});
