import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * บั๊กที่คุมไว้: request ที่เข้ามาพร้อมกันตอน cold start ต้องสร้าง pool ครั้งเดียว
 * ถ้าไม่ memoize promise ทุกตัวจะผ่านเช็ก getPool() พร้อมกันแล้วเรียก createPool()
 * ด้วย alias เดียวกัน → ตัวที่สองขึ้นไปได้ NJS-046 แล้ว request พัง 500
 */

const pools = new Set<string>();
const createPool = vi.fn(async ({ poolAlias }: { poolAlias: string }) => {
    if (pools.has(poolAlias)) throw new Error("NJS-046: poolAlias already exists");
    await new Promise((r) => setTimeout(r, 10)); // จำลอง handshake ที่กินเวลา
    pools.add(poolAlias);
    return { poolAlias };
});

vi.mock("module", async (importOriginal) => {
    const actual = await importOriginal<typeof import("module")>();
    return {
        ...actual,
        createRequire: () => () => ({
            createPool,
            getPool: (alias: string) => {
                if (!pools.has(alias)) throw new Error("NJS-047: pool not found");
                return { poolAlias: alias };
            },
            getConnection: async (alias: string) => ({
                alias,
                close: async () => {},
            }),
        }),
    };
});

vi.mock("../config", () => ({
    getConfig: async () => ({ MODE_A: "host-a/sid", MODE_B: "host-b/sid" }),
}));

vi.mock("../../../config/unifiedConfig", () => ({
    config: { ORACLE_USER: "u", ORACLE_PWD: "p" },
}));

vi.mock("../../../utils/logger", () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("oracleConnection — pool creation", () => {
    beforeEach(() => {
        pools.clear();
        createPool.mockClear();
    });

    it("burst ตอน cold start สร้าง pool ครั้งเดียว ไม่โดน NJS-046", async () => {
        const { oracleConnection } = await import("../oracledb");

        const results = await Promise.all(
            Array.from({ length: 10 }, () => oracleConnection("MODE_A", async (c) => c)),
        );

        expect(results).toHaveLength(10);
        expect(createPool).toHaveBeenCalledTimes(1);
    });

    it("คนละ mode ได้คนละ pool — ไม่ใช้ alias ร่วมกัน", async () => {
        const { oracleConnection } = await import("../oracledb");

        await Promise.all([
            oracleConnection("MODE_A", async (c) => c),
            oracleConnection("MODE_B", async (c) => c),
        ]);

        expect(createPool).toHaveBeenCalledTimes(2);
        expect(pools).toEqual(new Set(["pool_MODE_A", "pool_MODE_B"]));
    });
});
