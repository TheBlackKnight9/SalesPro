import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";
import { AppError, PaginationMeta } from "../types/shared.types";
import {
  CreateLeadDto,
  UpdateLeadDto,
  UpdateLeadStatusDto,
  AssignLeadDto,
  LeadFilterQuery,
} from "../types/lead.types";
import { JwtPayload } from "../types/shared.types";
import { ActivityType } from "@prisma/client";

export class LeadService {
  // ── Create Lead ────────────────────────────
  async create(dto: CreateLeadDto, createdBy: JwtPayload) {
    // RBAC: Agents are forcefully assigned to their own created leads
    // Super Admins and Managers can assign to anyone or leave null
    const agentId = createdBy.role === "AGENT" ? createdBy.userId : dto.agentId;
    
    // Office Linkage: Default to creator's office if not specified
    let officeId = dto.officeId || createdBy.officeId;

    if (!officeId && createdBy.role === "SUPER_ADMIN") {
      const firstOffice = await prisma.office.findFirst();
      if (firstOffice) officeId = firstOffice.id;
    }

    if (!officeId) {
      throw new AppError("Office assignment is required for creating a lead.", 400);
    }

    const lead = await prisma.lead.create({
      data: {
        officeId: officeId as string,
        createdById: createdBy.userId,
        organizationId: createdBy.organizationId,
        managerId: dto.managerId || null,
        agentId: agentId || null,
        firstName: dto.firstName,
        lastName: dto.lastName || null,
        email: dto.email || null,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone || null,
        company: dto.company || null,
        designation: dto.designation || null,
        source: dto.source || "OTHER",
        status: dto.status || "NEW",
        priority: dto.priority || "MEDIUM",
        tags: dto.tags || [],
        notes: dto.notes || null,
        budget: dto.budget || null,
        expectedClosing: dto.expectedClosing
          ? new Date(dto.expectedClosing)
          : null,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        performedById: createdBy.userId,
        type: ActivityType.LEAD_CREATED,
        title: "Lead Created",
        description: `Lead ${lead.firstName} ${lead.lastName ?? ""} created.`,
      },
    });

    // Log initial status
    await prisma.leadStatusHistory.create({
      data: {
        leadId: lead.id,
        changedById: createdBy.userId,
        fromStatus: undefined,
        toStatus: lead.status,
        notes: "Initial status on creation",
      },
    });

    return lead;
  }

