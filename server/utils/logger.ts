import { context } from "./context";
import { config } from "../config/unifiedConfig";
import { redact } from "./redact";
import { writeLine, writeLineSync, isFileSinkEnabled } from "./fileSink";

/* eslint-disable @typescript-eslint/no-explicit-any */

export enum LogLevel {
    FATAL = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4,
}

export type LogLevelName = keyof typeof LogLevel;

/** Event แบบมีโครงสร้าง — หน้าตาเดียวกันทั้งบน wire, ในไฟล์ และบน console */
export interface LogPayload {
    timestamp: string;
    level: LogLevelName;
    service: string;
    message: string;
    requestId?: string;
    userId?: string;
    userName?: string;
    orgId?: string;
    trackingStatus?: string;
    [key: string]: unknown;
}

export class Logger {
    private static instance: Logger;

    /**
     * Override ต่อ instance — ใช้เฉพาะตอนที่มีคนเรียก setEnabled()/setLogLevel()
     *
     * ถ้าไม่มี override จะอ่านจาก `config` สดๆ ทุกครั้ง เพราะ singleton ถูกสร้างตอน
     * module import ซึ่งตอนนั้น `config` ยังเป็น `{}` (initVaultConfig ยังไม่รัน)
     * — ถ้า capture ค่าไว้ใน constructor `WS_LOG_SERVER_URL` จะเป็น undefined ตลอดกาล
     * และ WS log จะไม่เคยยิงเลยไม่ว่าตั้ง env ไว้ยังไง
     */
    private enabledOverride?: boolean;
    private logLevelOverride?: LogLevel;

    private constructor() {}

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private get enabled(): boolean {
        if (this.enabledOverride !== undefined) return this.enabledOverride;
        return config.ENABLE_LOGGING !== false;
    }

    private get logLevel(): LogLevel {
        if (this.logLevelOverride !== undefined) return this.logLevelOverride;
        return this.parseLogLevel(config.LOG_LEVEL || "INFO");
    }

    private get wsLogServerUrl(): string | undefined {
        return config.WS_LOG_SERVER_URL;
    }

    private get serviceName(): string {
        return config.LOG_SERVICE_NAME || "oppn-backend";
    }

    /** Console แยกจาก LOG_LEVEL — ปิดใน production, เปิดที่เหลือ (ERROR/FATAL ลงเสมอ) */
    private get consoleEnabled(): boolean {
        if (config.LOG_CONSOLE !== undefined) return config.LOG_CONSOLE;
        return config.NODE_ENV !== "production" && config.NODE_ENV !== "prod";
    }

    private parseLogLevel(level: string): LogLevel {
        switch (level.toUpperCase()) {
            case "FATAL":
                return LogLevel.FATAL;
            case "ERROR":
                return LogLevel.ERROR;
            case "WARN":
                return LogLevel.WARN;
            case "INFO":
                return LogLevel.INFO;
            case "DEBUG":
                return LogLevel.DEBUG;
            default:
                return LogLevel.INFO;
        }
    }

    private shouldLog(level: LogLevel): boolean {
        // FATAL/ERROR ไม่เคยถูกปิดด้วย LOG_LEVEL — ถ้าแอปพังเราต้องรู้
        // ไม่ว่าปุ่มปรับ verbosity จะตั้งไว้เท่าไหร่
        if (level <= LogLevel.ERROR) return this.enabled;
        return this.enabled && level <= this.logLevel;
    }

    /** รวม request context + meta ของ caller เป็น event เดียว แบน และ redact แล้ว */
    private buildPayload(level: LogLevelName, message: string, meta?: any): LogPayload {
        const store = context.getStore();
        const safeMeta = meta ? (redact(meta) as Record<string, unknown>) : undefined;

        return {
            timestamp: new Date().toISOString(),
            level,
            service: this.serviceName,
            message,
            requestId: store?.requestId,
            userId: store?.userId,
            userName: store?.userName,
            orgId: store?.orgId,
            trackingStatus: store?.trackingStatus,
            ...safeMeta,
        };
    }

    private toConsole(payload: LogPayload): void {
        const { timestamp, level, message, ...rest } = payload;
        const line = `[${timestamp}] [${level}] ${message} | ${JSON.stringify(rest)}`;
        if (level === "ERROR" || level === "FATAL") console.error(line);
        else if (level === "WARN") console.warn(line);
        else console.log(line);
    }

