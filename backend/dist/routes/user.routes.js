"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const ctrl = new user_controller_1.UserController();
router.use(auth_middleware_1.authenticate);
// Specific routes before parameterized ones
router.get("/office/:officeId", ctrl.findByOffice.bind(ctrl));
router.get("/", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "MANAGER"), ctrl.findAll.bind(ctrl));
router.post("/", (0, auth_middleware_1.authorize)("SUPER_ADMIN"), ctrl.create.bind(ctrl));
router.get("/:id", ctrl.findById.bind(ctrl));
router.put("/:id", (0, auth_middleware_1.authorize)("SUPER_ADMIN", "MANAGER"), ctrl.update.bind(ctrl));
router.delete("/:id", (0, auth_middleware_1.authorize)("SUPER_ADMIN"), ctrl.deactivate.bind(ctrl));
exports.default = router;
//# sourceMappingURL=user.routes.js.map