  // ── Get All Leads (paginated + filtered) ──
  async findAll(
    query: LeadFilterQuery,
    currentUser: JwtPayload
  ): Promise<{ data: object[]; meta: PaginationMeta }> {
    const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;
    console.log("Current User (Leads):", currentUser);

    const where: any = {
      isConverted: false,
      organizationId: currentUser.organizationId,
    };

    // STRICT RBAC LOGIC: Super Admin Bypass
    if (currentUser.role === "SUPER_ADMIN") {
      console.log("[LeadService] SUPER_ADMIN detected - No RBAC filters applied.");
    } else if (currentUser.role === "MANAGER") {
      // Manager: Filter by officeId
      if (!currentUser.officeId) {
        console.warn("[LeadService] MANAGER has no officeId assigned - returning empty.");
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }
      where.officeId = currentUser.officeId;
    } else if (currentUser.role === "AGENT") {
      // Agent: Filter by assigned agentId
      where.agentId = currentUser.userId;
    }

    console.log("[LeadService] Final Where Clause:", JSON.stringify(where, null, 2));

    // Apply additional filters from query if they don't violate RBAC
    if (query.officeId && currentUser.role === "SUPER_ADMIN") {
      where.officeId = query.officeId;
    }
    if (query.status) {
      if (typeof query.status === "string" && query.status.includes(",")) {
        where.status = { in: query.status.split(",") as any[] };
      } else {
        where.status = query.status;
      }
    }
    if (query.source) where.source = query.source;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { company: { contains: search, mode: "insensitive" as const } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: true,
          source: true,
          status: true,
          priority: true,
          budget: true,
          expectedClosing: true,
          isConverted: true,
          createdAt: true,
          tags: true,
          agent: { select: { id: true, name: true, avatarUrl: true } },
          manager: { select: { id: true, name: true } },
          _count: {
            select: { followUps: true, tasks: true, activities: true },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Get Single Lead (full detail) ─────────
  async findById(id: string, currentUser: JwtPayload) {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true, email: true, avatarUrl: true } },
        manager: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        office: { select: { id: true, name: true } },
        customer: true,
        requirements: true,
        tasks: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        followUps: {
          orderBy: { scheduledAt: "desc" },
          take: 5,
        },
        quotations: {
          select: {
            id: true,
            quotationNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            performedBy: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          include: {
            changedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!lead) throw new AppError("Lead not found.", 404);

    if (lead.organizationId !== currentUser.organizationId) {
      throw new AppError("Access denied: This lead belongs to another organization.", 403);
    }

    // Agents can only view their own leads
    if (
      currentUser.role === "AGENT" &&
      lead.agentId !== currentUser.userId
    ) {
      throw new AppError("Access denied to this lead.", 403);
    }

    return lead;
  }

  // ── Update Lead ────────────────────────────
  async update(id: string, dto: UpdateLeadDto, currentUser: JwtPayload) {
    const lead = await this.findById(id, currentUser);
 
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id: lead.id },
        data: {
          ...(dto.firstName && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.phone && { phone: dto.phone }),
          ...(dto.alternatePhone !== undefined && { alternatePhone: dto.alternatePhone }),
          ...(dto.company !== undefined && { company: dto.company }),
          ...(dto.designation !== undefined && { designation: dto.designation }),
          ...(dto.source && { source: dto.source }),
          ...(dto.priority && { priority: dto.priority }),
          ...(dto.tags && { tags: dto.tags }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(dto.budget !== undefined && { budget: dto.budget }),
          ...(dto.expectedClosing && {
            expectedClosing: new Date(dto.expectedClosing),
          }),
          ...(dto.managerId !== undefined && { managerId: dto.managerId }),
          ...(dto.agentId !== undefined && { agentId: dto.agentId }),
          ...(dto.assignedToId !== undefined && { agentId: dto.assignedToId }),
        },
      });
 
      // Determine activity title and description
      let title = "Lead Updated";
      let description = "Lead details were updated.";
      let activityType: ActivityType = ActivityType.LEAD_UPDATED;
 
      if (dto.priority && dto.priority !== lead.priority) {
        title = "Priority Changed";
        description = `Priority changed to ${dto.priority}`;
      } else if (dto.assignedToId !== undefined) {
        const oldAgentId = lead.agentId;
        const newAgentId = dto.assignedToId;
 
        if (oldAgentId !== newAgentId) {
          activityType = ActivityType.LEAD_ASSIGNED;
          
          const oldAgent = oldAgentId ? await tx.user.findUnique({ where: { id: oldAgentId } }) : null;
          const newAgent = newAgentId ? await tx.user.findUnique({ where: { id: newAgentId } }) : null;
 
          if (!oldAgentId && newAgent) {
            title = "Lead Assigned";
            description = `Lead assigned to ${newAgent.name}.`;
          } else if (oldAgent && newAgent) {
            title = "Lead Reassigned";
            description = `Lead reassigned from ${oldAgent.name} to ${newAgent.name}.`;
          } else if (oldAgent && !newAgentId) {
            title = "Lead Unassigned";
            description = `Lead unassigned from ${oldAgent.name}.`;
          }
        }
      }
 
      await tx.activity.create({
        data: {
          leadId: id,
          performedById: currentUser.userId,
          type: activityType,
          title,
          description,
          metadata: dto as object,
        },
      });
 
      return updated;
    });
  }

  // ── Change Lead Status ─────────────────────
  async updateStatus(
    id: string,
    dto: UpdateLeadStatusDto,
    currentUser: JwtPayload
  ) {
    const lead = await this.findById(id, currentUser);

    if (lead.status === dto.status) {
      throw new AppError(`Lead is already in status: ${dto.status}`, 400);
    }

    const [updated] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: { status: dto.status },
      }),
      prisma.leadStatusHistory.create({
        data: {
          leadId: id,
          changedById: currentUser.userId,
          fromStatus: lead.status,
          toStatus: dto.status,
          notes: dto.notes,
        },
      }),
      prisma.activity.create({
        data: {
          leadId: id,
          performedById: currentUser.userId,
          type: ActivityType.LEAD_STATUS_CHANGED,
          title: "Status Changed",
          description: `Status changed from ${lead.status} to ${dto.status}.`,
          metadata: { from: lead.status, to: dto.status, notes: dto.notes },
        },
      }),
    ]);

    return updated;
  }

  // ── Assign Lead to Agent ───────────────────
  async assign(id: string, dto: AssignLeadDto, currentUser: JwtPayload) {
    const lead = await this.findById(id, currentUser);

    const agent = await prisma.user.findUnique({
      where: { id: dto.agentId },
    });
    if (!agent) throw new AppError("Agent not found.", 404);

    const [updated] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: { agentId: dto.agentId },
      }),
      prisma.leadAssignment.create({
        data: {
          leadId: id,
          assignedToId: dto.agentId,
          assignedById: currentUser.userId,
          notes: dto.notes,
        },
      }),
      prisma.activity.create({
        data: {
          leadId: id,
          performedById: currentUser.userId,
          type: ActivityType.LEAD_ASSIGNED,
          title: "Lead Assigned",
          description: `Lead assigned to ${agent.name}.`,
          metadata: { agentId: dto.agentId, agentName: agent.name },
        },
      }),
      prisma.notification.create({
        data: {
          userId: dto.agentId,
          type: "LEAD_ASSIGNED",
          title: "New Lead Assigned",
          body: `You have been assigned lead: ${lead.firstName} ${lead.lastName ?? ""}`,
          metadata: { leadId: id },
        },
      }),
    ]);

    return updated;
  }

  // ── Delete Lead ────────────────────────────
  async delete(id: string, currentUser: JwtPayload) {
    const lead = await this.findById(id, currentUser);

    if (lead.isConverted) {
      throw new AppError(
        "Cannot delete a converted lead. Archive it instead.",
        409
      );
    }

    await prisma.lead.delete({ where: { id: lead.id } });
  }

  // ── Kanban Board (leads grouped by status) ─
  async getKanban(officeId: string | null, currentUser: JwtPayload) {
    const agentFilter =
      currentUser.role === "AGENT" ? { agentId: currentUser.userId } : {};

    const where: any = {
      isConverted: false,
      organizationId: currentUser.organizationId,
      ...agentFilter
    };
    if (officeId) {
      where.officeId = officeId;
    }

    const leads = await prisma.lead.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        status: true,
        priority: true,
        budget: true,
        expectedClosing: true,
        createdAt: true,
        agent: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { followUps: true, tasks: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Group by status
    const kanban = leads.reduce(
      (acc, lead) => {
        const key = lead.status;
        if (!acc[key]) acc[key] = [];
        acc[key].push(lead);
        return acc;
      },
      {} as Record<string, typeof leads>
    );

    return kanban;
  }

  // ── Convert Lead to Customer ────────────────
  async convertToCustomer(id: string, currentUser: JwtPayload, conversionNote?: string, quotationId?: string) {
    const lead = await this.findById(id, currentUser);

    if (lead.isConverted) {
      throw new AppError("Lead is already converted to a customer.", 400);
    }

    // FLEXIBLE GUARD: Require either quotationId OR conversionNote
    if (!quotationId && (!conversionNote || conversionNote.trim().length === 0)) {
      throw new AppError("Provide either a quotation or a conversion note to proceed.", 400);
    }

    let targetQuotation = null;
    if (quotationId) {
      targetQuotation = await prisma.quotation.findUnique({
        where: { id: quotationId }
      });

      if (!targetQuotation || targetQuotation.leadId !== id) {
        throw new AppError("The selected quotation is invalid or does not belong to this lead.", 400);
      }

      if (targetQuotation.status === "REJECTED") {
        throw new AppError("Cannot convert lead using a REJECTED quotation.", 400);
      }
    }

    return await prisma.$transaction(async (tx) => {
      // Step 1: Update the Quotation status to ACCEPTED if provided
      if (quotationId) {
        await tx.quotation.update({
          where: { id: quotationId },
          data: { status: "ACCEPTED", acceptedAt: new Date() }
        });
      }

      // Step 2: Calculate Revenue (Sum of all ACCEPTED quotations, including the one we just updated)
      const allAcceptedQuotes = await tx.quotation.findMany({
        where: { leadId: id, status: "ACCEPTED" }
      });
      
      const totalRevenue = allAcceptedQuotes.reduce((sum, q) => sum + Number(q.totalAmount), 0);

      // Step 3: Determine Conversion Note
      const finalNote = conversionNote?.trim() || 
        (targetQuotation ? `Converted via Quotation [${targetQuotation.quotationNumber}]` : "Converted manually.");

      // Step 4: Create Customer
      const customer = await tx.customer.create({
        data: {
          leadId: lead.id,
          officeId: lead.officeId,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          alternatePhone: lead.alternatePhone,
          company: lead.company,
          designation: lead.designation,
          notes: lead.notes,
          conversionNote: finalNote,
          totalRevenue: new Prisma.Decimal(totalRevenue),
        },
      });

      // Step 5: Link all ACCEPTED quotations to this new customer
      await tx.quotation.updateMany({
        where: { leadId: id, status: "ACCEPTED" },
        data: { customerId: customer.id }
      });

      // Step 6: Update Lead
      await tx.lead.update({
        where: { id },
        data: {
          isConverted: true,
          convertedAt: new Date(),
          status: "WON", // Standard schema equivalent to CONVERTED
        },
      });

      // Step 7: Activity Logs
      await tx.activity.create({
        data: {
          leadId: id,
          customerId: customer.id,
          performedById: currentUser.userId,
          type: ActivityType.LEAD_CONVERTED,
          title: "Lead Converted",
          description: `Lead converted to customer. Note: ${finalNote}`,
        },
      });

      await tx.leadStatusHistory.create({
        data: {
          leadId: id,
          changedById: currentUser.userId,
          fromStatus: lead.status,
          toStatus: "WON",
          notes: finalNote,
        },
      });

      return { lead: id, customer: customer.id };
    });
  }
}
