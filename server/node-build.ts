import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { config, initLocalEnvConfig, initVaultConfig } from "./config/unifiedConfig";

// CJS instance — `import * as` พังใน prod bundle (initOracleClient เป็น undefined)
const require = createRequire(import.meta.url);
const oracledb = require("oracledb") as typeof import("oracledb");
import { initializeDatabases } from "./bootstrap/init";
import { closeAllPools } from "./libs/oracle/oracledb";
import { createServer, errorHandler, notFoundHandler } from "./server";
import { getErrorMessage } from "./utils/error";
import { logger } from "./utils/logger";
import { initFileSink } from "./utils/fileSink";

/**
 * ด่านสุดท้าย — อะไรที่หลุด Express ออกมาจะมาจบที่นี่
 * logger.fatal() เขียนไฟล์แบบ sync เพราะเรา exit ทันที
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

        // 1b. File sink — ต้องมาก่อนอย่างอื่นเพื่อให้ failure ตอน startup ลงไฟล์ด้วย
        const fileSinkOn =
            config.LOG_TO_FILE ?? (config.NODE_ENV === "production" || config.NODE_ENV === "prod");
        if (fileSinkOn) {
            initFileSink(path.resolve(process.cwd(), config.LOG_DIR), config.LOG_RETENTION_DAYS);
        }

        installCrashHandlers();

        // 2. Initialize Oracle Thick mode — node-oracledb v6 default เป็น Thin mode
        //    ซึ่ง Oracle 11g ไม่รองรับ (NJS-138) ต้องเรียกก่อน query แรกเสมอ
        //    `clientDir` ใน createPool ไม่พอสำหรับ 11g
        try {
            if (config.ORACLE_CLIENT_PATH) {
                oracledb.initOracleClient({ libDir: config.ORACLE_CLIENT_PATH });
            } else {
                oracledb.initOracleClient();
            }
        } catch (err) {
            console.warn("[Oracle] initOracleClient failed:", getErrorMessage(err));
        }

        // 3. Initialize databases
        await initializeDatabases();

        // 4. Create Express app
        const app = createServer();

        // 5. Error handling (must be after all routes)
        app.use(notFoundHandler);
        app.use(errorHandler);

        // 6. Start listening
        const port = config.PORT || 3000;
        const server = app.listen(port, () => {
            logger.info("Server started", { port, nodeEnv: config.NODE_ENV, pid: process.pid });
            console.log(`Server running on port ${port}`);
            console.log(`Swagger UI available at http://localhost:${port}/docs`);
            console.log(`API available at http://localhost:${port}/api`);
        });

        // 8. Graceful shutdown
        // guard กัน signal ซ้ำ (pm2 ส่ง SIGINT แล้วตามด้วย SIGTERM) ไม่งั้น shutdown
        // รันซ้อนกันแล้วเจอ NJS-064 "pool is closing"
        let shuttingDown = false;
        const shutdown = async (signal: string) => {
            if (shuttingDown) return;
            shuttingDown = true;
            logger.info("Shutting down", { signal });
            server.close(() => {
                logger.info("HTTP server closed");
            });
            // ปิด pool ตาม alias ที่สร้างจริง ไม่งั้น connection ค้างที่ Oracle ตอน restart
            // drain 5s ต้องน้อยกว่า pm2 kill_timeout
            await closeAllPools(5);
            process.exit(0);
        };
        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    } catch (error) {
        logger.fatal("Failed to start server", { err: error });
        process.exit(1);
    }
};

// Auto-detect: run bootstrap if executed directly or via PM2
const currentFile = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === currentFile || process.argv[1]?.endsWith("node-build.mjs");

if (isMainModule || process.env.pm_id) {
    bootstrap();
}
