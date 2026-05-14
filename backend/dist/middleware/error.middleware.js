"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const shared_types_1 = require("../types/shared.types");
// ── Global Error Handler ─────────────────────
const errorHandler = (err, _req, res, _next) => {
    // Operational errors (AppError): send structured response
    if (err instanceof shared_types_1.AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }
    // Prisma known request errors
    if (err.name === "PrismaClientKnownRequestError") {
        const prismaErr = err;
        if (prismaErr.code === "P2002") {
            const field = prismaErr.meta?.target?.[0] ?? "field";
            res.status(409).json({
                success: false,
                message: `A record with this ${field} already exists.`,
            });
            return;
        }
        if (prismaErr.code === "P2025") {
            res.status(404).json({
                success: false,
                message: "Record not found.",
            });
            return;
        }
    }
    // JWT errors
    if (err.name === "JsonWebTokenError") {
        res.status(401).json({ success: false, message: "Invalid token." });
        return;
    }
    if (err.name === "TokenExpiredError") {
        res.status(401).json({ success: false, message: "Token has expired." });
        return;
    }
    // Unknown / unexpected errors
    console.error("Unhandled Error:", err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === "production"
            ? "An unexpected error occurred."
            : err.message,
    });
};
exports.errorHandler = errorHandler;
// ── 404 Handler ──────────────────────────────
const notFoundHandler = (req, _res, next) => {
    next(new shared_types_1.AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=error.middleware.js.map