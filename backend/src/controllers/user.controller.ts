import { Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { AuthRequest, AppError } from "../types/shared.types";
import { UserRole } from "@prisma/client";

const userService = new UserService();

export class UserController {
  // POST /api/users
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, password, officeId, role, phone } = req.body;

      if (!name || !email || !password || !officeId) {
        throw new AppError("name, email, password, officeId are required.", 400);
      }

      const user = await userService.create(req.body);
      res.status(201).json({ success: true, message: "User created.", data: user });
    } catch (err) { next(err); }
  }

  // GET /api/users
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(String(req.query.page)) || 1;
      const limit = parseInt(String(req.query.limit)) || 10;
      const search = req.query.search ? String(req.query.search) : undefined;
      const officeId = req.query.officeId ? String(req.query.officeId) : undefined;
      const role = req.query.role ? (String(req.query.role) as UserRole) : undefined;

      const result = await userService.findAll(page, limit, search, officeId, role);
      res.status(200).json({ success: true, message: "Users fetched.", ...result });
    } catch (err) { next(err); }
  }

  // GET /api/users/:id
  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const user = await userService.findById(id);
      res.status(200).json({ success: true, message: "User fetched.", data: user });
    } catch (err) { next(err); }
  }

  // PUT /api/users/:id
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const user = await userService.update(id, req.body);
      res.status(200).json({ success: true, message: "User updated.", data: user });
    } catch (err) { next(err); }
  }

  // DELETE /api/users/:id (soft delete)
  async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      if (req.user?.userId === id) {
        throw new AppError("You cannot deactivate your own account.", 400);
      }
      await userService.deactivate(id);
      res.status(200).json({ success: true, message: "User deactivated." });
    } catch (err) { next(err); }
  }

  // GET /api/users/office/:officeId
  async findByOffice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const officeId = String(req.params.officeId);
      const users = await userService.findByOffice(officeId);
      res.status(200).json({ success: true, message: "Office users fetched.", data: users });
    } catch (err) { next(err); }
  }
}
