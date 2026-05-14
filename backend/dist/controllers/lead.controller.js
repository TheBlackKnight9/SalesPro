"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadController = void 0;
const lead_service_1 = require("../services/lead.service");
const shared_types_1 = require("../types/shared.types");
const leadService = new lead_service_1.LeadService();
class LeadController {
    // POST /api/leads
    async create(req, res, next) {
        try {
            if (!req.user)
                throw new shared_types_1.AppError("Not authenticated.", 401);
            const { firstName, phone, officeId } = req.body;
            if (!firstName || !phone || !officeId) {
                throw new shared_types_1.AppError("firstName, phone, and officeId are required.", 400);
            }
            const lead = await leadService.create(req.body, req.user);
            res.status(201).json({ success: true, message: "Lead created.", data: lead });
        }
        catch (err) {
            next(err);
        }
    }
    // GET /api/leads
    async findAll(req, res, next) {
        try {
            if (!req.user)
                throw new shared_types_1.AppError("Not authenticated.", 401);
            const query = {
                page: parseInt(String(req.query.page)) || 1,
                limit: parseInt(String(req.query.limit)) || 20,
                search: req.query.search ? String(req.query.search) : undefined,
                officeId: req.query.officeId ? String(req.query.officeId) : undefined,
                agentId: req.query.agentId ? String(req.query.agentId) : undefined,
                managerId: req.query.managerId ? String(req.query.managerId) : undefined,
                status: req.query.status,
                source: req.query.source,
                sortBy: req.query.sortBy ? String(req.query.sortBy) : "createdAt",
                sortOrder: req.query.sortOrder || "desc",
            };
            const result = await leadService.findAll(query, req.user);
            res.status(200).json({ success: true, message: "Leads fetched.", ...result });
        }
        catch (err) {
            next(err);
        }
    }
    // GET /api/leads/kanban?officeId=xxx
    async getKanban(req, res, next) {
        try {
            if (!req.user)
                throw new shared_types_1.AppError("Not authenticated.", 401);
            const officeId = req.query.officeId ? String(req.query.officeId) : req.user.officeId;
            const kanban = await leadService.getKanban(officeId, req.user);
            res.status(200).json({
                success: true,
                message: "Kanban board fetched.",
                data: kanban,
            });
        }
        catch (err) {
            next(err);
        }
    }
    // GET /api/leads/:id
    async findById(req, res, next) {
        try {
            if (!req.user)
                throw new shared_types_1.AppError("Not authenticated.", 401);
            const id = String(req.params.id);
            const lead = await leadService.findById(id, req.user);
            res.status(200).json({ success: true, message: "Lead fetched.", data: lead });
        }
        catch (err) {
            next(err);
        }
    }
    // PUT /api/leads/:id
    async update(req, res, next) {
        try {
            if (!req.user)
                throw new shared_types_1.AppError("Not authenticated.", 401);
            const id = String(req.params.id);
            const lead = await leadService.update(id, req.body, req.user);
            res.status(200).json({ success: true, message: "Lead updated.", data: lead });
        }
        catch (err) {
            next(err);
        }
    }
    // PATCH /api/leads/:id/status
    async updateStatus(req, res, next) {
        try {
            if (!req.user)
                throw new shared_types_1.AppError("Not authenticated.", 401);
            if (!req.body.status) {
                throw new shared_types_1.AppError("status is required.", 400);
            }
            const id = String(req.params.id);
            const lead = await leadService.updateStatus(id, req.body, req.user);
            res.status(200).json({ success: true, message: "Lead status updated.", data: lead });
        }
        catch (err) {
            next(err);
        }
    }
    // PATCH /api/leads/:id/assign
    async assign(req, res, next) {
        try {
            if (!req.user)
                throw new shared_types_1.AppError("Not authenticated.", 401);
            if (!req.body.agentId) {
                throw new shared_types_1.AppError("agentId is required.", 400);
            }
            const id = String(req.params.id);
            const lead = await leadService.assign(id, req.body, req.user);
            res.status(200).json({ success: true, message: "Lead assigned.", data: lead });
        }
        catch (err) {
            next(err);
        }
    }
    // DELETE /api/leads/:id
    async delete(req, res, next) {
        try {
            if (!req.user)
                throw new shared_types_1.AppError("Not authenticated.", 401);
            const id = String(req.params.id);
            await leadService.delete(id, req.user);
            res.status(200).json({ success: true, message: "Lead deleted." });
        }
        catch (err) {
            next(err);
        }
    }
    // POST /api/leads/:id/convert
    async convert(req, res, next) {
        try {
            if (!req.user)
                throw new shared_types_1.AppError("Not authenticated.", 401);
            const id = String(req.params.id);
            const result = await leadService.convertToCustomer(id, req.user);
            res.status(200).json({ success: true, message: "Lead converted to customer.", data: result });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.LeadController = LeadController;
//# sourceMappingURL=lead.controller.js.map