import { Response, NextFunction } from "express";
import { CustomerService } from "../services/customer.service";
import { AuthRequest, AppError } from "../types/shared.types";

const customerService = new CustomerService();

export class CustomerController {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      console.log("Current User (Customers Controller):", req.user);
      if (!req.user) throw new AppError("Not authenticated.", 401);

      const query = {
        page: parseInt(String(req.query.page)) || 1,
        limit: parseInt(String(req.query.limit)) || 20,
        search: req.query.search ? String(req.query.search) : undefined,
        officeId: req.query.officeId ? String(req.query.officeId) : undefined,
        sortBy: req.query.sortBy ? String(req.query.sortBy) : "createdAt",
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
        dateRange: req.query.dateRange ? String(req.query.dateRange) : undefined,
        revenueRange: req.query.revenueRange ? String(req.query.revenueRange) : undefined,
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

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);
      const id = String(req.params.id);
      const customer = await customerService.update(id, req.body, req.user);
      res.status(200).json({ success: true, message: "Customer updated.", data: customer });
    } catch (err) { next(err); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);

      // Strict RBAC Check: Agents cannot create customers directly
      if (req.user.role === "AGENT") {
        throw new AppError("Agents are not authorized to create customers directly. Please convert a lead instead.", 403);
      }

      const { firstName, phone } = req.body;
      if (!firstName || !phone) {
        throw new AppError("First Name and Phone are required.", 400);
      }

      const customer = await customerService.create(req.body, req.user);
      res.status(201).json({
        success: true,
        message: "Customer created successfully.",
        data: customer,
      });
    } catch (err) { next(err); }
  }
}
