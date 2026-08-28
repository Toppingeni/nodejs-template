import { describe, it, expect } from "vitest";
import { redact, serializeError, MASK } from "../redact";

describe("redact", () => {
    it("mask field อ่อนไหวทุกความลึก", () => {
        const out = redact({
            userId: "u1",
            password: "hunter2",
            nested: { refresh_token: "abc", keep: 1 },
        }) as any;

        expect(out.userId).toBe("u1");
        expect(out.password).toBe(MASK);
        expect(out.nested.refresh_token).toBe(MASK);
        expect(out.nested.keep).toBe(1);
    });

    it("mask Oracle bind object ทั้งก้อน — ค่าจริงซ่อนอยู่ข้างใน", () => {
        const out = redact({
            binds: { password: { val: "hunter2", dir: 3001 } },
        }) as any;

        expect(out.binds.password).toBe(MASK);
        expect(JSON.stringify(out)).not.toContain("hunter2");
    });

    it("ไม่ระเบิดกับ circular reference", () => {
        const a: any = { name: "a" };
        a.self = a;

        expect(() => redact(a)).not.toThrow();
        expect((redact(a) as any).self).toBe("[Circular]");
    });

    it("object เดียวกันที่โผล่สองครั้งแบบพี่น้องไม่ถูกมองเป็น cycle", () => {
        const shared = { v: 1 };
        const out = redact({ a: shared, b: shared }) as any;

        expect(out.a).toEqual({ v: 1 });
        expect(out.b).toEqual({ v: 1 });
    });
});

describe("serializeError", () => {
    it("ตาม cause chain ไปเจอ ORA error ที่ถูกห่อไว้", () => {
        const ora: any = new Error("ORA-00942: table or view does not exist");
        ora.errorNum = 942;
        const wrapped = new Error("Error querying Oracle database", { cause: ora });

        const out = serializeError(wrapped);

        expect(out.message).toBe("Error querying Oracle database");
        expect(out.cause.message).toContain("ORA-00942");
        expect(out.cause.errorNum).toBe(942);
    });
});
