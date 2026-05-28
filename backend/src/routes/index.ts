import { Router } from "express";

import uploadRoutes from "./upload.routes"; // Import karein

 // Mount at /api/upload
import authRoutes from "./auth.routes";
import officeRoutes from "./office.routes";
import dashboardRoutes from "./dashboard.routes";
import userRoutes from "./user.routes";
import leadRoutes from "./lead.routes";
import whatsappRoutes from "./whatsapp.routes";
import quotationRoutes from "./quotation.routes";
import customerRoutes from "./customer.routes";
import taskRoutes from "./task.routes";
import debugRoutes from "./debug.routes";
import teamRoutes from "./team.routes";
import reportRoutes from "./report.routes";

const router = Router();

router.use("/upload", uploadRoutes);

// Health check
router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SalesPro CRM API is running 🚀",
    timestamp: new Date().toISOString(),
  });
});

// Route groups
router.use("/auth", authRoutes);
router.use("/offices", officeRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/users", userRoutes);
router.use("/leads", leadRoutes);
router.use("/whatsapp", whatsappRoutes);
router.use("/quotations", quotationRoutes);
router.use("/customers", customerRoutes);
router.use("/tasks", taskRoutes);
router.use("/team", teamRoutes);
router.use("/reports", reportRoutes);
router.use("/debug", debugRoutes);

export default router;
