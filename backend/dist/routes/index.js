"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const office_routes_1 = __importDefault(require("./office.routes"));
const dashboard_routes_1 = __importDefault(require("./dashboard.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const lead_routes_1 = __importDefault(require("./lead.routes"));
const whatsapp_routes_1 = __importDefault(require("./whatsapp.routes"));
const quotation_routes_1 = __importDefault(require("./quotation.routes"));
const router = (0, express_1.Router)();
// Health check
router.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "SalesPro CRM API is running 🚀",
        timestamp: new Date().toISOString(),
    });
});
// Route groups
router.use("/auth", auth_routes_1.default);
router.use("/offices", office_routes_1.default);
router.use("/dashboard", dashboard_routes_1.default);
router.use("/users", user_routes_1.default);
router.use("/leads", lead_routes_1.default);
router.use("/whatsapp", whatsapp_routes_1.default);
router.use("/quotations", quotation_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map