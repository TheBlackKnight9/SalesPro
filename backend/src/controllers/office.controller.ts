import { Response, NextFunction } from "express";
import { OfficeService } from "../services/office.service";
import { AuthRequest, AppError } from "../types/shared.types";

const officeService = new OfficeService();

export class OfficeController {
  // POST /api/offices
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const office = await officeService.create(req.body);
      res.status(201).json({ success: true, message: "Office created.", data: office });
    } catch (err) { next(err); }
  }

  // GET /api/offices
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const result = await officeService.findAll(page, limit, search);
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
