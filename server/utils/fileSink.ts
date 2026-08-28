/**
 * File sink แบบ JSON-lines — หนึ่ง log event ต่อหนึ่งบรรทัด หนึ่งไฟล์ต่อวัน
 *
 * มีไว้ให้ log รอดตอน tracker ล่มหรือแอป restart. Rotation คือชื่อไฟล์เปลี่ยนตอนเที่ยงคืน
 * ส่วน retention กวาดครั้งเดียวตอน startup
 *
 * ponytail: ใช้ fs.appendFile ต่อ event (เปิด/ปิด fd ทุกครั้ง) พอสำหรับ traffic ระดับ LAN
 * ถ้า write rate โผล่ใน profile ค่อยเปลี่ยนเป็น WriteStream ที่ cache ไว้ต่อวัน
 */
import fs from "fs";
import path from "path";

let logDir: string | undefined;

/** วันที่ตามปฏิทินท้องถิ่น (TZ ถูกตั้งเป็น Asia/Bangkok ใน server.ts) ไม่ใช่ UTC */
function today(d = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function currentFile(): string | undefined {
    if (!logDir) return undefined;
    return path.join(logDir, `app-${today()}.log`);
}

/**
 * เปิดใช้ sink คืน false ถ้าเขียนไม่ได้ (path ผิด, ไม่มีสิทธิ์) —
 * logging ต้องไม่เป็นสาเหตุที่ทำให้แอป boot ไม่ขึ้น
 */
export function initFileSink(dir: string, retentionDays: number): boolean {
    try {
        fs.mkdirSync(dir, { recursive: true });
        logDir = dir;
        sweepOldFiles(retentionDays);
        return true;
    } catch (err) {
        console.error("[Logger] file sink disabled:", (err as Error).message);
        logDir = undefined;
        return false;
    }
}

export function isFileSinkEnabled(): boolean {
    return logDir !== undefined;
}

/** ทางปกติ — fire and forget ไม่บล็อก request */
export function writeLine(payload: unknown): void {
    const file = currentFile();
    if (!file) return;
    fs.appendFile(file, `${JSON.stringify(payload)}\n`, () => {
        /* log เขียนไม่สำเร็จต้องไม่โผล่เป็น error ของแอป */
    });
}

/**
 * ทาง crash — process กำลังจะ exit การเขียนแบบ async จะไม่มีวัน flush
 * นี่เป็นที่เดียวที่ sync write ยอมรับได้
 */
export function writeLineSync(payload: unknown): void {
    const file = currentFile();
    if (!file) return;
    try {
        fs.appendFileSync(file, `${JSON.stringify(payload)}\n`);
    } catch {
        /* ไม่มีอะไรให้ทำต่อแล้ว — กำลังจะตายอยู่ */
    }
}

function sweepOldFiles(retentionDays: number): void {
    if (!logDir || retentionDays <= 0) return;
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    try {
        for (const name of fs.readdirSync(logDir)) {
            if (!/^app-\d{4}-\d{2}-\d{2}\.log$/.test(name)) continue;
            const stamp = Date.parse(`${name.slice(4, 14)}T00:00:00`);
            if (Number.isFinite(stamp) && stamp < cutoff) {
                fs.unlinkSync(path.join(logDir, name));
            }
        }
    } catch {
        /* retention เป็น best-effort */
    }
}
