import { Request, Response, NextFunction } from "express";

export interface AuditFieldsInfo {
  userId: string;
  orgId: string;
}

/**
 * Middleware: Decode JWT → แนบ userId, orgId ลง req.body + req.userInfo
 * ใช้สำหรับ POST/PUT routes ที่ต้องการ audit fields
 */
export function addAuditFields(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  let userId = "anonymous";
  let orgId = "";

  try {
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        userId = payload.nameid || payload.sub || "unknown_user";
        orgId = payload.ORG || "";
      }
    }
  } catch {
    // ใช้ค่า default ถ้า decode ไม่ผ่าน
  }

  // แนบ audit fields ลง body สำหรับ POST/PUT/PATCH
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    if (!req.body) req.body = {};
    req.body.userId = userId;
    req.body.orgId = orgId;
  }

  next();
}
