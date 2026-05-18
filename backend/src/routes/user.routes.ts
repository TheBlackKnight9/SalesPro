import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();
const ctrl = new UserController(); // Reload trigger 3

router.use(authenticate);

// Specific routes before parameterized ones
router.get("/office/:officeId", ctrl.findByOffice.bind(ctrl));

router.get("/", authorize("SUPER_ADMIN", "MANAGER"), ctrl.findAll.bind(ctrl));
router.post("/", authorize("SUPER_ADMIN", "MANAGER"), ctrl.create.bind(ctrl));
router.get("/:id", ctrl.findById.bind(ctrl));
router.put("/:id", authorize("SUPER_ADMIN", "MANAGER"), ctrl.update.bind(ctrl));
router.delete("/:id", authorize("SUPER_ADMIN", "MANAGER"), ctrl.deactivate.bind(ctrl));

export default router;
