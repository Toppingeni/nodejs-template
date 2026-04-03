// import { initSequelize } from "../libs/sequelize";
import { config } from "../config/unifiedConfig";
import { getOracle } from "../libs/oracle";

export const initializeDatabases = async () => {
    // 1. Log Oracle configuration
    console.log("ORACLE_CLIENT_PATH", config.ORACLE_CLIENT_PATH);
    console.log("ORACLE_TNS_PATH", config.TNS_PATH);
    console.log("ORACLE_DB_NAME", config.ORACLE_DB_NAME);
    if (!config.ORACLE_CLIENT_PATH) {
        console.warn(
            "ORACLE_CLIENT_PATH is not set. Ensure the Oracle Client is installed and configured.",
        );
    }

    // 2. Oracle DB testing connection (Optional but good for checking pool readiness if pool is configured)
    try {
        if (!config.ORACLE_DB_NAME) {
            console.warn(
                "ORACLE_DB_NAME is not set. Skipping OracleDB connection test.",
            );
            return;
        }
        // Just verify connection pool can be established by invoking a simple select query via our oracle db instance
        await getOracle().query("SELECT 1 FROM DUAL");
        console.log("OracleDB Connection Pool connected successfully");
    } catch (err) {
        console.error("Failed to connect to OracleDB:", err);
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
