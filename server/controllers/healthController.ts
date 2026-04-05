import { Get, Route, Tags } from "@tsoa/runtime";
import { Controller } from "@tsoa/runtime";
import { getOracle } from "../libs/oracle";

interface HealthResponse {
    status: "ok" | "error";
    timestamp: string;
    uptime: number;
}

interface ReadyResponse extends HealthResponse {
    database: "connected" | "disconnected";
}

@Route("health")
@Tags("Health")
export class HealthController extends Controller {
    /** Basic health check — always returns ok if server is running */
    @Get("/")
    public async getHealth(): Promise<HealthResponse> {
        return {
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    }

    /** Readiness check — verifies database connectivity */
    @Get("/ready")
    public async getReady(): Promise<ReadyResponse> {
        try {
            const oracle = getOracle();
            await oracle.query<{ RESULT: number }>("SELECT 1 AS RESULT FROM DUAL");
            return {
                status: "ok",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: "connected",
            };
        } catch {
            this.setStatus(503);
            return {
                status: "error",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: "disconnected",
            };
        }
    }
}
