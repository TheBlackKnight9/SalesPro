import { Response, NextFunction } from "express";
import { TaskService } from "../services/task.service";
import { AuthRequest, AppError } from "../types/shared.types";

const taskService = new TaskService();

export class TaskController {
  // GET /api/tasks
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);
      const tasks = await taskService.findAll(req.user);
      res.status(200).json({ success: true, message: "Tasks fetched.", data: tasks });
    } catch (err) { next(err); }
  }

  // POST /api/tasks
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);
      const task = await taskService.create(req.body, req.user);
      res.status(201).json({ success: true, message: "Task created.", data: task });
    } catch (err) { next(err); }
  }

  // PATCH /api/tasks/:id/status
  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);
      const id = String(req.params.id);
      const { status } = req.body;
      if (!status) throw new AppError("Status is required.", 400);

      const task = await taskService.updateStatus(id, status, req.user);
      res.status(200).json({ success: true, message: "Task status updated.", data: task });
    } catch (err) { next(err); }
  }

  // DELETE /api/tasks/:id
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);
      const id = String(req.params.id);
      await taskService.delete(id, req.user);
      res.status(200).json({ success: true, message: "Task deleted successfully." });
    } catch (err) { next(err); }
  }
}
