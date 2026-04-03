import path from "path";
import express from "express";
import { fileURLToPath } from "url";
import {
  config,
  initLocalEnvConfig,
  initVaultConfig,
} from "./config/unifiedConfig";
import { initializeDatabases } from "./bootstrap/init";
import { createServer, errorHandler, notFoundHandler } from "./server";
import { getErrorMessage } from "./utils/error";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const bootstrap = async () => {
  try {
    // 1. Initialize config (Vault -> fallback local env)
    try {
      await initVaultConfig();
    } catch (error) {
      console.warn(
        `[Config Warning] initVaultConfig failed, falling back to local env: ${getErrorMessage(error)}`,
      );
      await initLocalEnvConfig();
    }

    // 2. Initialize databases
    await initializeDatabases();

    // 3. Create Express app
    const app = createServer();

    // 4. Serve SPA static files (production build output)
    // Production: __dirname = dist/server/ → ../spa = dist/spa
    const distPath = path.resolve(__dirname, "../spa");
    app.use(express.static(distPath));

    // 5. SPA fallback: non-API routes serve index.html
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });

    // 6. Error handling (must be after all routes)
    app.use(notFoundHandler);
    app.use(errorHandler);

    // 7. Start listening
    const port = config.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Swagger UI available at http://localhost:${port}/docs`);
      console.log(`API available at http://localhost:${port}/api`);
    });

    // 8. Graceful shutdown
    const shutdown = () => {
      console.log("Server shutting down...");
      process.exit(0);
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Auto-detect: run bootstrap if executed directly or via PM2
const currentFile = fileURLToPath(import.meta.url);
const isMainModule =
  process.argv[1] === currentFile ||
  process.argv[1]?.endsWith("node-build.mjs");

if (isMainModule || process.env.pm_id) {
  bootstrap();
}
