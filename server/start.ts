import * as oracledb from "oracledb";
import { config, initLocalEnvConfig, initVaultConfig } from "./config/unifiedConfig";
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

        // 2. Initialize Oracle Thick mode (required for Oracle 11g)
        if (config.ORACLE_CLIENT_PATH) {
            oracledb.initOracleClient({ libDir: config.ORACLE_CLIENT_PATH });
        } else {
            oracledb.initOracleClient();
        }

        // 3. Initialize databases
        await initializeDatabases();

        // 4. Create Express app (API only, no SPA serving — Vite handles frontend)
        const app = createServer();

        // 5. Error handling
        app.use(notFoundHandler);
        app.use(errorHandler);

        // 6. Start listening
        const port = config.PORT || 3000;
        const server = app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            console.log(`Swagger UI available at http://localhost:${port}/docs`);
            console.log(`API available at http://localhost:${port}/api`);
        });

        // 7. Graceful shutdown
        const shutdown = async (signal: string) => {
            console.log(`\n[${signal}] Graceful shutdown initiated...`);

            // Stop accepting new connections
            server.close(() => {
                console.log("[Shutdown] HTTP server closed");
            });

            try {
                // Close Oracle connection pool
                await oracledb.getPool().close(10); // 10 second drain timeout
                console.log("[Shutdown] Oracle connection pool closed");
            } catch (error) {
                console.warn("[Shutdown] Error closing Oracle pool:", getErrorMessage(error));
            }

            console.log("[Shutdown] Complete");
            process.exit(0);
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

bootstrap();
