"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const shared_types_1 = require("../types/shared.types");
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
class AuthService {
    // ── Login ──────────────────────────────────
    async login(dto) {
        const { email, password } = dto;
        const user = await prisma_1.default.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                officeId: true,
                avatarUrl: true,
                passwordHash: true,
                isActive: true,
            },
        });
        if (!user) {
            throw new shared_types_1.AppError("Invalid email or password.", 401);
        }
        if (!user.isActive) {
            throw new shared_types_1.AppError("Your account has been deactivated. Contact admin.", 403);
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new shared_types_1.AppError("Invalid email or password.", 401);
        }
        // Update last login time
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: user.role,
            officeId: user.officeId,
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                officeId: user.officeId,
                avatarUrl: user.avatarUrl,
            },
        };
    }
    // ── Get Profile ────────────────────────────
    async getProfile(userId) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                avatarUrl: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                office: {
                    select: { id: true, name: true, city: true },
                },
            },
        });
        if (!user)
            throw new shared_types_1.AppError("User not found.", 404);
        return user;
    }
    // ── Change Password ────────────────────────
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true },
        });
        if (!user)
            throw new shared_types_1.AppError("User not found.", 404);
        const isValid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isValid)
            throw new shared_types_1.AppError("Current password is incorrect.", 400);
        const newHash = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { passwordHash: newHash },
        });
    }
    // ── Hash Password (static utility) ────────
    static async hashPassword(password) {
        return bcryptjs_1.default.hash(password, 12);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map