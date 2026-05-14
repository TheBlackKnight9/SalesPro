"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const shared_types_1 = require("../types/shared.types");
const authService = new auth_service_1.AuthService();
class AuthController {
    // POST /api/auth/login
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                throw new shared_types_1.AppError("Email and password are required.", 400);
            }
            const result = await authService.login({ email, password });
            res.status(200).json({
                success: true,
                message: "Login successful.",
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    // GET /api/auth/profile
    async getProfile(req, res, next) {
        try {
            if (!req.user)
                throw new shared_types_1.AppError("Not authenticated.", 401);
            const profile = await authService.getProfile(req.user.userId);
            res.status(200).json({
                success: true,
                message: "Profile fetched.",
                data: profile,
            });
        }
        catch (err) {
            next(err);
        }
    }
    // PUT /api/auth/change-password
    async changePassword(req, res, next) {
        try {
            if (!req.user)
                throw new shared_types_1.AppError("Not authenticated.", 401);
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                throw new shared_types_1.AppError("currentPassword and newPassword are required.", 400);
            }
            if (newPassword.length < 8) {
                throw new shared_types_1.AppError("New password must be at least 8 characters.", 400);
            }
            await authService.changePassword(req.user.userId, currentPassword, newPassword);
            res.status(200).json({
                success: true,
                message: "Password changed successfully.",
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map