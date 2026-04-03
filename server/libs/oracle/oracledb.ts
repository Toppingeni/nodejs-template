import type { Connection } from "oracledb";
import * as oracledb from "oracledb";
import { getConfig } from "./config";
import { config } from "../../config/unifiedConfig";
import dotenv from "dotenv";
// Load environment variables first
dotenv.config({
    path: `${__dirname}/../.env${
        process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""
    }`,
});
export type IOracleDB = ReturnType<typeof oracleDB>;

const poolAlias = "defaultPool";

async function oracleDB(mode: string) {
    const appConfig = await getConfig();
    if (!appConfig[mode]) throw new Error("Oracle connection string not found");

    // Initialize the connection pool if it doesn't already exist
    try {
        oracledb.getPool(poolAlias);
    } catch (err) {
        // Pool is not found, so create a new one
        await oracledb.createPool({
            user: config.ORACLE_USER || "",
            password: config.ORACLE_PWD || "",
            connectString: appConfig[mode],
            poolAlias: poolAlias,
            poolMin: 2,
            poolMax: 10,
            poolIncrement: 1,
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
