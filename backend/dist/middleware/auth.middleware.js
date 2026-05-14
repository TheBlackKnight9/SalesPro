"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const shared_types_1 = require("../types/shared.types");
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-prod";
// ── Verify JWT Token ─────────────────────────
const authenticate = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new shared_types_1.AppError("No token provided. Access denied.", 401));
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        next(new shared_types_1.AppError("Invalid or expired token.", 401));
    }
};
exports.authenticate = authenticate;
// ── Role Guard Factory ───────────────────────
const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new shared_types_1.AppError("Not authenticated.", 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new shared_types_1.AppError(`Access denied. Required role: ${roles.join(" or ")}`, 403));
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map