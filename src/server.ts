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

import { config, initVaultConfig } from "./config/unifiedConfig";
import { initializeDatabases } from "./bootstrap/init";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { contextMiddleware } from "./middlewares/contextMiddleware";
import router from "./routes";
import cors from "cors";

const app = express();

// Setup Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Middleware Setup
app.use(helmet()); // Add HTTP Security Headers
app.use(limiter); // Apply Rate Limiting
app.use(express.json());
app.use(contextMiddleware);
app.use(
    cors({
        origin: [
            "http://192.168.55.38:51106",
            "http://localhost:3101",
            "http://localhost:3000",
        ],
    })
);

// Routes
app.use("/", router);

// 404 Handler
app.use(notFoundHandler);

// Error Handler
app.use(errorHandler);

const startServer = async () => {
    try {
        // Initialize Vault/Config first
        await initVaultConfig();

        // Initialize Databases second
        await initializeDatabases();

        const PORT = config.PORT;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server due to initialization error:", error);
        process.exit(1);
    }
};

startServer();

// exit
process.on("SIGINT", () => {
    console.log("Server shutting down...");
    process.exit(0);
});
process.on("SIGTERM", () => {
    console.log("Server shutting down...");
    process.exit(0);
});

