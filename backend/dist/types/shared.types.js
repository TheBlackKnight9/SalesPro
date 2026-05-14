"use strict";
// ─────────────────────────────────────────────
// Shared Types for SalesPro CRM Backend
// ─────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
// ── App Error ────────────────────────────────
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=shared.types.js.map