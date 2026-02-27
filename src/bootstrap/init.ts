import { initSequelize } from "../libs/sequelize";
import { initOracleClient } from "oracledb";
import { config } from "../config/unifiedConfig";
import { oracle } from "../libs/oracle";

export const initializeDatabases = async () => {
    // 1. Initialize Oracle Thick Client if Path is provided
    console.log("ORACLE_CLIENT_PATH", config.ORACLE_CLIENT_PATH);
    if (config.ORACLE_CLIENT_PATH) {
        try {
            initOracleClient({ libDir: config.ORACLE_CLIENT_PATH });
            console.log("Oracle Client initialized successfully");
        } catch (err) {
            console.error("Failed to initialize Oracle Client:", err);
            throw new Error(
                "Cannot load Oracle Client. Ensure ORACLE_CLIENT_PATH is set correctly."
            );
        }
    } else {
        console.warn(
            "ORACLE_CLIENT_PATH is not set. Ensure the Oracle Client is installed and configured."
        );
    }

    // 2. Oracle DB testing connection (Optional but good for checking pool readiness if pool is configured)
    try {
        // Just verify connection pool can be established by invoking a simple select query via our oracle db instance
        await oracle.query("SELECT 1 FROM DUAL");
        console.log("OracleDB Connection Pool connected successfully");
    } catch (err) {
        console.error("Failed to connect to OracleDB:", err);
    }

    // 3. Initialize Sequelize
    try {
        await initSequelize();
        console.log("Database initialized successfully via Sequelize");
    } catch (error) {
        console.error("Failed to initialize Database (Sequelize):", error);
        throw error;
    }
};
