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
      dateRange?: string; // e.g. "last_7_days", "this_month", "this_year"
      revenueRange?: string; // e.g. "all", "gt_1000", "gt_5000"
    },
    currentUser: JwtPayload
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    console.log("Current User (Customers):", currentUser);

    const where: any = {};

    // STRICT RBAC LOGIC: Super Admin Bypass
    if (currentUser.role === "SUPER_ADMIN") {
      console.log("[CustomerService] SUPER_ADMIN detected - No RBAC filters applied.");
      if (query.officeId) where.officeId = query.officeId;
    } else if (currentUser.role === "MANAGER") {
      // Manager: Filter by officeId
      if (!currentUser.officeId) {
        console.warn("[CustomerService] MANAGER has no officeId assigned - returning empty.");
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }
      where.officeId = currentUser.officeId;
    } else if (currentUser.role === "AGENT") {
      // Agent: Filter by original lead's agentId
      where.lead = { agentId: currentUser.userId };
    }

    console.log("[CustomerService] Final Where Clause:", JSON.stringify(where, null, 2));

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
        { company: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Date Range Filter
    if (query.dateRange && query.dateRange !== "all") {
      const now = new Date();
      let startDate = new Date();
      if (query.dateRange === "last_7_days") {
        startDate.setDate(now.getDate() - 7);
      } else if (query.dateRange === "this_month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (query.dateRange === "this_year") {
        startDate = new Date(now.getFullYear(), 0, 1);
      }
      where.createdAt = { gte: startDate };
    }

    // Revenue Range Filter
    if (query.revenueRange && query.revenueRange !== "all") {
      if (query.revenueRange === "gt_1000") {
        where.totalRevenue = { gt: 1000 };
      } else if (query.revenueRange === "gt_5000") {
        where.totalRevenue = { gt: 5000 };
      }
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          lead: { select: { source: true, status: true, agentId: true } },
          _count: {
            select: { quotations: true, invoices: true, activities: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    // Aggregate revenue for each customer in the result set
    const customersWithRevenue = await Promise.all(
      customers.map(async (c) => {
        const aggregation = await prisma.quotation.aggregate({
          where: { customerId: c.id, status: "ACCEPTED" },
          _sum: { totalAmount: true },
        });
        return {
          ...c,
          totalRevenue: aggregation._sum.totalAmount || 0,
        };
      })
    );

    return {
      data: customersWithRevenue,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, currentUser: JwtPayload) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        lead: true,
        office: true,
        quotations: {
          orderBy: { createdAt: "desc" },
        },
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

    if (currentUser.role === "AGENT" && customer.lead.agentId !== currentUser.userId) {
      throw new AppError("Access denied: This customer is not assigned to you.", 403);
    }

    if (currentUser.role === "MANAGER" && customer.officeId !== currentUser.officeId) {
      throw new AppError("Access denied: This customer belongs to a different office.", 403);
    }

    // Dynamic Revenue Aggregation
    const aggregation = await prisma.quotation.aggregate({
      where: { customerId: id, status: "ACCEPTED" },
      _sum: { totalAmount: true },
    });

    return {
      ...customer,
      totalRevenue: aggregation._sum.totalAmount || 0,
    };
  }

  async create(dto: any, currentUser: JwtPayload) {
    // We need to create a Lead first because Customer has a 1:1 relation with Lead
    // If we create a customer directly, we treat it as a "Won" lead from the start.
    
    // Determine officeId: fallback to user's office if not provided
    const officeId = dto.officeId || currentUser.officeId;
    if (!officeId) {
      throw new AppError("Office assignment is required to create a customer.", 400);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Create the Lead record (Status: WON)
      const lead = await tx.lead.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          email: dto.email,
          company: dto.company,
          designation: dto.designation,
          officeId: officeId,
          createdById: currentUser.userId,
          status: "WON",
          isConverted: true,
          convertedAt: new Date(),
          source: "OTHER",
        },
      });

      // 2. Create the Customer record linked to the lead
      const customer = await tx.customer.create({
        data: {
          leadId: lead.id,
          officeId: officeId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          email: dto.email,
          company: dto.company,
          designation: dto.designation,
          gstNumber: dto.gstNumber,
          address: dto.address,
          city: dto.city,
          state: dto.state,
          pincode: dto.pincode,
          notes: "Created directly as customer",
        },
      });

      // 3. Log initial activity
      await tx.activity.create({
        data: {
          customerId: customer.id,
          performedById: currentUser.userId,
          type: "CUSTOMER_CREATED",
          title: "Customer Created Directly",
          description: `Customer ${customer.firstName} created by ${currentUser.role}.`,
        },
      });

      return customer;
    });
  }

  async update(id: string, data: any, currentUser: JwtPayload) {
    const customer = await this.findById(id, currentUser);
    
    return await prisma.customer.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        designation: data.designation,
        notes: data.notes,
        gstNumber: data.gstNumber,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      },
    });
  }
}
