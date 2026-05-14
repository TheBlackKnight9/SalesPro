"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quotation_controller_1 = require("../controllers/quotation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const ctrl = new quotation_controller_1.QuotationController();
router.use(auth_middleware_1.authenticate);
router.post("/", ctrl.create.bind(ctrl));
router.get("/:id", ctrl.findById.bind(ctrl));
router.get("/:id/pdf", ctrl.downloadPdf.bind(ctrl));
exports.default = router;
//# sourceMappingURL=quotation.routes.js.map