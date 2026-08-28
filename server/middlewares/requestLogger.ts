import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { context } from "../utils/context";

/**
 * dev เสิร์ฟ SPA ผ่าน Vite middleware ทำให้ทุก module, stylesheet และ HMR ping
 * ไหลเข้ามาที่ dashboard จนกลบ traffic จริง
 */
const NOISE =
    /^\/(@vite|@react-refresh|@fs|node_modules|src\/|assets\/|favicon|.*\.(js|mjs|ts|tsx|jsx|css|map|ico|png|jpe?g|svg|woff2?)$)/;

function isNoise(req: Request): boolean {
    return req.method === "GET" && NOISE.test(req.path);
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    if (isNoise(req)) {
        // mark ไว้ให้ errorHandler เงียบด้วย — asset ที่หาไม่เจอจะไปโผล่ที่
        // notFoundHandler แล้วกลับเข้า log เป็น WARN หนึ่งอันต่อไฟล์
        res.locals.skipLog = true;
        return next();
    }

    logger.logRequest(req.method, req.originalUrl, req.body, req.headers);

    const start = Date.now();
    // capture store ตรงนี้ ไม่ใช่อ่านข้างใน handler: listener ของ "finish" ทำงานใน
    // async context ของ emitter ซึ่ง AsyncLocalStorage อาจว่างเปล่า
    const store = context.getStore();

    res.on("finish", () => {
        // errorHandler log failure นี้พร้อม stack ไปแล้ว — อย่าซ้ำ
        if (res.locals?.errorLogged) return;

        const log = () =>
            logger.logResponse(req.method, req.originalUrl, res.statusCode, Date.now() - start);

        if (store) context.run(store, log);
        else log();
    });

    next();
}
