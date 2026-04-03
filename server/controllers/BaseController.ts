import { Controller } from "tsoa";
import { logger } from "../utils/logger";

export abstract class BaseController extends Controller {
    /**
     * สำหรับเตรียมรูปแบบข้อมูลเป้าหมายที่เป็นการ Response กลับไปอย่างถูกต้องและมั่นใจได้
     */
    protected handleSuccess<T>(
        data: T,
        message: string = "Success",
        statusCode: number = 200,
    ) {
        this.setStatus(statusCode);
        return { message, data };
    }

    /**
     * ดักจับ Error และส่งต่อไปที่ Global Error Handler
     */
    protected handleError(error: unknown, methodName: string): never {
        logger.error(`Error in ${methodName}:`, error);
        throw error;
    }
}
