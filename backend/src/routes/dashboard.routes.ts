import { Router } from "express";
import { getDashboardStats, getDashboardMetrics } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Protect dashboard route
router.use(authenticate);

router.get("/stats", getDashboardStats);
router.get("/metrics", getDashboardMetrics);

export default router;
