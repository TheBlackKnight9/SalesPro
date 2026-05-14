import { Response, NextFunction } from "express";
import { TaskService } from "../services/task.service";
import { AuthRequest, AppError } from "../types/shared.types";

const taskService = new TaskService();

export class TaskController {
  async createTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);
      const leadId = req.params.id as string;
      const task = await taskService.createTaskForLead(leadId, req.body, req.user);
      res.status(201).json({ success: true, message: "Task created.", data: task });
    } catch (err) { next(err); }
  }

  async getLeadTasks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const leadId = req.params.id as string;
      const tasks = await taskService.getTasksByLead(leadId);
      res.status(200).json({ success: true, message: "Tasks fetched.", data: tasks });
    } catch (err) { next(err); }
  }
}
