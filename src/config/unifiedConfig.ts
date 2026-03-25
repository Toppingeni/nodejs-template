import { z } from "zod";
import fs from "fs";
import path from "path";
import Vault from "node-vault-client";
import { getErrorMessage } from "../utils/error";

// อ่านชื่อโปรเจกต์จาก package.json สำหรับใช้เป็น Vault Path
const pkgPath = path.resolve(__dirname, "../../package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const projectName = pkg.name;

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "dev", "production", "prod", "staging", "stag"])
        .default("development"),
    PORT: z.coerce.number().default(3000),
    TNS_PATH: z.string(),
    ORACLE_CLIENT_PATH: z.string(),
    ORACLE_DB_NAME: z.string().optional(),
    ORACLE_USER: z.string().optional(),
    ORACLE_PWD: z.string().optional(),
    APP_ID: z.string().optional(),
    JWT_SECRET: z.string().optional(),
    ENABLE_LOGGING: z.coerce.boolean().default(true),
    LOG_LEVEL: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]).default("DEBUG"),
    WS_LOG_SERVER_URL: z.string().optional(),
});

// กำหนด Object Config ทิ้งไว้ให้เป็นแบบ Mutable เพื่อนำไป import ใช้ได้เลยโดยไม่ต้อง await
export const config = {} as z.infer<typeof envSchema>;

export const initVaultConfig = async () => {
    // 1. ระบุ Environment
    const nodeEnv = process.env.NODE_ENV || "development";
    let envPrefix = "development";

    if (nodeEnv.startsWith("prod")) envPrefix = "prod";
    else if (nodeEnv.startsWith("stag")) envPrefix = "stag";

    const vaultUrl = process.env.VAULT_URL;
    const vaultUser = process.env.VAULT_USER;
    const vaultPwd = process.env.VAULT_PWD;

    let globalConfig = {};
    let projectConfig = {};

    if (vaultUrl && vaultUser && vaultPwd) {
        try {
            // ขอ Token จาก Vault ผ่านประเภท Userpass ด้วย fetch
            const loginRes = await fetch(
                `${vaultUrl}/v1/auth/userpass/login/${vaultUser}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password: vaultPwd }),
                },
            );

            if (!loginRes.ok) {
                throw new Error(`Vault Login Failed: ${loginRes.statusText}`);
            }

            const loginData = (await loginRes.json()) as {
                auth: { client_token: string };
            };
            const clientToken = loginData.auth.client_token;

            // ตั้งค่า Vault Client
            const vault = Vault.boot("main", {
                api: { url: vaultUrl },
                auth: { type: "token", config: { token: clientToken } },
            });

            // ดึงข้อมูล Global Config
            const platform = process.platform;
            const osFolder =
                platform === "win32"
                    ? "windows"
                    : platform === "darwin"
                      ? "mac"
                      : "linux";
            const globalPathOverride = process.env.VAULT_GLOBAL_PATH?.trim();
            const globalPath =
                globalPathOverride && globalPathOverride.length > 0
                    ? globalPathOverride
                    : `global/data/${envPrefix}/${osFolder}`;
            try {
                console.log(globalPath);
                const globalRes = await vault.read(globalPath);
                globalConfig = globalRes.data?.data || {};
            } catch (e) {
                console.warn(
                    `[Vault] Could not read global config at ${globalPath}: ${getErrorMessage(e)}`,
                );
            }

            // ดึงข้อมูล Project Config
            const projectPathOverride = process.env.VAULT_PROJECT_PATH?.trim();
            const projectPath =
                projectPathOverride && projectPathOverride.length > 0
                    ? projectPathOverride
                    : `${envPrefix}/data/${projectName}`;
            try {
                const projectRes = await vault.read(projectPath);
                projectConfig = projectRes.data?.data || {};
            } catch (e) {
                console.warn(
                    `[Vault] Could not read project config at ${projectPath}: ${getErrorMessage(e)}`,
                );
            }
        } catch (error) {
            console.warn(
                `[Vault Warning] Error connecting to vault: ${getErrorMessage(error)}`,
            );
        }
    } else {
        console.warn(
            "[Vault Insight] Vault credentials (URL/USER/PWD) not fully provided, relying on local .env only",
        );
    }

    // 2. ลำดับความสำคัญในการทับซ้อน (Merge) ข้อมูล: Process Env ทับ Project ทับ Global
    const mergedData = {
        ...globalConfig,
        ...projectConfig,
        ...process.env,
    };

    const _env = envSchema.safeParse(mergedData);

    if (!_env.success) {
        console.error("❌ Invalid environment variables:", _env.error.format());
        throw new Error("Invalid environment variables");
    }

    // 3. Assign กลับไปยัง Object `config` ที่ส่งออกไว้แต่แรก เพื่อให้ Modules อื่นอัปเดตค่าไปตาม ๆ กันทันที
    Object.assign(config, _env.data);
    console.log(
        `[Config] Loaded environment variables successfully for environment: ${envPrefix}`,
    );
};
