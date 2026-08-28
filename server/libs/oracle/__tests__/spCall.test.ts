import { describe, it, expect } from "vitest";
import oracledb from "oracledb";
import { buildSpCall } from "../spCall";

describe("buildSpCall", () => {
    it("ไม่เอาค่า input ไปต่อเป็น string ใน SQL — ต้องเป็น :placeholder เท่านั้น", () => {
        const { sql, binds } = buildSpCall({
            spName: "KPDBA.SP_TEST",
            input: { p_name: { type: oracledb.STRING, value: "O'Brien'; DROP TABLE users--" } },
            output: {},
        });

        expect(sql).toBe("BEGIN KPDBA.SP_TEST(:p_name); END;");
        expect(sql).not.toContain("O'Brien");
        expect(binds.p_name).toMatchObject({
            dir: oracledb.BIND_IN,
            val: "O'Brien'; DROP TABLE users--",
        });
    });

    it("เรียง placeholder input ก่อน output", () => {
        const { sql, binds } = buildSpCall({
            spName: "SP_X",
            input: { a: { type: oracledb.NUMBER, value: 1 } },
            output: { b: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT, value: undefined } },
        });

        expect(sql).toBe("BEGIN SP_X(:a, :b); END;");
        expect(Object.keys(binds)).toEqual(["a", "b"]);
    });
});
