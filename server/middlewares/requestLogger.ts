import { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const ip = req.headers["x-forwarded-for"] || req.ip;
    const auth = req.headers.authorization
        ? req.headers.authorization.startsWith("Bearer ")
            ? "Bearer token"
            : req.headers.authorization
        : "None";

    console.log(
        `[${new Date().toISOString()}] ${req.method} ${
            req.originalUrl
        } - IP: ${ip}, Auth: ${auth}`
    );

    next();
}