    /**
     * ส่งไป tracker (fire & forget)
     *
     * `trackingStatus === "F"` คือ user ขอไม่ให้เก็บ *activity* — ต้องไม่ปิดการรายงาน
     * ปัญหา ไม่งั้น warning/error ของ user ที่กำลังพังจะหายไปตอนที่มันสำคัญที่สุด
     * WARN นับเป็นปัญหา: มันพา slow query, connection close ที่ล้ม และ 4xx มาด้วย
     */
    private sendToWsServer(payload: LogPayload): void {
        if (!this.wsLogServerUrl) return;

        const isActivity = payload.level === "INFO" || payload.level === "DEBUG";
        if (isActivity && payload.trackingStatus === "F") return;

        try {
            if (typeof fetch !== "undefined") {
                fetch(this.wsLogServerUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }).catch(() => {
                    /* tracker ล่มต้องไม่ทำให้แอปพัง */
                });
            }
        } catch {
            // Prevent crash
        }
    }

    private emit(level: LogLevelName, message: string, meta?: any): void {
        if (!this.shouldLog(LogLevel[level])) return;

        const payload = this.buildPayload(level, message, meta);

        // ERROR/FATAL ลง console เสมอทุก env — WS เป็น fire & forget ที่ silent-fail
        // ถ้าพึ่ง WS อย่างเดียวแล้วส่งไม่ถึง (หรือไม่ได้ตั้ง WS_LOG_SERVER_URL)
        // error จะหายไปเงียบๆ ไม่มีที่ไหนเห็นเลย รวมถึง pm2 log
        if (this.consoleEnabled || level === "ERROR" || level === "FATAL") {
            this.toConsole(payload);
        }
        if (isFileSinkEnabled()) writeLine(payload);
        this.sendToWsServer(payload);
    }

    // --- Standard Logging Methods ---

    /**
     * ใช้เฉพาะตอนที่ process กำลังจะตาย — เขียนไฟล์แบบ sync เพราะ append แบบ async
     * จะไม่มีวัน flush ก่อน process.exit()
     */
    public fatal(message: string, meta?: any): void {
        if (!this.shouldLog(LogLevel.FATAL)) return;

        const payload = this.buildPayload("FATAL", message, meta);
        this.toConsole(payload);
        if (isFileSinkEnabled()) writeLineSync(payload);
        this.sendToWsServer(payload);
    }

    public error(message: string, meta?: any): void {
        this.emit("ERROR", message, meta);
    }

    public warn(message: string, meta?: any): void {
        this.emit("WARN", message, meta);
    }

    public info(message: string, meta?: any): void {
        this.emit("INFO", message, meta);
    }

    public debug(message: string, meta?: any): void {
        this.emit("DEBUG", message, meta);
    }

    // --- Specialized Logging Methods ---

    /**
     * userId/userName/trackingStatus มาจาก context อัตโนมัติผ่าน buildPayload
     * ไม่ต้อง decode JWT ซ้ำที่นี่ (contextMiddleware ทำไปแล้วก่อนหน้า)
     */
    public logRequest(method: string, url: string, body?: any, headers?: any): void {
        if (this.shouldLog(LogLevel.INFO)) {
            const meta = {
                method,
                url,
                // ส่ง body ดิบเข้าไปให้ redact() จัดการ — JSON.stringify ก่อนจะทำให้
                // password กลายเป็น string ที่ mask ไม่ได้แล้ว
                body,
                userAgent: headers?.["user-agent"],
                ip: headers?.["x-forwarded-for"] || headers?.["x-real-ip"],
            };
            this.info(`HTTP Request: ${method} ${url}`, meta);
        }
    }

    public logResponse(method: string, url: string, statusCode: number, duration: number): void {
        if (this.shouldLog(LogLevel.INFO)) {
            const meta = {
                method,
                url,
                statusCode,
                duration: `${duration}ms`,
            };
            this.info(`HTTP Response: ${method} ${url} - ${statusCode}`, meta);
        }
    }

    public logSQL(sql: string, params?: any, duration?: number): void {
        // ใช้ INFO level แทน DEBUG เพื่อให้แสดงผลใน default config และส่ง WebSocket ได้ง่ายขึ้น
        if (this.shouldLog(LogLevel.INFO)) {
            const meta = {
                sql: sql.replace(/\s+/g, " ").trim(),
                params,
                duration: duration ? `${duration}ms` : undefined,
            };
            // ใช้ info แทน debug เพื่อให้เห็น log SQL ได้ง่ายขึ้น
            this.debug("SQL Query Executed", meta);
        }
    }

    public logSQLError(sql: string, params?: any, error?: any): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            const meta = {
                sql: sql.replace(/\s+/g, " ").trim(),
                params,
                error: error?.message || error,
            };
            this.error("SQL Query Failed", meta);
        }
    }

    public LogSqlResult(
        sql: string,
        params?: any,
        duration?: number,
        rowsAffected?: number,
        output?: Record<string, unknown>,
    ): void {
        if (this.shouldLog(LogLevel.INFO)) {
            const meta = {
                sql: sql.replace(/\s+/g, " ").trim(),
                params,
                duration: duration ? `${duration}ms` : undefined,
                rowsAffected,
                output,
            };
            // ใช้ info แทน debug
            this.debug("SQL Query Executed", meta);
        }
    }

    // --- Utility Methods ---

    public setEnabled(enabled: boolean): void {
        this.enabledOverride = enabled;
    }

    public setLogLevel(level: LogLevel): void {
        this.logLevelOverride = level;
    }
}

// Export Singleton
export const logger = Logger.getInstance();

// Export Convenience Functions (Helper Wrappers)
export const logRequest = (method: string, url: string, body?: any, headers?: any) =>
    logger.logRequest(method, url, body, headers);
export const logResponse = (method: string, url: string, statusCode: number, duration: number) =>
    logger.logResponse(method, url, statusCode, duration);
