import { Response, NextFunction } from "express";
import { OfficeService } from "../services/office.service";
import { AuthRequest, AppError } from "../types/shared.types";
import prisma from "../config/prisma";

const officeService = new OfficeService();

async function ensureUserTenantScoping(user: any) {
  if (!user) return;
  
  let orgId = user.organizationId;
  if (!orgId) {
    const fallbackUserRecord = await prisma.user.findUnique({
      where: { email: user.email },
      select: { organizationId: true }
    });
    if (fallbackUserRecord?.organizationId) {
      orgId = fallbackUserRecord.organizationId;
    }
  }

  // Safe Tenant Fallback: Only fall back if they have no organizationId at all
  if (!orgId) {
    const defaultOrg = await prisma.organization.findUnique({ where: { id: 'default-org' } });
    if (defaultOrg) {
      orgId = 'default-org';
      await prisma.user.update({
        where: { id: user.userId },
        data: { organizationId: 'default-org' }
      });
    }
  }

  // Bind legacy null organizationId rows to the active resolved organizationId
  if (orgId) {
    await prisma.office.updateMany({
      where: { organizationId: null },
      data: { organizationId: orgId }
    });
    await prisma.user.updateMany({
      where: { organizationId: null },
      data: { organizationId: orgId }
    });
  }
  
  user.organizationId = orgId;
}

export class OfficeController {
  // POST /api/offices
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await ensureUserTenantScoping(req.user);
      const office = await officeService.create(req.body, req.user!);
      res.status(201).json({ success: true, message: "Office created.", data: office });
    } catch (err) { next(err); }
  }

  // GET /api/offices
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await ensureUserTenantScoping(req.user);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const result = await officeService.findAll(page, limit, search, req.user!);
      res.status(200).json({ success: true, message: "Offices fetched.", ...result });
    } catch (err) { next(err); }
  }

  // GET /api/offices/:id
  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const office = await officeService.findById(id);
      res.status(200).json({ success: true, message: "Office fetched.", data: office });
    } catch (err) { next(err); }
  }

  // PUT /api/offices/:id
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const office = await officeService.update(id, req.body);
      res.status(200).json({ success: true, message: "Office updated.", data: office });
    } catch (err) { next(err); }
  }

  // DELETE /api/offices/:id
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      await officeService.delete(id);
      res.status(200).json({ success: true, message: "Office deleted." });
    } catch (err) { next(err); }
  }
}
