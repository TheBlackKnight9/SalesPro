"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const shared_types_1 = require("../types/shared.types");
const auth_service_1 = require("./auth.service");
const client_1 = require("@prisma/client");
class UserService {
    // ── Create User ────────────────────────────
    async create(dto) {
        // Verify office exists
        const office = await prisma_1.default.office.findUnique({ where: { id: dto.officeId } });
        if (!office)
            throw new shared_types_1.AppError("Office not found.", 404);
        const passwordHash = await auth_service_1.AuthService.hashPassword(dto.password);
        return prisma_1.default.user.create({
            data: {
                officeId: dto.officeId,
                name: dto.name,
                email: dto.email.toLowerCase().trim(),
                phone: dto.phone,
                passwordHash,
                role: dto.role ?? client_1.UserRole.AGENT,
                avatarUrl: dto.avatarUrl,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                officeId: true,
                avatarUrl: true,
                isActive: true,
                createdAt: true,
            },
        });
    }
    // ── Get All Users (paginated + filtered) ──
    async findAll(page = 1, limit = 10, search, officeId, role) {
        const skip = (page - 1) * limit;
        const where = {
            ...(officeId && { officeId }),
            ...(role && { role }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { phone: { contains: search, mode: "insensitive" } },
                ],
            }),
        };
        const [users, total] = await Promise.all([
            prisma_1.default.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    avatarUrl: true,
                    lastLoginAt: true,
                    createdAt: true,
                    office: { select: { id: true, name: true } },
                    _count: {
                        select: { assignedLeads: true, tasks: true },
                    },
                },
            }),
            prisma_1.default.user.count({ where }),
        ]);
        return {
            data: users,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    // ── Get Single User ────────────────────────
    async findById(id) {
        const user = await prisma_1.default.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                avatarUrl: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                office: { select: { id: true, name: true, city: true } },
                _count: {
                    select: {
                        assignedLeads: true,
                        managedLeads: true,
                        tasks: true,
                        followUps: true,
                    },
                },
            },
        });
        if (!user)
            throw new shared_types_1.AppError("User not found.", 404);
        return user;
    }
    // ── Update User ────────────────────────────
    async update(id, dto) {
        await this.findById(id); // existence check
        return prisma_1.default.user.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.phone !== undefined && { phone: dto.phone }),
                ...(dto.role && { role: dto.role }),
                ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                ...(dto.officeId && { officeId: dto.officeId }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                avatarUrl: true,
                officeId: true,
                updatedAt: true,
            },
        });
    }
    // ── Soft Delete (deactivate) ───────────────
    async deactivate(id) {
        await this.findById(id);
        return prisma_1.default.user.update({
            where: { id },
            data: { isActive: false },
        });
    }
    // ── Get Users by Office ────────────────────
    async findByOffice(officeId) {
        return prisma_1.default.user.findMany({
            where: { officeId, isActive: true },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
            },
            orderBy: { name: "asc" },
        });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map