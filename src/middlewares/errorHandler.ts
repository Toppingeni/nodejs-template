import { Request, Response, NextFunction } from "express";
import { ValidateError } from "tsoa";

interface ErrorResponse {
    status: number;
    message: string;
    stack?: string;
}

export function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (err instanceof ValidateError) {
        res.status(400).json({
            status: 400,
            message: "Validation Failed",
            details: err.fields,
        });
        return;
    }

    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    const response: ErrorResponse = {
        status: statusCode,
        message: err instanceof Error ? err.message : String(err),
    };

    // Only show stack in development
    if (process.env.NODE_ENV === "development") {
        response.stack = err instanceof Error ? err.stack : undefined;
    }

    res.status(statusCode).json(response);
}

export function notFoundHandler(
    req: Request,
    res: Response,
    next: NextFunction
) {
    res.status(404);
    const error = new Error(`Not Found - ${req.originalUrl}`);
    next(error);
}
