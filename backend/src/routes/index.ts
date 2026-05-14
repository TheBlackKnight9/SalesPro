import { Router } from "express";
import authRoutes from "./auth.routes";
import officeRoutes from "./office.routes";
import dashboardRoutes from "./dashboard.routes";
import userRoutes from "./user.routes";
import leadRoutes from "./lead.routes";
import whatsappRoutes from "./whatsapp.routes";
import quotationRoutes from "./quotation.routes";
import customerRoutes from "./customer.routes";

const router = Router();

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

export default router;
