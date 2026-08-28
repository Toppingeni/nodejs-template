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
// ลำดับความสำคัญ: `.env.<NODE_ENV>` > `.env` > env ที่ inherit มา
//
// `.env` โหลดก่อนแล้ว `.env.<NODE_ENV>` ทับด้วย override — ถ้าโหลด specific ก่อน
// แล้ว `.env` ตามด้วย override (แบบที่ทำครั้งแรก) `.env` จะชนะใน production
// ทำให้ไฟล์ env-specific ไม่มีความหมายเลย
//
// ใน production `.env` โหลดด้วย override เพื่อให้ไฟล์ที่ deploy เขียนมาชนะตัวแปร
// ที่รั่วจาก pm2 daemon (เช่น PORT ค้าง) ซึ่งจะทำให้ bind ผิด port
// จับ NODE_ENV ไว้ก่อนโหลดไฟล์ — ถ้าอ่านทีหลัง `.env` (ที่โหลดด้วย override) จะทับ
// ค่าไปแล้ว แล้วเราจะไปหา `.env.development` ทั้งที่ถูกสั่งมาเป็น production
const nodeEnv = process.env.NODE_ENV;
const isProd = nodeEnv === "production";
dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: isProd });
if (nodeEnv) {
    dotenv.config({
        path: path.resolve(process.cwd(), `.env.${nodeEnv}`),
        override: true,
    });
}

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
