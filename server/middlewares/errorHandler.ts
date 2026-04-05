import { Request, Response, NextFunction } from "express";
import { ValidateError } from "@tsoa/runtime";
import { AppError } from "../errors";

interface ErrorResponse {
    status: number;
    message: string;
    code?: string;
    details?: unknown;
    stack?: string;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    // TSOA validation errors
    if (err instanceof ValidateError) {
        const response: ErrorResponse = {
            status: 400,
            message: "Validation Failed",
            code: "VALIDATION_ERROR",
            details: err.fields,
        };
        res.status(400).json(response);
        return;
    }

    // Custom application errors
    if (err instanceof AppError) {
        const response: ErrorResponse = {
            status: err.statusCode,
            message: err.message,
            code: err.code,
        };
        if (process.env.NODE_ENV === "development") {
            response.stack = err.stack;
        }
        res.status(err.statusCode).json(response);
        return;
    }

    // Unknown errors
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    const response: ErrorResponse = {
        status: statusCode,
        message: err instanceof Error ? err.message : String(err),
    };

    if (process.env.NODE_ENV === "development") {
        response.stack = err instanceof Error ? err.stack : undefined;
    }

    res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
    res.status(404);
    const error = new Error(`Not Found - ${req.originalUrl}`);
    next(error);
}
