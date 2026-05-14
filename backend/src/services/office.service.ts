import prisma from "../config/prisma";
import { AppError, PaginationMeta } from "../types/shared.types";
import { CreateOfficeDto, UpdateOfficeDto } from "../types/office.types";

export class OfficeService {
  // ── Create Office ──────────────────────────
  async create(dto: CreateOfficeDto) {
    return prisma.office.create({
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
  async findAll(
    page = 1,
    limit = 10,
    search?: string
  ): Promise<{ data: object[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { city: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [offices, total] = await Promise.all([
      prisma.office.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { users: true, leads: true } } },
      }),
      prisma.office.count({ where }),
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
  async findById(id: string) {
    const office = await prisma.office.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, leads: true, customers: true } },
      },
    });

    if (!office) throw new AppError("Office not found.", 404);
    return office;
  }

  // ── Update Office ─────────────────────────
  async update(id: string, dto: UpdateOfficeDto) {
    await this.findById(id); // existence check
    return prisma.office.update({ where: { id }, data: dto });
  }

  // ── Delete Office ─────────────────────────
  async delete(id: string) {
    const office = await this.findById(id);
    const userCount = await prisma.user.count({ where: { officeId: id } });

    if (userCount > 0) {
      throw new AppError(
        `Cannot delete office with ${userCount} active user(s). Reassign them first.`,
        409
      );
    }

    await prisma.office.delete({ where: { id: office.id } });
  }
}
