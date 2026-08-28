// Set application timezone to match server location
process.env.TZ = "Asia/Bangkok";

import path from "path";
import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// โหลด .env จาก process.cwd() เพื่อให้ dev (รันจาก repo root) และ prod
// (dist/server/node-build.mjs ที่ PM2 รันจาก repo root) เจอไฟล์เดียวกัน
//
// เดิม anchor ที่ __dirname + ชื่อ `.env.<NODE_ENV>` อย่างเดียว — prod bundle จึงไปหา
// `dist/.env.production` ซึ่งไม่มีวันมีอยู่ แล้ว boot ตายเพราะ TNS_PATH ไม่ถูก set
// (dev ก็หา `.env.development` ไม่เจอเหมือนกัน แค่รอดมาได้เพราะ Vault เติมค่าให้)
//
// โหลด env-specific ก่อน (ชนะ เพราะ dotenv ไม่ override ค่าที่ตั้งแล้ว) แล้ว `.env`
// เติมที่เหลือ. ใน production ให้ `.env` ที่ deploy เขียนมาเป็นเจ้าของค่า — ไม่งั้น
// ตัวแปรที่รั่วมาจาก pm2 daemon (เช่น PORT) จะบัง แล้วแอป bind ผิด port
const overrideEnv = process.env.NODE_ENV === "production";
if (process.env.NODE_ENV) {
    dotenv.config({
        path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
    });
}
dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: overrideEnv });

import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { contextMiddleware } from "./middlewares/contextMiddleware";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./tsoa/swagger.json";
import { RegisterRoutes } from "./tsoa/routes";
import { requestLogger } from "./middlewares/requestLogger";

// Setup Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * สร้าง Express app instance พร้อม middleware + routes
 * ไม่รวม error handlers (ให้ entry point เพิ่มเอง หลัง static/SPA fallback)
 */
export function createServer() {
    const app = express();

    // Security & parsing
    app.use(helmet());
    app.use(limiter);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // context ต้องมาก่อน — requestLogger อ่าน identity (userId/requestId) จากมัน
    // แทนที่จะ decode JWT ซ้ำอีกรอบ
    app.use(contextMiddleware);
    app.use(requestLogger);

    // CORS
    const corsOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
        : ["http://localhost:3000", "http://localhost:8080"];
    app.use(cors({ origin: corsOrigins }));

    // Swagger
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    // TSOA auto-generated routes
    RegisterRoutes(app);

    return app;
}

export { errorHandler, notFoundHandler };
