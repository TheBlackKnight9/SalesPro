import { Router } from "express";
import { TeamController } from "../controllers/team.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();
const ctrl = new TeamController();

// Restrict onboarding to SUPER_ADMIN or MANAGER roles only
router.post(
  "/create",
  authenticate,
  authorize("SUPER_ADMIN", "MANAGER"),
  ctrl.createStaff.bind(ctrl)
);

export default router;
