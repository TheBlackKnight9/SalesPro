import prisma from "../config/prisma";
import { AppError, PaginationMeta } from "../types/shared.types";
import { CreateUserDto, UpdateUserDto } from "../types/user.types";
import { AuthService } from "./auth.service";
import { UserRole } from "@prisma/client";

export class UserService {
  // ── Create User ────────────────────────────
  async create(dto: CreateUserDto) {
    // Verify office exists
    const office = await prisma.office.findUnique({ where: { id: dto.officeId } });
    if (!office) throw new AppError("Office not found.", 404);

    const passwordHash = await AuthService.hashPassword(dto.password);

    return prisma.user.create({
      data: {
        officeId: dto.officeId,
        name: dto.name,
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone,
        passwordHash,
        role: dto.role ?? UserRole.AGENT,
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
  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    officeId?: string,
    role?: UserRole
  ): Promise<{ data: object[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;

    const where = {
      ...(officeId && { officeId }),
      ...(role && { role }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Get Single User ────────────────────────
  async findById(id: string) {
    const user = await prisma.user.findUnique({
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

    if (!user) throw new AppError("User not found.", 404);
    return user;
  }

  // ── Update User ────────────────────────────
  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id); // existence check

    return prisma.user.update({
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
  async deactivate(id: string) {
    await this.findById(id);
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── Get Users by Office ────────────────────
  async findByOffice(officeId: string) {
    return prisma.user.findMany({
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
