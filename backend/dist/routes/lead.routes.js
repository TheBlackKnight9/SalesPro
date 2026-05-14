"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lead_controller_1 = require("../controllers/lead.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const ctrl = new lead_controller_1.LeadController();
router.use(auth_middleware_1.authenticate);
// Kanban (before /:id to avoid route collision)
router.get("/kanban", ctrl.getKanban.bind(ctrl));
// Core CRUD
router.get("/", ctrl.findAll.bind(ctrl));
router.post("/", ctrl.create.bind(ctrl));
router.get("/:id", ctrl.findById.bind(ctrl));
router.put("/:id", ctrl.update.bind(ctrl));
router.delete("/:id", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "MANAGER"), ctrl.delete.bind(ctrl));
// Pipeline operations
router.patch("/:id/status", ctrl.updateStatus.bind(ctrl));
router.patch("/:id/assign", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "MANAGER"), ctrl.assign.bind(ctrl));
router.post("/:id/convert", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "MANAGER"), ctrl.convert.bind(ctrl));
exports.default = router;
//# sourceMappingURL=lead.routes.js.map