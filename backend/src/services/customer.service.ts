import { prisma } from "../config/prisma";
import { AppError, JwtPayload } from "../types/shared.types";

export class CustomerService {
  async findAll(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      officeId?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
    currentUser: JwtPayload
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    const where: any = {};

    // Filter by office based on user role
    if (currentUser.role === "SUPER_ADMIN") {
      if (query.officeId) where.officeId = query.officeId;
    } else {
      where.officeId = currentUser.officeId;
    }

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
        { company: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          lead: { select: { source: true, status: true } },
          _count: {
            select: { quotations: true, invoices: true, activities: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, currentUser: JwtPayload) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        lead: true,
        office: true,
        quotations: true,
        invoices: true,
        activities: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    if (currentUser.role !== "SUPER_ADMIN" && customer.officeId !== currentUser.officeId) {
      throw new AppError("Access denied to this customer", 403);
    }

    return customer;
  }
}
