import type { Connection } from "oracledb";
import * as oracledb from "oracledb";
import { getConfig } from "./config";
import { config } from "../../config/unifiedConfig";
export type IOracleDB = ReturnType<typeof oracleDB>;

const poolAlias = "defaultPool";
let thickModeInitialized = false;

function ensureThickMode() {
    if (thickModeInitialized) return;
    const clientPath = config.ORACLE_CLIENT_PATH;
    if (clientPath) {
        oracledb.initOracleClient({ libDir: clientPath });
        console.log(`OracleDB Thick mode initialized with client: ${clientPath}`);
    } else {
        oracledb.initOracleClient();
        console.log("OracleDB Thick mode initialized (system default)");
    }
    thickModeInitialized = true;
}

async function oracleDB(mode: string) {
    const appConfig = await getConfig();
    if (!appConfig[mode]) throw new Error("Oracle connection string not found");

    // Initialize the connection pool if it doesn't already exist
    try {
        oracledb.getPool(poolAlias);
    } catch (err) {
        // Pool is not found, so initialize Thick mode and create a new one
        ensureThickMode();
        await oracledb.createPool({
            user: config.ORACLE_USER || "",
            password: config.ORACLE_PWD || "",
            connectString: appConfig[mode],
            poolAlias: poolAlias,
            poolMin: 2,
            poolMax: 10,
            poolIncrement: 1,
            ...(config.ORACLE_CLIENT_PATH && {
                clientDir: config.ORACLE_CLIENT_PATH,
            }),
        });
        console.log(`OracleDB Connection Pool created for mode: ${mode}`);
    }

    return oracledb.getConnection(poolAlias);
}

export async function oracleConnection(
    mode: string,
    callback: (connection: Connection) => Promise<any>,
) {
    const connection = await oracleDB(mode);

    try {
        return await callback(connection);
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close(); // the connection is returned to the pool
            } catch (err) {
                console.error(err);
            }
        }
    }
}
