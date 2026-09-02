import type { Connection } from "oracledb";
import { createRequire } from "module";
import { getConfig } from "./config";
import { config } from "../../config/unifiedConfig";
import { logger } from "../../utils/logger";

// oracledb เป็น CJS instance (`module.exports = new OracleDb()`) — `import * as`
// ใน prod bundle (vite externalize → Node ESM loader) จะได้แค่ `default`
// ทำให้ createPool/getPool เป็น undefined. dev (tsx) ผ่านเพราะ esbuild ทำ interop ให้.
const require = createRequire(import.meta.url);
const oracledb = require("oracledb") as typeof import("oracledb");

export type IOracleDB = ReturnType<typeof oracleDB>;

/**
 * หนึ่ง pool ต่อหนึ่ง mode (TNS name) — alias เดียวร่วมกันทุก mode จะทำให้คนขอ mode B
 * ได้ connection ของ pool ที่ mode A สร้างไว้ คนละ database โดยไม่มี error ที่ไหนเลย
 */
const poolAliasFor = (mode: string) => `pool_${mode}`;

/**
 * Pool ที่กำลังถูกสร้างอยู่ (in-flight) keyed by alias
 *
 * `getPool()` จะเห็น alias ก็ต่อเมื่อ `createPool()` resolve แล้ว — request ที่เข้ามา
 * พร้อมกันตอน cold start จึงผ่านเช็กพร้อมกันหมดแล้วเรียก `createPool()` ด้วย alias เดียวกัน
 * ตัวที่สองเป็นต้นไปได้ NJS-046. Memoize ตัว promise ทำให้ทุกตัว await การสร้างครั้งเดียวกัน
 * ลบ entry ทิ้งหลังเสร็จเพื่อให้ retry ได้ถ้าสร้างไม่สำเร็จ
 */
const poolPromises = new Map<string, Promise<unknown>>();

/** alias ที่สร้างสำเร็จแล้ว — ใช้ตอน graceful shutdown */
const createdAliases = new Set<string>();

/**
 * ปิด pool ทุกตัวตอน shutdown
 *
 * ต้องปิดตาม alias ที่สร้างไว้จริง — `getPool()` แบบไม่ใส่ alias จะไปหา "default"
 * ซึ่งไม่มีอยู่ ทำให้ NJS-047 แล้ว connection ค้างอยู่ที่ Oracle ตอน restart
 */
export async function closeAllPools(drainSeconds = 10): Promise<void> {
    for (const alias of createdAliases) {
        try {
            await oracledb.getPool(alias).close(drainSeconds);
        } catch (err) {
            logger.warn("Oracle pool close failed", { alias, err });
        }
    }
    createdAliases.clear();
}

async function ensurePool(mode: string, connectString: string): Promise<string> {
    const alias = poolAliasFor(mode);

    try {
        oracledb.getPool(alias);
        return alias;
    } catch {
        // ยังไม่ถูกสร้าง — ทำต่อข้างล่าง
    }

    const existing = poolPromises.get(alias);
    if (existing) {
        await existing;
        return alias;
    }

    const creating = oracledb
        .createPool({
            user: config.ORACLE_USER || "",
            password: config.ORACLE_PWD || "",
            connectString,
            poolAlias: alias,
            poolMin: 0,
            poolMax: 3,
            poolIncrement: 1,
            ...(config.ORACLE_CLIENT_PATH && {
                clientDir: config.ORACLE_CLIENT_PATH,
            }),
        })
        .then((pool) => {
            createdAliases.add(alias);
            logger.info("Oracle connection pool created", {
                mode,
                poolMin: 0,
                poolMax: 3,
            });
            return pool;
        })
        .catch((err: unknown) => {
            // creds ผิด, TNS ไม่เจอ, listener ล่ม — เดิมเงียบสนิท
            logger.error("Oracle connection pool creation failed", { mode, err });
            throw err;
        })
        .finally(() => {
            poolPromises.delete(alias);
        });
    poolPromises.set(alias, creating);

    await creating;
    return alias;
}

async function oracleDB(mode: string) {
    const appConfig = await getConfig();
    if (!appConfig[mode]) {
        const err = new Error("Oracle connection string not found");
        logger.error("Oracle connection string not found", { mode, err });
        throw err;
    }

    const alias = await ensurePool(mode, appConfig[mode]);

    try {
        const conn = await oracledb.getConnection(alias);
        conn.module = process.env.APP_NAME ?? "nodejs-template"; // ponytail: ติดป้าย session ให้ v$session.module บอกได้ว่าแอปไหนถือ connection
        return conn;
    } catch (err) {
        // pool เต็มหรือ DB หลุด
        logger.error("Oracle getConnection failed", { mode, err });
        throw err;
    }
}

export async function oracleConnection<T>(
    mode: string,
    callback: (connection: Connection) => Promise<T>,
): Promise<T> {
    const connection = await oracleDB(mode);

    try {
        return await callback(connection);
    } finally {
        if (connection) {
            try {
                await connection.close(); // the connection is returned to the pool
            } catch (err) {
                // ไม่ fatal ต่อ request นี้ แต่ถ้าเกิดซ้ำๆ แปลว่า pool รั่ว
                logger.warn("Oracle connection close failed", { mode, err });
            }
        }
    }
}
