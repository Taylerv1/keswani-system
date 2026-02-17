import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

const errorHandler = (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error(`[ERROR] ${err.message}`, {
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });

    const statusCode = err.statusCode || 500;
    const message =
        process.env.NODE_ENV === "production" && statusCode === 500
            ? "Internal server error"
            : err.message;

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

export default errorHandler;
