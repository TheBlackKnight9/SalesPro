"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const shared_types_1 = require("../types/shared.types");
const client_1 = require("@prisma/client");
class LeadService {
    // ── Create Lead ────────────────────────────
    async create(dto, createdBy) {
        const lead = await prisma_1.default.lead.create({
            data: {
                officeId: dto.officeId,
                createdById: createdBy.userId,
                managerId: dto.managerId,
                agentId: dto.agentId,
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                alternatePhone: dto.alternatePhone,
                company: dto.company,
                designation: dto.designation,
                source: dto.source,
                status: dto.status ?? "NEW",
                priority: dto.priority ?? "MEDIUM",
                tags: dto.tags ?? [],
                notes: dto.notes,
                budget: dto.budget,
                expectedClosing: dto.expectedClosing
                    ? new Date(dto.expectedClosing)
                    : undefined,
            },
        });
        // Log activity
        await prisma_1.default.activity.create({
            data: {
                leadId: lead.id,
                performedById: createdBy.userId,
                type: client_1.ActivityType.LEAD_CREATED,
                title: "Lead Created",
                description: `Lead ${lead.firstName} ${lead.lastName ?? ""} created.`,
            },
        });
        // Log initial status
        await prisma_1.default.leadStatusHistory.create({
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
    async findAll(query, currentUser) {
        const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc" } = query;
        const skip = (page - 1) * limit;
        // Agents can only see their own leads
        const agentFilter = currentUser.role === "AGENT" ? { agentId: currentUser.userId } : {};
        const where = {
            ...agentFilter,
            ...(query.officeId && { officeId: query.officeId }),
            ...(query.agentId && { agentId: query.agentId }),
            ...(query.managerId && { managerId: query.managerId }),
            ...(query.status && { status: query.status }),
            ...(query.source && { source: query.source }),
            ...(search && {
                OR: [
                    { firstName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                    { phone: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { company: { contains: search, mode: "insensitive" } },
                ],
            }),
        };
        const [leads, total] = await Promise.all([
            prisma_1.default.lead.findMany({
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
            prisma_1.default.lead.count({ where }),
        ]);
        return {
            data: leads,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    // ── Get Single Lead (full detail) ─────────
    async findById(id, currentUser) {
        const lead = await prisma_1.default.lead.findUnique({
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
        if (!lead)
            throw new shared_types_1.AppError("Lead not found.", 404);
        // Agents can only view their own leads
        if (currentUser.role === "AGENT" &&
            lead.agentId !== currentUser.userId) {
            throw new shared_types_1.AppError("Access denied to this lead.", 403);
        }
        return lead;
    }
    // ── Update Lead ────────────────────────────
    async update(id, dto, currentUser) {
        const lead = await this.findById(id, currentUser);
        const updated = await prisma_1.default.lead.update({
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
            },
        });
        await prisma_1.default.activity.create({
            data: {
                leadId: id,
                performedById: currentUser.userId,
                type: client_1.ActivityType.LEAD_UPDATED,
                title: "Lead Updated",
                description: "Lead details were updated.",
                metadata: dto,
            },
        });
        return updated;
    }
    // ── Change Lead Status ─────────────────────
    async updateStatus(id, dto, currentUser) {
        const lead = await this.findById(id, currentUser);
        if (lead.status === dto.status) {
            throw new shared_types_1.AppError(`Lead is already in status: ${dto.status}`, 400);
        }
        const [updated] = await prisma_1.default.$transaction([
            prisma_1.default.lead.update({
                where: { id },
                data: { status: dto.status },
            }),
            prisma_1.default.leadStatusHistory.create({
                data: {
                    leadId: id,
                    changedById: currentUser.userId,
                    fromStatus: lead.status,
                    toStatus: dto.status,
                    notes: dto.notes,
                },
            }),
            prisma_1.default.activity.create({
                data: {
                    leadId: id,
                    performedById: currentUser.userId,
                    type: client_1.ActivityType.LEAD_STATUS_CHANGED,
                    title: "Status Changed",
                    description: `Status changed from ${lead.status} to ${dto.status}.`,
                    metadata: { from: lead.status, to: dto.status, notes: dto.notes },
                },
            }),
        ]);
        return updated;
    }
    // ── Assign Lead to Agent ───────────────────
    async assign(id, dto, currentUser) {
        const lead = await this.findById(id, currentUser);
        const agent = await prisma_1.default.user.findUnique({
            where: { id: dto.agentId },
        });
        if (!agent)
            throw new shared_types_1.AppError("Agent not found.", 404);
        const [updated] = await prisma_1.default.$transaction([
            prisma_1.default.lead.update({
                where: { id },
                data: { agentId: dto.agentId },
            }),
            prisma_1.default.leadAssignment.create({
                data: {
                    leadId: id,
                    assignedToId: dto.agentId,
                    assignedById: currentUser.userId,
                    notes: dto.notes,
                },
            }),
            prisma_1.default.activity.create({
                data: {
                    leadId: id,
                    performedById: currentUser.userId,
                    type: client_1.ActivityType.LEAD_ASSIGNED,
                    title: "Lead Assigned",
                    description: `Lead assigned to ${agent.name}.`,
                    metadata: { agentId: dto.agentId, agentName: agent.name },
                },
            }),
            prisma_1.default.notification.create({
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
    async delete(id, currentUser) {
        const lead = await this.findById(id, currentUser);
        if (lead.isConverted) {
            throw new shared_types_1.AppError("Cannot delete a converted lead. Archive it instead.", 409);
        }
        await prisma_1.default.lead.delete({ where: { id: lead.id } });
    }
    // ── Kanban Board (leads grouped by status) ─
    async getKanban(officeId, currentUser) {
        const agentFilter = currentUser.role === "AGENT" ? { agentId: currentUser.userId } : {};
        const leads = await prisma_1.default.lead.findMany({
            where: { officeId, isConverted: false, ...agentFilter },
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
        const kanban = leads.reduce((acc, lead) => {
            const key = lead.status;
            if (!acc[key])
                acc[key] = [];
            acc[key].push(lead);
            return acc;
        }, {});
        return kanban;
    }
    // ── Convert Lead to Customer ────────────────
    async convertToCustomer(id, currentUser) {
        const lead = await this.findById(id, currentUser);
        if (lead.isConverted) {
            throw new shared_types_1.AppError("Lead is already converted to a customer.", 400);
        }
        const [updatedLead, customer] = await prisma_1.default.$transaction([
            prisma_1.default.lead.update({
                where: { id },
                data: {
                    isConverted: true,
                    convertedAt: new Date(),
                    status: "WON", // Optional: automatically move to WON status
                },
            }),
            prisma_1.default.customer.create({
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
                },
            }),
            prisma_1.default.activity.create({
                data: {
                    leadId: id,
                    performedById: currentUser.userId,
                    type: client_1.ActivityType.LEAD_CONVERTED,
                    title: "Lead Converted",
                    description: `Lead converted to customer.`,
                },
            }),
            // Log status change to WON
            prisma_1.default.leadStatusHistory.create({
                data: {
                    leadId: id,
                    changedById: currentUser.userId,
                    fromStatus: lead.status,
                    toStatus: "WON",
                    notes: "Auto-updated upon conversion to customer",
                },
            }),
        ]);
        return { lead: updatedLead, customer };
    }
}
exports.LeadService = LeadService;
//# sourceMappingURL=lead.service.js.map