import { Request } from "express";
import { verifyToken, decodeTokenUnsafe } from "../utils/jwt";
import { AuthenticationError } from "../errors";

/**
 * TSOA authentication handler.
 * Referenced in tsoa.json → authenticationModule.
 *
 * @param request  - Express request
 * @param securityName - Security scheme name (e.g. "jwt")
 * @param _scopes  - OAuth scopes (unused for JWT)
 */
export function expressAuthentication(
    request: Request,
    securityName: string,
    _scopes?: string[],
): Promise<unknown> {
    if (securityName === "jwt") {
        const authHeader = request.headers["authorization"];

        // ต้อง reject ด้วย AuthenticationError → HTTP 401 (ไม่ใช่ 500)
        // client interceptor ที่ refresh token อัตโนมัติดูจาก 401 — ถ้าโยน Error ธรรมดา
        // จะหลุดไป errorHandler เป็น 500 แล้ว refresh ไม่ทำงาน
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return Promise.reject(new AuthenticationError("No Bearer token provided"));
        }

        const token = authHeader.substring(7);

        try {
            // Try verifying with our secret first
            const decoded = verifyToken(token);
            return Promise.resolve(decoded);
        } catch {
            // If JWT_SECRET is not set or token uses external signing,
            // fall back to unsafe decode (gateway-forwarded tokens)
            const decoded = decodeTokenUnsafe(token);
            if (decoded) {
                return Promise.resolve(decoded);
            }
            return Promise.reject(new AuthenticationError("Invalid or expired token"));
        }
    }

    return Promise.reject(new Error(`Unsupported security scheme: ${securityName}`));
}
