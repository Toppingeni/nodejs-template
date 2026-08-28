import type { DecodedUser } from "../utils/jwt";

// เติม user ที่ expressAuthentication (TSOA `@Security("jwt")`) set ไว้เข้า Express Request
// เพื่อให้ controller อ่าน `req.user` ได้โดยไม่ต้อง cast
// เป็น optional เพราะ TSOA เติมให้เฉพาะ route ที่ต้อง auth
declare global {
    namespace Express {
        interface Request {
            user?: DecodedUser;
        }
    }
}

export {};
