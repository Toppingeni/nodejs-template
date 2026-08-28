import { Request, Response, NextFunction } from "express";
import { context } from "../utils/context";
import { decodeTokenUnsafe } from "../utils/jwt";

export const contextMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    let userId = "anonymous";
    let userName = "Anonymous";
    let orgId: string | undefined;
    let trackingStatus: string | undefined;

    try {
        const authHeader = req.headers["authorization"];
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const decoded = decodeTokenUnsafe(token);
            if (decoded) {
                userId = decoded.userId;
                userName = decoded.userName;
                orgId = decoded.orgId;
                trackingStatus = decoded.trackingStatus;
            }
        }
    } catch {
        // Use defaults if decode fails
    }

    const store = {
        userId,
        userName,
        orgId,
        requestId:
            (req.headers["x-request-id"] as string) ||
            `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        trackingStatus,
    };

    context.run(store, () => {
        next();
    });
};
