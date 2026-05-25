import { Router } from "express";
import { getAnalyticsReport } from "../controllers/report.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Protect report endpoints
router.use(authenticate);

router.get("/analytics", getAnalyticsReport);

export default router;
