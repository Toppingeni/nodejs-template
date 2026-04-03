// Set application timezone to match server location
process.env.TZ = "Asia/Bangkok";

import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Load environment variables first
dotenv.config({
  path: `${__dirname}/../.env${
    process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""
  }`,
});

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

  // Request context & logging
  app.use(requestLogger);
  app.use(contextMiddleware);

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
