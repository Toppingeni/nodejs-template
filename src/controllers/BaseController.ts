import { Response } from "express";

export abstract class BaseController {
    /**
     * สำหรับเตรียมรูปแบบข้อมูลเป้าหมายที่เป็นการ Response กลับไปอย่างถูกต้องและมั่นใจได้ 
     */
    protected handleSuccess<T>(res: Response, data: T, message: string = "Success", statusCode: number = 200): void {
        res.status(statusCode).json({
            message,
            data,
        });
    }

    /**
     * ดักจับ Error และส่งต่อไปที่ Global Error Handler (ไม่ใช้การ response โดยตรงเพื่อป้องกัน Code Duplication)
     * แต่จะโยนเป็น Error ออกไปเพื่อเข้าสู่ Pipeline
     */
    protected handleError(error: unknown, methodName: string): never {
        // สามารถเพิ่มการบันทึก log/Sentry ได้ที่ตรงนี้ (เช่น Sentry.captureException(error);)
        throw error;
    }
}
