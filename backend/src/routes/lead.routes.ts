import { Router } from "express";
import { LeadController } from "../controllers/lead.controller";
import { TaskController } from "../controllers/task.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();
const ctrl = new LeadController();
const taskCtrl = new TaskController();

router.use(authenticate);

// Kanban (before /:id to avoid route collision)
router.get("/kanban", ctrl.getKanban.bind(ctrl));

// Core CRUD
router.get("/", ctrl.findAll.bind(ctrl));
router.post("/", ctrl.create.bind(ctrl));
router.get("/:id", ctrl.findById.bind(ctrl));
router.put("/:id", ctrl.update.bind(ctrl));
router.patch("/:id", ctrl.update.bind(ctrl));
router.delete("/:id", authorize("SUPER_ADMIN", "MANAGER"), ctrl.delete.bind(ctrl));

// Lead tasks are handled via the main /tasks router with linkedLeadId

// Pipeline operations
router.patch("/:id/status", ctrl.updateStatus.bind(ctrl));
router.patch("/:id/assign", authorize("SUPER_ADMIN", "MANAGER"), ctrl.assign.bind(ctrl));
router.post("/:id/convert", authorize("SUPER_ADMIN", "MANAGER", "AGENT"), ctrl.convert.bind(ctrl));

export default router;
