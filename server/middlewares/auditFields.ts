import { Request, Response, NextFunction } from "express";
import { decodeTokenUnsafe } from "../utils/jwt";

export interface AuditFieldsInfo {
    userId: string;
    orgId: string;
}

/**
 * Middleware: Decode JWT and attach userId, orgId to req.body + req.userInfo.
 * Used for POST/PUT routes that require audit fields.
 */
export function addAuditFields(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    let userId = "anonymous";
    let orgId = "";

    try {
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const decoded = decodeTokenUnsafe(token);
            if (decoded) {
                userId = decoded.userId;
                orgId = decoded.orgId || "";
            }
        }
    } catch {
        // Use defaults if decode fails
    }

    if (["POST", "PUT", "PATCH"].includes(req.method)) {
        if (!req.body) req.body = {};
        req.body.userId = userId;
        req.body.orgId = orgId;
    }

    next();
}
