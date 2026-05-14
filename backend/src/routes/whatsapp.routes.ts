import { Router } from "express";
import { WhatsappController } from "../controllers/whatsapp.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
const ctrl = new WhatsappController();

// Public Webhook endpoints (called by Meta)
router.get("/webhook", ctrl.verifyWebhook.bind(ctrl));
router.post("/webhook", ctrl.handleWebhook.bind(ctrl));

// Protected API endpoints
router.post("/send-template", authenticate, ctrl.sendTemplate.bind(ctrl));

export default router;
