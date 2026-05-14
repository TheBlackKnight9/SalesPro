import { Response, NextFunction } from "express";
import { CustomerService } from "../services/customer.service";
import { AuthRequest, AppError } from "../types/shared.types";

const customerService = new CustomerService();

export class CustomerController {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);

      const query = {
        page: parseInt(String(req.query.page)) || 1,
        limit: parseInt(String(req.query.limit)) || 20,
        search: req.query.search ? String(req.query.search) : undefined,
        officeId: req.query.officeId ? String(req.query.officeId) : undefined,
        sortBy: req.query.sortBy ? String(req.query.sortBy) : "createdAt",
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      };

      const result = await customerService.findAll(query, req.user);
      res.status(200).json({ success: true, message: "Customers fetched.", ...result });
    } catch (err) { next(err); }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);
      const id = String(req.params.id);
      const customer = await customerService.findById(id, req.user);
      res.status(200).json({ success: true, message: "Customer fetched.", data: customer });
    } catch (err) { next(err); }
  }
}
