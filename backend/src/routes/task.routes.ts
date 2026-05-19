import { Router } from "express";
import { TaskController } from "../controllers/task.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
const taskController = new TaskController();

// All task routes require authentication
router.use(authenticate);

// GET /api/tasks - Fetch tasks with RBAC
router.get("/", taskController.findAll);

// POST /api/tasks - Create a new task
router.post("/", taskController.create);

// PATCH /api/tasks/:id/status - Update task status
router.patch("/:id/status", taskController.updateStatus);

// DELETE /api/tasks/:id - Delete a task
router.delete("/:id", taskController.delete);

export default router;
