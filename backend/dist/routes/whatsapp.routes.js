"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const whatsapp_controller_1 = require("../controllers/whatsapp.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const ctrl = new whatsapp_controller_1.WhatsappController();
// Public Webhook endpoints (called by Meta)
router.get("/webhook", ctrl.verifyWebhook.bind(ctrl));
router.post("/webhook", ctrl.handleWebhook.bind(ctrl));
// Protected API endpoints
router.post("/send-template", auth_middleware_1.authenticate, ctrl.sendTemplate.bind(ctrl));
exports.default = router;
//# sourceMappingURL=whatsapp.routes.js.map