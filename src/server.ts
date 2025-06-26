// Set application timezone to match server location
process.env.TZ = "Asia/Bangkok";

import express from "express";
import { initOracleClient } from "oracledb";
import dotenv from "dotenv";
// Load environment variables first
dotenv.config({
    path: `${__dirname}/../.env${
        process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""
    }`,
});
console.log("ORACLE_CLIENT_PATH", process.env.ORACLE_CLIENT_PATH);
if (process.env.ORACLE_CLIENT_PATH) {
    try {
        initOracleClient({ libDir: process.env.ORACLE_CLIENT_PATH });
    } catch (err) {
        console.error("Failed to initialize Oracle Client:", err);
        throw new Error(
            "Cannot load Oracle Client. Ensure ORACLE_CLIENT_PATH is set correctly."
        );
    }
} else {
    console.warn(
        "ORACLE_CLIENT_PATH is not set. Ensure the Oracle Client is installed and configured."
    );
}

// Error handling
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
// import { initSequelize } from "./libs/sequelize";

//// Initialize Sequelize before starting the server
// (async () => {
//     try {
//         await initSequelize();
//         console.log("Database initialized successfully");
//     } catch (error) {
//         console.error("Failed to initialize database:", error);
//         process.exit(1);
//     }
// })();

import router from "./routes";
import cors from "cors";
// Now import other modules that depend on environment variables
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express.json());
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// exit
process.on("SIGINT", () => {
    console.log("Server shutting down...");
    process.exit(0);
});
process.on("SIGTERM", () => {
    console.log("Server shutting down...");
    process.exit(0);
});

// import { createModel } from "./utils/modelGenerator";
// async function main() {
//     createModel("SUPPLIER");
// }
// main();
