import path from "path";
import { createRequire } from "module";
import { config, initLocalEnvConfig, initVaultConfig } from "./config/unifiedConfig";
import { initializeDatabases } from "./bootstrap/init";
import { closeAllPools } from "./libs/oracle/oracledb";
import { createServer, errorHandler, notFoundHandler } from "./server";
import { getErrorMessage } from "./utils/error";
import { logger } from "./utils/logger";
import { initFileSink } from "./utils/fileSink";

// CJS instance — ใช้ createRequire ให้เหมือน entry ฝั่ง production (node-build.ts)
const require = createRequire(import.meta.url);
const oracledb = require("oracledb") as typeof import("oracledb");

/**
 * ด่านสุดท้าย — อะไรที่หลุด Express ออกมาจะมาจบที่นี่
 *
 * logger.fatal() เขียนไฟล์แบบ sync เพราะเรา exit ทันทีหลังจากนั้น:
 * append แบบ async จะไม่มีวัน flush
 */
const installCrashHandlers = () => {
    process.on("uncaughtException", (err) => {
        logger.fatal("Uncaught exception — shutting down", { err });
        process.exit(1);
    });

    process.on("unhandledRejection", (reason) => {
        logger.fatal("Unhandled promise rejection — shutting down", { err: reason });
        process.exit(1);
    });
};

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

        // 1b. File sink — เปิดเองใน production, ที่เหลือ opt-in ต้องมาก่อนอย่างอื่น
        //     เพื่อให้ failure ตอน startup ลงไฟล์ด้วย
        const fileSinkOn =
            config.LOG_TO_FILE ?? (config.NODE_ENV === "production" || config.NODE_ENV === "prod");
        if (fileSinkOn) {
            initFileSink(path.resolve(process.cwd(), config.LOG_DIR), config.LOG_RETENTION_DAYS);
        }

        installCrashHandlers();

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
        // signal ซ้ำ (Ctrl+C สองที, pm2 ส่ง SIGINT แล้ว SIGTERM, tsx forward ต่อให้ child)
        // ทำให้ shutdown รันซ้อนกันแล้วเจอ NJS-064 "pool is closing"
        let shuttingDown = false;
        const shutdown = async (signal: string) => {
            if (shuttingDown) return;
            shuttingDown = true;
            console.log(`\n[${signal}] Graceful shutdown initiated...`);

            // Stop accepting new connections
            server.close(() => {
                console.log("[Shutdown] HTTP server closed");
            });

            // ปิดทุก pool ตาม alias ที่สร้างจริง (หนึ่ง pool ต่อหนึ่ง mode)
            // drain 5s ต้องน้อยกว่า pm2 kill_timeout ไม่งั้นโดน SIGKILL ก่อนปิดเสร็จ
            await closeAllPools(5);
            console.log("[Shutdown] Oracle connection pools closed");

            console.log("[Shutdown] Complete");
            process.exit(0);
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (error) {
        logger.fatal("Failed to start server", { err: error });
        process.exit(1);
    }
};

bootstrap();
