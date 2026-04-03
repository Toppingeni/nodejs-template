import {
  config,
  initLocalEnvConfig,
  initVaultConfig,
} from "./config/unifiedConfig";
import { initializeDatabases } from "./bootstrap/init";
import { createServer, errorHandler, notFoundHandler } from "./server";
import { getErrorMessage } from "./utils/error";

const bootstrap = async () => {
  try {
    // 1. Initialize config
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

    // 3. Create Express app (API only, no SPA serving — Vite handles frontend)
    const app = createServer();

    // 4. Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    // 5. Start listening
    const port = config.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Swagger UI available at http://localhost:${port}/docs`);
      console.log(`API available at http://localhost:${port}/api`);
    });

    // 6. Graceful shutdown
    process.on("SIGINT", () => {
      console.log("Server shutting down...");
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      console.log("Server shutting down...");
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

bootstrap();
