import { Router } from "express";
import { OfficeController } from "../controllers/office.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();
const ctrl = new OfficeController();

// Protected route to list offices
router.get("/", authenticate, ctrl.findAll.bind(ctrl));

// Protected routes
router.get("/:id", authenticate, ctrl.findById.bind(ctrl));

// Super Admin only
router.post("/", authenticate, authorize("SUPER_ADMIN"), ctrl.create.bind(ctrl));
router.put("/:id", authenticate, authorize("SUPER_ADMIN"), ctrl.update.bind(ctrl));
router.delete("/:id", authenticate, authorize("SUPER_ADMIN"), ctrl.delete.bind(ctrl));

export default router;
