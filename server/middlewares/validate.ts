import { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Middleware: Validate request body ด้วย Zod schema
 * ถ้า invalid → return 400 พร้อม field errors
 */
export const validate = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        errors: fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
};
