// import { initSequelize } from "../libs/sequelize";
import { config } from "../config/unifiedConfig";
import { getOracle } from "../libs/oracle";
import { logger } from "../utils/logger";

export const initializeDatabases = async () => {
    // 1. Log Oracle configuration
    logger.info("Oracle bootstrap", {
        oracleClientPath: config.ORACLE_CLIENT_PATH,
        tnsPath: config.TNS_PATH,
        dbName: config.ORACLE_DB_NAME,
    });

    if (!config.ORACLE_CLIENT_PATH) {
        logger.warn(
            "ORACLE_CLIENT_PATH is not set. Ensure the Oracle Client is installed and configured.",
        );
    }

    // 2. Oracle DB testing connection (Optional but good for checking pool readiness if pool is configured)
    try {
        if (!config.ORACLE_DB_NAME) {
            logger.warn("ORACLE_DB_NAME is not set. Skipping OracleDB connection test.");
            return;
        }
        // Just verify connection pool can be established by invoking a simple select query via our oracle db instance
        await getOracle().query("SELECT 1 FROM DUAL");
        logger.info("OracleDB connection pool connected successfully");
    } catch (err) {
        // ตั้งใจให้ไม่ fatal: แอป boot ได้โดยไม่มี DB (ตอนทำ template/dev)
        // แต่ทุก request ที่ต้องใช้ Oracle จะพัง — เลยต้องดังหน่อย
        logger.error("Failed to connect to OracleDB — app is running without a database", {
            dbName: config.ORACLE_DB_NAME,
            err,
        });
    }

    // 3. Initialize Sequelize
    // try {
    //     await initSequelize();
    //     console.log("Database initialized successfully via Sequelize");
    // } catch (error) {
    //     console.error("Failed to initialize Database (Sequelize):", error);
    //     throw error;
    // }
};
