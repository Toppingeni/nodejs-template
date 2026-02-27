import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3000),
    ORACLE_CLIENT_PATH: z.string().optional(),
    ORACLE_DB_NAME: z.string().optional(),
    APP_ID: z.string().optional(),
    JWT_SECRET: z.string().optional(),
    ENABLE_LOGGING: z.coerce.boolean().default(true),
    LOG_LEVEL: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]).default("DEBUG"),
    WS_LOG_SERVER_URL: z.string(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error("❌ Invalid environment variables:", _env.error.format());
    throw new Error("Invalid environment variables");
}

export const config = _env.data;
