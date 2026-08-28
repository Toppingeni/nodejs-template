/**
 * ปิดบังค่าที่อ่อนไหวก่อนที่อะไรจะออกจาก process (WS, file, console)
 *
 * จับจาก **ชื่อ key** ไม่ใช่ค่า — เราไม่พยายามเดาว่า "ค่านี้หน้าตาเหมือน password"
 * field ที่ชื่อ `password` จะถูก mask ทุกที่ที่เจอ ไม่ว่าลึกแค่ไหน
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const MASK = "[REDACTED]";

// ponytail: match จากชื่อ key อย่างเดียว — ถ้ามีค่าหลุดผ่าน field ที่เราไม่ได้ตั้งชื่อไว้
// ค่อยเพิ่ม value-shape detection (JWT regex, card checksum) ทีหลัง
const SENSITIVE_KEY =
    /^(pass(word|wd)?|pwd|old_?password|new_?password|token|access_?token|refresh_?token|id_?token|authorization|auth|secret|client_?secret|api[-_]?key|apikey|credit_?card|card_?no|card_?number|cvv|cvc|pin|session_?id|cookie|set-cookie)$/i;

const MAX_DEPTH = 6;
const MAX_ARRAY = 50;
const MAX_STRING = 2000;

/**
 * Serialize Error รวม `cause` chain — Oracle layer ห่อ error ใหม่ด้วย
 * `new Error(msg, { cause })` ดังนั้น stack ชั้นนอกเป็นของตัวห่อ ส่วน ORA-xxxxx จริง
 * อยู่ลึกลงไป
 */
export function serializeError(err: unknown, depth = 0): any {
    if (err === null || err === undefined) return undefined;
    if (typeof err !== "object") return { message: String(err) };

    const e = err as any;
    const out: Record<string, unknown> = {
        name: e.name,
        message: e.message,
        stack: e.stack,
    };

    // oracledb แนบ errorNum/offset มา ส่วน node error แนบ code/errno/syscall
    for (const k of ["code", "errorNum", "offset", "errno", "syscall", "statusCode"]) {
        if (e[k] !== undefined) out[k] = e[k];
    }

    if (e.cause && depth < 4) out.cause = serializeError(e.cause, depth + 1);

    return out;
}

export function redact<T>(value: T): T {
    return walk(value, 0, new WeakSet()) as T;
}

function walk(value: unknown, depth: number, seen: WeakSet<object>): unknown {
    if (value === null || value === undefined) return value;

    if (typeof value === "string") {
        return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…[truncated]` : value;
    }

    if (typeof value !== "object") {
        return typeof value === "bigint" || typeof value === "function"
            ? String(value)
            : (value as unknown);
    }

    if (value instanceof Error) return serializeError(value);
    if (value instanceof Date) return value.toISOString();
    if (Buffer.isBuffer(value)) return `[Buffer ${value.length} bytes]`;

    if (depth >= MAX_DEPTH) return "[Object]";
    if (seen.has(value as object)) return "[Circular]";
    seen.add(value as object);

    if (Array.isArray(value)) {
        const items = value.slice(0, MAX_ARRAY).map((v) => walk(v, depth + 1, seen));
        if (value.length > MAX_ARRAY) items.push(`…${value.length - MAX_ARRAY} more`);
        seen.delete(value as object);
        return items;
    }

    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        // key ที่อ่อนไหวถูก mask ทั้งก้อน — ครอบคลุม Oracle bind object แบบ
        // `{ password: { val, dir, type } }` ที่ค่าจริงซ่อนอยู่ข้างใน
        out[key] = SENSITIVE_KEY.test(key) ? MASK : walk(val, depth + 1, seen);
    }
    // ไม่ mark node ไว้ ทำให้ `seen` เป็น "เส้นทาง" ไม่ใช่ visited-set —
    // object เดียวกันที่โผล่สองครั้งแบบพี่น้องกันคือการซ้ำ ไม่ใช่ cycle
    seen.delete(value as object);
    return out;
}
