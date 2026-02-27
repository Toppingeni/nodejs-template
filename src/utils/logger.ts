import { context } from './context';

/* eslint-disable @typescript-eslint/no-explicit-any */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export class Logger {
  private static instance: Logger;
  private enabled: boolean;
  private logLevel: LogLevel;
  private wsLogServerUrl: string | undefined;

  private constructor() {
    // Config จาก Environment Variables
    this.enabled = process.env.ENABLE_LOGGING !== 'false';
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'INFO');
    this.wsLogServerUrl = process.env.WS_LOG_SERVER_URL;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return LogLevel.ERROR;
      case 'WARN':
        return LogLevel.WARN;
      case 'INFO':
        return LogLevel.INFO;
      case 'DEBUG':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.enabled && level <= this.logLevel;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  /**
   * ส่ง Log ไป WebSocket (Fire & Forget)
   * ใช้ context.getStore() เพื่อดึง User Info อัตโนมัติ
   */
  private async sendToWsServer(level: string, message: string, meta?: any) {
    if (!this.wsLogServerUrl) return;

    // ดึง Context ปัจจุบัน
    const store = context.getStore();

    // Logic ตรวจสอบ TrackingStatus (ถ้ามี)
    const trackingStatus = meta?.trackingStatus || store?.trackingStatus;
    if (trackingStatus === 'F') return;

    try {
      const logPayload = {
        timestamp: new Date().toISOString(),
        level,
        service: 'oppn-backend',
        message,
        userId: store?.userId, // Auto-inject user id
        userName: store?.userName,
        trackingStatus,
        ...meta,
      };

      if (typeof fetch !== 'undefined') {
        fetch(this.wsLogServerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logPayload),
        }).catch(() => {
          /* Ignore errors */
        });
      }
    } catch (e) {
      // Prevent crash
    }
  }

  // --- Standard Logging Methods ---

  public error(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      if (process.env.NODE_ENV === 'development') console.error(this.formatMessage('ERROR', message, meta));
      this.sendToWsServer('ERROR', message, meta);
    }
  }

  public warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      if (process.env.NODE_ENV === 'development') console.warn(this.formatMessage('WARN', message, meta));
      this.sendToWsServer('WARN', message, meta);
    }
  }

  public info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      if (process.env.NODE_ENV === 'development') console.log(this.formatMessage('INFO', message, meta));
      this.sendToWsServer('INFO', message, meta);
    }
  }

  public debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      if (process.env.NODE_ENV === 'development') console.log(this.formatMessage('DEBUG', message, meta));
      this.sendToWsServer('DEBUG', message, meta);
    }
  }

  // --- Specialized Logging Methods ---

  public logRequest(method: string, url: string, body?: any, headers?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      // Extract User ID from JWT manually here if needed for meta,
      // but sendToWsServer will also get it from context.
      // This part ensures we have user info even in the console log meta.
      let userId = 'anonymous';
      let userName = 'Anonymous';
      let trackingStatus: string | undefined;

      try {
        const authHeader = headers?.['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            userId = payload.nameid || payload.userId || payload.sub || 'unknown_user';
            userName = payload.UserName || payload.username || 'Unknown User';
            trackingStatus = payload.TrackingStatus;
          }
        }
      } catch (e) {
        /* Ignore */
      }

      const meta = {
        method,
        url,
        userId,
        userName,
        trackingStatus,
        body: body ? JSON.stringify(body) : undefined,
        userAgent: headers?.['user-agent'],
        ip: headers?.['x-forwarded-for'] || headers?.['x-real-ip'],
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
        sql: sql.replace(/\s+/g, ' ').trim(),
        params,
        duration: duration ? `${duration}ms` : undefined,
      };
      // ใช้ info แทน debug เพื่อให้เห็น log SQL ได้ง่ายขึ้น
      this.debug('SQL Query Executed', meta);
    }
  }

  public logSQLError(sql: string, params?: any, error?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const meta = {
        sql: sql.replace(/\s+/g, ' ').trim(),
        params,
        error: error?.message || error,
      };
      this.error('SQL Query Failed', meta);
    }
  }

  public LogSqlResult(sql: string, params?: any, duration?: number, rowsAffected?: number, output?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const meta = {
        sql: sql.replace(/\s+/g, ' ').trim(),
        params,
        duration: duration ? `${duration}ms` : undefined,
        rowsAffected,
        output,
      };
      // ใช้ info แทน debug
      this.debug('SQL Query Executed', meta);
    }
  }

  // --- Utility Methods ---

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Export Singleton
export const logger = Logger.getInstance();

// Export Convenience Functions (Helper Wrappers)
export const logRequest = (method: string, url: string, body?: any, headers?: any) => logger.logRequest(method, url, body, headers);
export const logResponse = (method: string, url: string, statusCode: number, duration: number) => logger.logResponse(method, url, statusCode, duration);
