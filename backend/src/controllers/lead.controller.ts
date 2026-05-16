import { Response, NextFunction } from "express";
import { LeadService } from "../services/lead.service";
import { AuthRequest, AppError } from "../types/shared.types";

const leadService = new LeadService();

export class LeadController {
  // POST /api/leads
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);

      const { firstName, phone } = req.body;
      if (!firstName || !phone) {
        throw new AppError("firstName and phone are required.", 400);
      }

      const lead = await leadService.create(req.body, req.user);
      res.status(201).json({ success: true, message: "Lead created.", data: lead });
    } catch (err) { next(err); }
  }

  // GET /api/leads
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      console.log("Current User (Leads Controller):", req.user);
      if (!req.user) throw new AppError("Not authenticated.", 401);

      const query = {
        page: parseInt(String(req.query.page)) || 1,
        limit: parseInt(String(req.query.limit)) || 20,
        search: req.query.search ? String(req.query.search) : undefined,
        officeId: req.query.officeId ? String(req.query.officeId) : undefined,
        agentId: req.query.agentId ? String(req.query.agentId) : undefined,
        managerId: req.query.managerId ? String(req.query.managerId) : undefined,
        status: req.query.status as any,
        source: req.query.source as any,
        sortBy: req.query.sortBy ? String(req.query.sortBy) : "createdAt",
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      };

      const result = await leadService.findAll(query, req.user);
      res.status(200).json({ success: true, message: "Leads fetched.", ...result });
    } catch (err) { next(err); }
  }

  // GET /api/leads/kanban?officeId=xxx
  async getKanban(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);

      const officeId = (req.query.officeId as string) || req.user.officeId;
      const kanban = await leadService.getKanban(officeId, req.user);

      res.status(200).json({
        success: true,
        message: "Kanban board fetched.",
        data: kanban,
      });
    } catch (err) { next(err); }
  }

  // GET /api/leads/:id
  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);
      const id = String(req.params.id);
      const lead = await leadService.findById(id, req.user);
      res.status(200).json({ success: true, message: "Lead fetched.", data: lead });
    } catch (err) { next(err); }
  }

  // PUT /api/leads/:id
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);
      const id = String(req.params.id);
      const lead = await leadService.update(id, req.body, req.user);
      res.status(200).json({ success: true, message: "Lead updated.", data: lead });
    } catch (err) { next(err); }
  }

  // PATCH /api/leads/:id/status
  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);

      if (!req.body.status) {
        throw new AppError("status is required.", 400);
      }
      
      const id = String(req.params.id);
      const lead = await leadService.updateStatus(id, req.body, req.user);
      res.status(200).json({ success: true, message: "Lead status updated.", data: lead });
    } catch (err) { next(err); }
  }

  // PATCH /api/leads/:id/assign
  async assign(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);

      if (!req.body.agentId) {
        throw new AppError("agentId is required.", 400);
      }

      const id = String(req.params.id);
      const lead = await leadService.assign(id, req.body, req.user);
      res.status(200).json({ success: true, message: "Lead assigned.", data: lead });
    } catch (err) { next(err); }
  }

  // DELETE /api/leads/:id
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);
      const id = String(req.params.id);
      await leadService.delete(id, req.user);
      res.status(200).json({ success: true, message: "Lead deleted." });
    } catch (err) { next(err); }
  }

  // POST /api/leads/:id/convert
  async convert(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);
      const id = String(req.params.id);
      const { conversionNote, quotationId } = req.body;
      const result = await leadService.convertToCustomer(id, req.user, conversionNote, quotationId);
      res.status(200).json({ success: true, message: "Lead converted to customer.", data: result });
    } catch (err) { next(err); }
  }
}
