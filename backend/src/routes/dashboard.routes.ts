import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Protect dashboard route
router.use(authenticate);

router.get("/stats", getDashboardStats);

export default router;
