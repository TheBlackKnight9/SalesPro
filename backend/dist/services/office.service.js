"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficeService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const shared_types_1 = require("../types/shared.types");
class OfficeService {
    // ── Create Office ──────────────────────────
    async create(dto) {
        return prisma_1.default.office.create({
            data: {
                name: dto.name,
                address: dto.address,
                city: dto.city,
                state: dto.state,
                country: dto.country ?? "India",
                phone: dto.phone,
                email: dto.email,
            },
        });
    }
    // ── Get All Offices (paginated) ───────────
    async findAll(page = 1, limit = 10, search) {
        const skip = (page - 1) * limit;
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { city: { contains: search, mode: "insensitive" } },
                ],
            }
            : {};
        const [offices, total] = await Promise.all([
            prisma_1.default.office.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: { _count: { select: { users: true, leads: true } } },
            }),
            prisma_1.default.office.count({ where }),
        ]);
        return {
            data: offices,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    // ── Get Single Office ─────────────────────
    async findById(id) {
        const office = await prisma_1.default.office.findUnique({
            where: { id },
            include: {
                _count: { select: { users: true, leads: true, customers: true } },
            },
        });
        if (!office)
            throw new shared_types_1.AppError("Office not found.", 404);
        return office;
    }
    // ── Update Office ─────────────────────────
    async update(id, dto) {
        await this.findById(id); // existence check
        return prisma_1.default.office.update({ where: { id }, data: dto });
    }
    // ── Delete Office ─────────────────────────
    async delete(id) {
        const office = await this.findById(id);
        const userCount = await prisma_1.default.user.count({ where: { officeId: id } });
        if (userCount > 0) {
            throw new shared_types_1.AppError(`Cannot delete office with ${userCount} active user(s). Reassign them first.`, 409);
        }
        await prisma_1.default.office.delete({ where: { id: office.id } });
    }
}
exports.OfficeService = OfficeService;
//# sourceMappingURL=office.service.js.map