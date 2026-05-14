"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const office_controller_1 = require("../controllers/office.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const ctrl = new office_controller_1.OfficeController();
// All office routes require authentication
router.use(auth_middleware_1.authenticate);
router.get("/", ctrl.findAll.bind(ctrl));
router.get("/:id", ctrl.findById.bind(ctrl));
// Super Admin only
router.post("/", (0, auth_middleware_1.authorize)("SUPER_ADMIN"), ctrl.create.bind(ctrl));
router.put("/:id", (0, auth_middleware_1.authorize)("SUPER_ADMIN"), ctrl.update.bind(ctrl));
router.delete("/:id", (0, auth_middleware_1.authorize)("SUPER_ADMIN"), ctrl.delete.bind(ctrl));
exports.default = router;
//# sourceMappingURL=office.routes.js.map