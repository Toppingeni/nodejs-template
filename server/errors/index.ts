/**
 * Base application error — carries HTTP status code and an optional machine-readable code.
 */
export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number,
        public code?: string,
    ) {
        super(message);
        this.name = this.constructor.name;
        // Maintain prototype chain for instanceof checks
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** 400 Bad Request — invalid input from the caller. */
export class ValidationError extends AppError {
    constructor(message: string, code?: string) {
        super(message, 400, code ?? "VALIDATION_ERROR");
    }
}

/** 401 Unauthorized — missing or invalid credentials. */
export class AuthenticationError extends AppError {
    constructor(message = "Authentication required", code?: string) {
        super(message, 401, code ?? "AUTHENTICATION_ERROR");
    }
}

/** 403 Forbidden — authenticated but not permitted. */
export class AuthorizationError extends AppError {
    constructor(message = "Insufficient permissions", code?: string) {
        super(message, 403, code ?? "AUTHORIZATION_ERROR");
    }
}

/** 404 Not Found — requested resource does not exist. */
export class NotFoundError extends AppError {
    constructor(message: string, code?: string) {
        super(message, 404, code ?? "NOT_FOUND");
    }
}

/** 409 Conflict — resource already exists or state conflict. */
export class ConflictError extends AppError {
    constructor(message: string, code?: string) {
        super(message, 409, code ?? "CONFLICT");
    }
}

/** 500 Internal Server Error — database or infrastructure failure. */
export class DatabaseError extends AppError {
    constructor(
        message: string,
        public readonly query?: string,
        code?: string,
    ) {
        super(message, 500, code ?? "DATABASE_ERROR");
    }
}
