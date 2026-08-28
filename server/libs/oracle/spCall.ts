import oracledb from "oracledb";
import { CommandsSpType } from "../../types/oracleType";

export type SpCall = {
    sql: string;
    binds: Record<string, unknown>;
};

/**
 * สร้าง PL/SQL call พร้อม bind parameter จริง
 *
 * เดิม input ถูก interpolate เป็น string ลงใน SQL text ผ่าน `convertSQL()`
 * (`'${value}'`) bind แค่ output — ค่าที่มี quote จึงหลุดเป็น SQL ได้
 * ที่นี่ทั้ง input และ output ผ่าน driver bind ไม่มีการต่อ string ค่าใดๆ ลง SQL
 */
export function buildSpCall(obj: CommandsSpType): SpCall {
    const inputKeys = obj.input ? Object.keys(obj.input) : [];
    const outputKeys = obj.output ? Object.keys(obj.output) : [];
    const placeholders = [...inputKeys, ...outputKeys].map((key) => `:${key}`).join(", ");

    const sql = `BEGIN ${obj.spName}(${placeholders}); END;`;

    const binds: Record<string, unknown> = {};
    for (const key of inputKeys) {
        const { type, value } = obj.input![key];
        binds[key] = {
            dir: oracledb.BIND_IN,
            ...(type !== undefined ? { type } : {}),
            val: value,
        };
    }
    for (const key of outputKeys) {
        binds[key] = {
            type: obj.output![key].type,
            dir: obj.output![key].dir,
            value: obj.output![key].value,
        };
    }

    return { sql, binds };
}
