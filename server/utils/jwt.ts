import jwt from "jsonwebtoken";
import { config } from "../config/unifiedConfig";

export interface DecodedUser {
    userId: string;
    userName: string;
    orgId?: string;
    trackingStatus?: string;
    exp?: number;
    iat?: number;
}

/**
 * Parse raw JWT payload object into a normalised DecodedUser.
 * Handles the various claim name conventions used across systems.
 */
function normalisePayload(payload: Record<string, unknown>): DecodedUser {
    const userId = String(payload.nameid || payload.userId || payload.sub || "unknown_user");
    const userName = String(payload.UserName || payload.username || payload.name || "Unknown User");
    const orgId = payload.ORG ? String(payload.ORG) : undefined;
    const trackingStatus = payload.TrackingStatus ? String(payload.TrackingStatus) : undefined;
    const exp = typeof payload.exp === "number" ? payload.exp : undefined;
    const iat = typeof payload.iat === "number" ? payload.iat : undefined;

    return { userId, userName, orgId, trackingStatus, exp, iat };
}

/**
 * Verify a JWT token's signature and expiration using JWT_SECRET from config.
 * Throws if the token is invalid or expired.
 */
export function verifyToken(token: string): DecodedUser {
    const secret = config.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    const payload = jwt.verify(token, secret) as Record<string, unknown>;
    return normalisePayload(payload);
}

/**
 * Decode a JWT token without verifying the signature.
 * Use only for cases where external tokens are not signed with our secret
 * (e.g., reading context from a gateway-forwarded token).
 * Returns null if the token is malformed.
 */
export function decodeTokenUnsafe(token: string): DecodedUser | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8")) as Record<
            string,
            unknown
        >;

        // Still check expiration even without signature verification
        if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return normalisePayload(payload);
    } catch {
        return null;
    }
}
